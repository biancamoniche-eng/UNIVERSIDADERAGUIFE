/* ============================================================
   firebase-sync.js — camada de produção (Rota B)
   ------------------------------------------------------------
   Integra Firebase Auth + Firestore + Storage SEM reescrever o app.
   - Se o Firebase não estiver configurado -> MODO DEMO (offline, localStorage).
   - Se estiver -> Firebase vira a base oficial; localStorage é só cache/fallback.

   Estratégia de sincronização:
   - O app continua usando o objeto `db` em memória + dbSave()/dbLoad() locais.
   - Esta camada espelha `db` em um documento Firestore (autosave debounced),
     com controle de versão (updatedAt/updatedBy/version) e merge ao reconectar.
   - Uploads de vídeo/PDF/imagem vão para o Storage; o Firestore guarda só metadados.

   Carrega os SDKs do Firebase via CDN (compat) dinamicamente, só quando há config.
============================================================ */
(function(){
  const CFG=window.FIREBASE_CONFIG||{};
  function isCfgValid(){
    const c=window.FIREBASE_CONFIG||{};
    const isPlaceholder=v=>!v||/^(COLE_AQUI|PREENCHER)/.test(v);
    return !window.FORCE_DEMO_MODE && !isPlaceholder(c.apiKey) && !isPlaceholder(c.projectId);
  }
  const cfgValid = isCfgValid();

  // estado global exposto
  window.RAGUIFE_CLOUD = {
    enabled:false,        // Firebase ativo?
    ready:false,          // SDK carregado e inicializado?
    online:navigator.onLine,
    user:null,            // usuário do Firebase Auth
    status:'demo',        // 'demo' | 'connecting' | 'online' | 'offline' | 'error'
    lastSync:null,
    version:0
  };

  const SDK_VERSION='10.12.2';
  const SDKS=[
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-compat.js`,
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth-compat.js`,
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore-compat.js`,
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-storage-compat.js`
  ];
  function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Falha ao carregar '+src));document.head.appendChild(s);});}

  let fb=null, auth=null, fs=null, storage=null;
  const DOC_PATH={collection:'configuracoes',doc:'estado_sistema'}; // documento-espelho do db

  /* ---------- inicialização ---------- */
  async function init(){
    if(!isCfgValid()){ setStatus('demo'); return; }
    const CFG=window.FIREBASE_CONFIG||{};
    setStatus('connecting');
    try{
      if(!window.firebase){
        for(const url of SDKS){ await loadScript(url); }
      }
      fb=window.firebase;
      fb.initializeApp(CFG);
      auth=fb.auth();
      fs=fb.firestore();
      storage=fb.storage();
      // cache offline do Firestore (persistência local nativa)
      try{ await fs.enablePersistence({synchronizeTabs:true}); }catch(e){ /* multi-aba pode falhar; ok */ }
      window.RAGUIFE_CLOUD.enabled=true;
      window.RAGUIFE_CLOUD.ready=true;
      setStatus(navigator.onLine?'online':'offline');
      bindConnectivity();
      bindAuthState();
    }catch(e){
      console.warn('[Firebase] init falhou, modo demo:',e);
      setStatus('error');
      window.RAGUIFE_CLOUD.enabled=false;
    }
  }

  function setStatus(s){
    window.RAGUIFE_CLOUD.status=s;
    if(typeof window.onCloudStatus==='function')window.onCloudStatus(s);
    const el=document.getElementById('cloudBadge');
    if(el)renderCloudBadge(el);
  }
  function bindConnectivity(){
    window.addEventListener('online',()=>{window.RAGUIFE_CLOUD.online=true;setStatus('online');pushNow();});
    window.addEventListener('offline',()=>{window.RAGUIFE_CLOUD.online=false;setStatus('offline');});
  }

  /* ---------- AUTH ---------- */
  function bindAuthState(){
    auth.onAuthStateChanged(async (u)=>{
      window.RAGUIFE_CLOUD.user=u||null;
      if(u){
        // garante doc de usuário e carrega o estado do sistema
        await ensureUserDoc(u);
        await pullState();
        // se o app ainda não entrou, deixa o app.js decidir via cloudResolveSession
        if(typeof window.cloudResolveSession==='function')window.cloudResolveSession(u);
      }
    });
  }
  // login por email/senha (produção). Retorna {ok,user|error}
  window.cloudLogin=async function(email,password){
    if(!window.RAGUIFE_CLOUD.enabled){ return {ok:false,demo:true}; }
    try{
      const cred=await auth.signInWithEmailAndPassword(email,password);
      return {ok:true,user:cred.user};
    }catch(e){
      // se o usuário existe no Firestore mas não no Auth, tenta criar (primeiro acesso)
      return {ok:false,error:mapAuthError(e)};
    }
  };
  window.cloudCreateAuthUser=async function(email,password){
    if(!window.RAGUIFE_CLOUD.enabled)return {ok:false,demo:true};
    try{const cred=await auth.createUserWithEmailAndPassword(email,password);return {ok:true,user:cred.user};}
    catch(e){return {ok:false,error:mapAuthError(e)};}
  };
  window.cloudLogout=async function(){ if(auth)try{await auth.signOut();}catch(e){} };
  function mapAuthError(e){
    const c=(e&&e.code)||'';
    if(c.includes('user-not-found'))return 'E-mail não cadastrado';
    if(c.includes('wrong-password')||c.includes('invalid-credential'))return 'Senha incorreta';
    if(c.includes('too-many-requests'))return 'Muitas tentativas. Aguarde um momento.';
    if(c.includes('network'))return 'Sem conexão com o servidor';
    return 'Não foi possível entrar';
  }
  async function ensureUserDoc(u){
    try{
      const ref=fs.collection('usuarios').doc(u.uid);
      // descobre o papel do usuário no cadastro do sistema (estado local/nuvem)
      let role='collaborator';
      try{
        const sys=(window.db&&window.db.users||[]).find(x=>(x.email||'').toLowerCase()===(u.email||'').toLowerCase());
        if(sys&&sys.role)role=sys.role;
      }catch(e){}
      await ref.set({email:u.email,role:role,uid:u.uid,updatedAt:now()},{merge:true});
    }catch(e){console.warn('ensureUserDoc',e);}
  }

  /* ---------- SYNC do estado (db) ---------- */
  function now(){return (fb&&fb.firestore&&fb.firestore.FieldValue)?fb.firestore.FieldValue.serverTimestamp():new Date().toISOString();}
  let pushTimer=null, lastPushedJSON='';
  // chamado pelo app sempre que dbSave() roda
  window.cloudPushDebounced=function(){
    if(!window.RAGUIFE_CLOUD.enabled)return;
    if(pushTimer)clearTimeout(pushTimer);
    setSaving(true);
    pushTimer=setTimeout(pushNow,1200);
  };
  async function pushNow(force){
    if(!window.RAGUIFE_CLOUD.enabled||!window.db)return;
    try{
      const payload=JSON.parse(JSON.stringify(window.db));
      // não enviar blobs locais de mp4
      (payload.trails||[]).forEach(t=>(t.modules||[]).forEach(m=>{if(m.mp4Blob){m.mp4Blob=null;}}));
      const json=JSON.stringify(payload);
      if(!force&&json===lastPushedJSON){ setSaving(false); return; }
      const ver=(window.RAGUIFE_CLOUD.version||0)+1;
      await fs.collection(DOC_PATH.collection).doc(DOC_PATH.doc).set({
        estado:payload,
        version:ver,
        updatedAt:now(),
        updatedBy:(window._cu&&window._cu.email)||(window.RAGUIFE_CLOUD.user&&window.RAGUIFE_CLOUD.user.email)||'sistema'
      },{merge:true});
      window.RAGUIFE_CLOUD.version=ver;
      window.RAGUIFE_CLOUD.lastSync=new Date();
      lastPushedJSON=json;
      await logAction('sync_push',{version:ver});
      setSaving(false,true);
    }catch(e){
      console.warn('[Firebase] push falhou:',e);
      setSaving(false);
      setStatus(navigator.onLine?'error':'offline');
    }
  }
  async function pullState(){
    if(!window.RAGUIFE_CLOUD.enabled)return;
    try{
      const ref=fs.collection(DOC_PATH.collection).doc(DOC_PATH.doc);
      const snap=await ref.get();
      if(snap.exists){
        const data=snap.data();
        if(data&&data.estado){
          window.RAGUIFE_CLOUD.version=data.version||0;
          // MIGRAÇÃO: se a nuvem tem poucos dados mas o local tem cadastro, mescla local→nuvem
          await migrateIfNeeded(data.estado);
          if(typeof window.cloudApplyState==='function')window.cloudApplyState(data.estado);
          lastPushedJSON=JSON.stringify(data.estado);
        }
      }else{
        // primeira vez no projeto: sobe o estado local atual como base (migração inicial)
        await pushNow(true);
      }
      window.RAGUIFE_CLOUD.lastSync=new Date();
      startRealtime(); // passa a ouvir mudanças em tempo real
    }catch(e){console.warn('[Firebase] pull falhou:',e);}
  }

  /* MIGRAÇÃO: se há dados locais (demo) que não estão na nuvem, mescla sem apagar nada */
  async function migrateIfNeeded(cloudState){
    try{
      const local=window.db;
      if(!local)return;
      const cloudUsers=(cloudState.users||[]).length;
      const localUsers=(local.users||[]).length;
      // se a nuvem está praticamente vazia e o local tem mais dados, sobe o local
      const cloudTrails=(cloudState.trails||[]).length, localTrails=(local.trails||[]).length;
      if((localUsers>cloudUsers)||(localTrails>cloudTrails)){
        const merged=mergeStates(cloudState,JSON.parse(JSON.stringify(local)));
        Object.assign(cloudState,merged);
        // marca para subir a versão mesclada
        setTimeout(()=>pushNow(true),500);
        if(typeof toast==='function')toast('Dados locais migrados para a nuvem');
      }
    }catch(e){console.warn('migrate',e);}
  }
  // merge simples por id (nuvem como base, adiciona itens locais ausentes)
  function mergeStates(cloud,local){
    const byId=(arr)=>{const m={};(arr||[]).forEach(x=>{if(x&&x.id)m[x.id]=x;});return m;};
    const merge=(c,l)=>{const m=byId(c);(l||[]).forEach(x=>{if(x&&x.id&&!m[x.id])m[x.id]=x;});return Object.values(m);};
    return {
      users:merge(cloud.users,local.users),
      trails:merge(cloud.trails,local.trails),
      events:merge(cloud.events,local.events),
      certificates:merge(cloud.certificates,local.certificates),
      progressByUser:Object.assign({},local.progressByUser||{},cloud.progressByUser||{}),
      cargoTrails:Object.assign({},local.cargoTrails||{},cloud.cargoTrails||{}),
      lastAccess:Object.assign({},local.lastAccess||{},cloud.lastAccess||{})
    };
  }

  /* REALTIME: ouve mudanças e atualiza todos os usuários conectados */
  let unsub=null;
  function startRealtime(){
    if(unsub||!window.RAGUIFE_CLOUD.enabled)return;
    try{
      unsub=fs.collection(DOC_PATH.collection).doc(DOC_PATH.doc)
        .onSnapshot({includeMetadataChanges:false},snap=>{
          if(!snap.exists)return;
          const data=snap.data();if(!data||!data.estado)return;
          // ignora o próprio push (evita loop)
          const incoming=JSON.stringify(data.estado);
          if(incoming===lastPushedJSON)return;
          if((data.version||0)<window.RAGUIFE_CLOUD.version)return; // versão antiga
          window.RAGUIFE_CLOUD.version=data.version||0;
          lastPushedJSON=incoming;
          if(typeof window.cloudApplyState==='function')window.cloudApplyState(data.estado);
          if(typeof toast==='function'&&window._cu)toast('Dados atualizados');
        },err=>console.warn('[Firebase] realtime erro:',err));
    }catch(e){console.warn('startRealtime',e);}
  }

  /* ---------- STORAGE (uploads) ---------- */
  // sobe um arquivo e retorna {url,path,size,type,name}. onProgress(0..100) opcional.
  window.cloudUpload=async function(file,opts,onProgress){
    opts=opts||{};
    if(!window.RAGUIFE_CLOUD.enabled){
      // modo demo: devolve objectURL temporário (não persiste entre sessões)
      return {url:URL.createObjectURL(file),path:null,size:file.size,type:file.type,name:file.name,demo:true};
    }
    const folder=opts.folder||'arquivos';
    const path=`${folder}/${Date.now()}_${(file.name||'arquivo').replace(/[^\w.\-]/g,'_')}`;
    const ref=storage.ref().child(path);
    return await new Promise((resolve,reject)=>{
      const task=ref.put(file,{contentType:file.type});
      task.on('state_changed',
        s=>{ if(onProgress)onProgress(Math.round(s.bytesTransferred/s.totalBytes*100)); },
        err=>reject(err),
        async ()=>{ const url=await task.snapshot.ref.getDownloadURL();
          resolve({url,path,size:file.size,type:file.type,name:file.name}); }
      );
    });
  };
  // registra metadados do arquivo no Firestore (coleção arquivos)
  window.cloudSaveFileMeta=async function(meta){
    if(!window.RAGUIFE_CLOUD.enabled)return null;
    try{const ref=await fs.collection('arquivos').add(Object.assign({criadoEm:now()},meta));return ref.id;}
    catch(e){console.warn('saveFileMeta',e);return null;}
  };

  /* ---------- LOGS / auditoria ---------- */
  window.cloudLog=logAction;
  async function logAction(acao,detalhe){
    if(!window.RAGUIFE_CLOUD.enabled)return;
    try{await fs.collection('logs').add({acao,detalhe:detalhe||{},por:(window._cu&&window._cu.email)||'sistema',em:now()});}
    catch(e){/* logs não devem quebrar o app */}
  }

  /* ---------- indicador salvando/salvo ---------- */
  function setSaving(saving,done){
    if(typeof window.onCloudSaving==='function')window.onCloudSaving(saving,done);
    const el=document.getElementById('cloudBadge');
    if(el)renderCloudBadge(el,saving,done);
  }
  window.renderCloudBadge=renderCloudBadge;
  function renderCloudBadge(el,saving,done){
    const C=window.RAGUIFE_CLOUD;
    let txt,cls;
    if(!C.enabled){txt='Demo (local)';cls='cb-demo';}
    else if(saving){txt='Salvando...';cls='cb-saving';}
    else if(done){txt='Salvo ✓';cls='cb-ok';}
    else if(C.status==='online'){txt='Sincronizado';cls='cb-ok';}
    else if(C.status==='offline'){txt='Offline';cls='cb-off';}
    else if(C.status==='connecting'){txt='Conectando...';cls='cb-saving';}
    else if(C.status==='error'){txt='Erro de conexão';cls='cb-off';}
    else {txt='Demo (local)';cls='cb-demo';}
    el.className='cloud-badge '+cls;
    el.textContent=txt;
  }

  // expõe init para o app chamar após carregar o resto
  window.cloudInit=init;
  window.cloudPullState=pullState;
})();
