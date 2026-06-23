/* ====================== MODE + EDITOR ====================== */
function setMode(m){
  mode=m;
  document.getElementById('modeStudent').classList.toggle('on',m==='student');
  document.getElementById('modeEditor').classList.toggle('on',m==='editor');
  if(m==='editor')openEditor();else closeEditor();
}
let _trailDirty=false;
function markDirty(){_trailDirty=true;}
function openEditor(){_trailDirty=false;renderEditor();document.getElementById('editor').classList.add('open');document.getElementById('editorBack').classList.add('open');
  // marca alterações sempre que algo no editor muda
  const body=document.getElementById('editorBody');
  if(body){body.addEventListener('input',markDirty);body.addEventListener('change',markDirty);}
}
function closeEditor(force){
  if(_trailDirty && !force){
    confirmModal('Sair sem salvar?','Há alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.',
      ()=>{_trailDirty=false;closeEditor(true);},{danger:true,confirmLabel:'Sair sem salvar'});
    return;
  }
  document.getElementById('editor').classList.remove('open');
  document.getElementById('editorBack').classList.remove('open');
  mode='student';
  document.getElementById('modeStudent').classList.add('on');
  document.getElementById('modeEditor').classList.remove('on');
}

function renderEditor(){
  document.getElementById('editorBody').innerHTML=`
    <div class="ed-toolbar no-print">
      <button class="btn btn-ghost btn-sm" onclick="exportTrail()">${ic('download',14)} Exportar JSON</button>
      <button class="btn btn-ghost btn-sm" onclick="importTrailPick()">${ic('upload',14)} Importar JSON</button>
    </div>

    <div class="ed-group">
      <div class="ed-group-title">${ic('trail',16)} Dados da trilha</div>
      <div class="fld"><label>Título da trilha</label><input class="inp" placeholder="Ex.: Boas Práticas de Fabricação" value="${esc(trail.title)}" oninput="trail.title=this.value;renderTop()"></div>
      <div class="fld"><label>Categoria / Tema (opcional)</label><input class="inp" placeholder="Ex.: Segurança, Integração, Qualidade" value="${esc(trail.category||'')}" oninput="trail.category=this.value" list="catList">
        <datalist id="catList">${[...new Set(trailsAll().map(t=>t.category).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="fld" style="margin-bottom:0;"><label>Descrição da trilha</label><textarea class="inp" placeholder="Resumo do que o aluno vai aprender" oninput="trail.subtitle=this.value">${esc(trail.subtitle)}</textarea></div>
    </div>

    <div class="ed-group">
      <div class="ed-group-title">${ic('certificate',16)} Certificado</div>
      <label class="cert-switch"><input type="checkbox" id="certEnabled" ${trail.certificate&&trail.certificate.enabled?'checked':''} onchange="trail.certificate.enabled=this.checked"> <span>Emitir certificado ao concluir 100% da trilha</span></label>
      <div class="fld" style="margin-top:12px;margin-bottom:10px;"><label>Assinatura do certificado</label><input class="inp" id="certSignature" value="${esc((trail.certificate&&trail.certificate.signature)||'Recursos Humanos')}" placeholder="Ex.: Recursos Humanos" oninput="trail.certificate.signature=this.value"></div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="previewCertificate()">${ic('eye',15)} Visualizar modelo do certificado</button>
    </div>

    <div class="ed-group">
      <div class="ed-group-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span>${ic('book',16)} Módulos <span class="ed-count">${trail.modules.length}</span></span>
      </div>
      <p class="ed-help">Adicione quantos módulos quiser. Reordene com as setas ↑ ↓. Cada módulo pode ter uma avaliação ao final.</p>
      <div class="add-module-bar">
        <span class="amb-label">${ic('plus',15)} Adicionar módulo:</span>
        ${Object.keys(CTYPE).map(t=>`<button class="btn-add-mod ${CTYPE[t].cls}" onclick="addModule('${t}')">${ic(CTYPE[t].icon,15)} ${CTYPE[t].label}</button>`).join('')}
      </div>
      <div id="edModules">${trail.modules.map((m,i)=>edModule(m,i)).join('')||edEmptyModules()}</div>
      ${trail.modules.length?`<div class="add-module-bar add-module-bar-bottom">
        <span class="amb-label">${ic('plus',15)} Adicionar outro:</span>
        ${Object.keys(CTYPE).map(t=>`<button class="btn-add-mod ${CTYPE[t].cls}" onclick="addModule('${t}')">${ic(CTYPE[t].icon,15)} ${CTYPE[t].label}</button>`).join('')}
      </div>`:''}
    </div>
  `;
}
function edEmptyModules(){return `<div class="callout callout-info">${ic('info',18)}<div>Nenhum módulo ainda. Use os botões "Adicionar módulo" acima para incluir vídeo, PDF ou texto.</div></div>`;}

function addModule(type){markDirty();
  // fecha os outros e abre só o novo, para ficar claro o que foi adicionado
  trail.modules.forEach(m=>m._open=false);
  trail.modules.push({id:uid(),name:'',contentType:type,src:'',fileName:'',text:'',materials:[],quiz:null,_open:true});
  if(totalModules()===1)currentIdx=0;
  renderEditor();render();
  // rola até o módulo recém-criado e foca no nome
  setTimeout(()=>{
    const idx=trail.modules.length-1;
    const el=document.getElementById('mod'+idx);
    if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
    const nameInput=document.querySelector('#mod'+idx+' .fld-row input.inp');
    if(nameInput)nameInput.focus();
  },60);
  toast('Módulo adicionado');
}
/* atualiza o nome do módulo sem re-renderizar o editor (preserva o foco) */
function onModuleNameInput(i,value){
  trail.modules[i].name=value;
  const def=CTYPE[trail.modules[i].contentType];
  const head=document.getElementById('emhName'+i);
  if(head)head.textContent=value||(def.label+' '+(i+1));
  renderRail();
}
function delModule(i){markDirty();trail.modules.splice(i,1);if(currentIdx>=totalModules())currentIdx=Math.max(0,totalModules()-1);renderEditor();render();}
function edToggle(i){trail.modules[i]._open=!trail.modules[i]._open;renderEditor();}

/* reordenar módulos (subir / descer) */
function moveModule(i,dir){markDirty();
  const j=i+dir;
  if(j<0||j>=trail.modules.length)return;
  const tmp=trail.modules[i];trail.modules[i]=trail.modules[j];trail.modules[j]=tmp;
  // mantém o módulo atual em foco coerente
  if(currentIdx===i)currentIdx=j;else if(currentIdx===j)currentIdx=i;
  renderEditor();render();
}

function edModule(m,i){
  const def=CTYPE[m.contentType];
  return `<div class="ed-module ${m._open?'open':''}" id="mod${i}">
    <div class="ed-mod-head">
      <div class="ed-reorder no-print">
        <button class="ord-btn" title="Subir" aria-label="Subir" ${i===0?'disabled':''} onclick="event.stopPropagation();moveModule(${i},-1)">${ic('chevU',15)}</button>
        <button class="ord-btn" title="Descer" aria-label="Descer" ${i===trail.modules.length-1?'disabled':''} onclick="event.stopPropagation();moveModule(${i},1)">${ic('chevD',15)}</button>
      </div>
      <div class="ed-mod-head-main" onclick="edToggle(${i})">
        <span class="emh-num">${i+1}</span>
        <span class="ct-ic ${def.cls}">${ic(def.icon,17)}</span>
        <span class="emh-name" id="emhName${i}">${esc(m.name)||def.label+' '+(i+1)}</span>
        ${m.quiz?`<span class="quiz-kind ${QKIND[m.quiz.kind].cls}" style="margin:0;">${m.quiz.kind==='poll'?'Enquete':(m.quiz.kind==='truefalse'?'V/F':'Quiz')}</span>`:''}
        <button class="iconbtn sm" onclick="event.stopPropagation();delModule(${i})">${ic('trash',14)}</button>
        ${ic(m._open?'chevD':'chevR',18)}
      </div>
    </div>
    <div class="ed-mod-body">
      <div class="fld-row">
        <div class="fld" style="flex:1;"><label>Nome do módulo</label><input class="inp" placeholder="Ex.: Introdução à norma" value="${esc(m.name)}" oninput="onModuleNameInput(${i},this.value)"></div>
        <div class="fld" style="width:130px;"><label>Duração (min)</label><input class="inp" type="number" min="0" step="5" value="${m.durationMin||0}" oninput="trail.modules[${i}].durationMin=Math.max(0,parseInt(this.value)||0)"></div>
      </div>
      ${edContent(m,i)}
      ${edMaterials(m,i)}
      ${edQuiz(m,i)}
    </div>
  </div>`;
}

function edContent(m,i){
  if(m.contentType==='youtube'){
    return `<div class="fld"><label>Link do vídeo (YouTube)</label><input class="inp" placeholder="https://www.youtube.com/watch?v=..." value="${esc(m.src)}" oninput="trail.modules[${i}].src=this.value;refreshIfCurrent(${i})"><div class="hint">Cole o endereço do vídeo. Ele será incorporado no player.</div></div>
    <div class="fld"><label>Descrição do conteúdo (texto abaixo do vídeo)</label><textarea class="inp" placeholder="Resumo da aula" oninput="trail.modules[${i}].text=this.value">${esc(m.text)}</textarea></div>`;
  }
  if(m.contentType==='mp4'){
    return `<div class="fld"><label>Arquivo de vídeo (MP4)</label>
      <button class="btn btn-ghost btn-sm" onclick="pickFile(${i},'mp4')">${ic('upload',15)} ${m.fileName?esc(m.fileName):'Selecionar MP4'}</button>
      ${m.fileName?`<span class="statuspill sp-done" style="margin-left:8px;">carregado</span>`:''}
      <div class="callout callout-warn" style="margin-top:10px;">${ic('warn',16)}<div>O MP4 é guardado como arquivo temporário desta sessão e não persiste ao recarregar. Para conteúdo permanente, prefira o YouTube.</div></div></div>
    <div class="fld"><label>Descrição do conteúdo</label><textarea class="inp" oninput="trail.modules[${i}].text=this.value">${esc(m.text)}</textarea></div>`;
  }
  if(m.contentType==='pdf'){
    return `<div class="fld"><label>Arquivo PDF</label>
      <button class="btn btn-ghost btn-sm" onclick="pickFile(${i},'pdf')">${ic('upload',15)} ${m.fileName?esc(m.fileName):'Selecionar PDF'}</button>
      ${m.fileName?`<span class="statuspill sp-done" style="margin-left:8px;">carregado</span>`:''}</div>
    <div class="fld"><label>Descrição do conteúdo</label><textarea class="inp" oninput="trail.modules[${i}].text=this.value">${esc(m.text)}</textarea></div>`;
  }
  // text
  return `<div class="fld"><label>Conteúdo (texto)</label><textarea class="inp" style="min-height:120px;" placeholder="Escreva o conteúdo da aula" oninput="trail.modules[${i}].text=this.value;refreshIfCurrent(${i})">${esc(m.text)}</textarea></div>`;
}

function edMaterials(m,i){
  m.materials=m.materials||[];
  return `<div class="fld"><label>Materiais complementares</label>
    ${m.materials.map((mat,j)=>`<div class="mat-row">
      <span class="mat-ic">${ic(mat.url&&mat.url.startsWith('data:')?'doc':'link',15)}</span>
      <input class="inp" placeholder="Nome do material" value="${esc(mat.name)}" oninput="trail.modules[${i}].materials[${j}].name=this.value" style="flex:1;">
      ${mat.url&&mat.url.startsWith('data:')
        ? `<span class="statuspill sp-done">PDF</span>`
        : `<input class="inp" placeholder="https://..." value="${esc(mat.url)}" oninput="trail.modules[${i}].materials[${j}].url=this.value" style="flex:1.2;">`}
      <button class="iconbtn sm" onclick="delMaterial(${i},${j})">${ic('x',13)}</button>
    </div>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
      <button class="btn btn-text btn-sm" onclick="addMaterial(${i})">${ic('link',14)} Adicionar link</button>
      <button class="btn btn-text btn-sm" onclick="addMaterialPdf(${i})">${ic('upload',14)} Subir PDF</button>
    </div>
    <div class="hint">Links abrem em nova aba; PDFs ficam embutidos no módulo.</div>
  </div>`;
}
function addMaterial(i){markDirty();trail.modules[i].materials=trail.modules[i].materials||[];trail.modules[i].materials.push({name:'',url:''});renderEditor();}
function addMaterialPdf(i){
  const inp=document.getElementById('filePick');
  inp.accept='application/pdf';
  inp.onchange=e=>{const f=e.target.files[0];if(!f){return;}
    const r=new FileReader();
    r.onload=ev=>{trail.modules[i].materials=trail.modules[i].materials||[];trail.modules[i].materials.push({name:f.name.replace(/\.pdf$/i,''),url:ev.target.result});renderEditor();render();toast('PDF de material carregado');};
    r.readAsDataURL(f);inp.value='';};
  inp.click();
}
function delMaterial(i,j){trail.modules[i].materials.splice(j,1);renderEditor();}

/* ---------- quiz editor (múltiplas perguntas + nota mínima) ---------- */
function edQuiz(m,i){
  if(!m.quiz){
    return `<div style="border-top:1px solid var(--gray-100);padding-top:14px;margin-top:8px;">
      <button class="btn btn-ghost btn-sm" onclick="addQuiz(${i})">${ic('quiz',15)} Adicionar avaliação ao final</button>
      <div class="hint">Prova, enquete ou verdadeiro/falso — opcional por módulo.</div>
    </div>`;
  }
  const q=m.quiz;
  return `<div style="border-top:1px solid var(--gray-100);padding-top:14px;margin-top:8px;">
    <div class="ed-section-title" style="margin-top:0;">Avaliação <button class="iconbtn sm" onclick="delQuiz(${i})">${ic('trash',14)}</button></div>
    <div class="fld"><label>Tipo de avaliação</label>
      <div class="type-pills">
        ${Object.keys(QKIND).map(k=>`<button class="type-pill ${q.kind===k?'on':''}" onclick="setQuizKind(${i},'${k}')">${ic(QKIND[k].icon,13)} ${k==='quiz'?'Prova':(k==='poll'?'Enquete':'V / F')}</button>`).join('')}
      </div>
      <div class="hint">${q.kind==='poll'?'Enquete não tem resposta certa — serve para engajamento.':(q.kind==='truefalse'?'Cada pergunta tem Verdadeiro e Falso. Marque a correta.':'Prova com resposta certa. Marque a alternativa correta em cada pergunta.')}</div>
    </div>
    ${q.kind!=='poll'?`<div class="fld"><label>Nota mínima para aprovar (%)</label>
      <input class="inp inp-num" type="number" min="0" max="100" step="5" value="${q.passThreshold}" oninput="trail.modules[${i}].quiz.passThreshold=Math.max(0,Math.min(100,parseInt(this.value)||0))">
      <div class="hint">O aluno precisa atingir esse percentual de acerto. Pode refazer quantas vezes quiser.</div></div>`:''}

    <label style="font-size:12px;font-weight:800;color:var(--gray-700);">Perguntas <span class="muted">(${q.questions.length})</span></label>
    <div style="margin-top:8px;">
      ${q.questions.map((qq,qi)=>edQuestion(m,i,qq,qi)).join('')}
    </div>
    <button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="addQuestion(${i})">${ic('plus',14)} Adicionar pergunta</button>
  </div>`;
}
function edQuestion(m,i,qq,qi){
  const q=m.quiz;
  return `<div class="ed-quiz-q">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span class="ed-q-num">Pergunta ${qi+1}</span>
      ${q.questions.length>1?`<button class="iconbtn sm" title="Remover pergunta" aria-label="Remover pergunta" onclick="delQuestion(${i},${qi})">${ic('trash',13)}</button>`:''}
    </div>
    <div class="fld" style="margin-bottom:10px;"><input class="inp" placeholder="Digite a pergunta" value="${esc(qq.q)}" oninput="trail.modules[${i}].quiz.questions[${qi}].q=this.value;refreshIfCurrent(${i})"></div>
    <label style="font-size:11.5px;font-weight:800;color:var(--gray-600);">Alternativas${q.kind!=='poll'?' (marque a correta)':''}</label>
    <div style="margin-top:6px;">
    ${qq.options.map((o,oi)=>`<div class="ed-opt-row">
      ${q.kind!=='poll'?`<input type="radio" name="ed_correct_${i}_${qi}" ${qq.correct===oi?'checked':''} onclick="trail.modules[${i}].quiz.questions[${qi}].correct=${oi}" title="Correta" aria-label="Correta">`:`<span style="width:17px;flex-shrink:0;"></span>`}
      <input class="inp" placeholder="Alternativa ${oi+1}" value="${esc(o)}" oninput="trail.modules[${i}].quiz.questions[${qi}].options[${oi}]=this.value;refreshIfCurrent(${i})" ${q.kind==='truefalse'?'readonly style="background:var(--gray-050);"':''}>
      ${q.kind!=='truefalse'&&qq.options.length>2?`<button class="iconbtn sm" onclick="delOption(${i},${qi},${oi})">${ic('x',13)}</button>`:''}
    </div>`).join('')}
    </div>
    ${q.kind!=='truefalse'?`<button class="btn btn-text btn-sm" onclick="addOption(${i},${qi})">${ic('plus',14)} Alternativa</button>`:''}
  </div>`;
}
function addQuiz(i){markDirty();trail.modules[i].quiz=normalizeQuiz({kind:'quiz',passThreshold:DEFAULT_THRESHOLD,questions:[{q:'',options:['',''],correct:0}]});renderEditor();render();}
function delQuiz(i){markDirty();trail.modules[i].quiz=null;renderEditor();render();}
function setQuizKind(i,k){
  const q=trail.modules[i].quiz;q.kind=k;
  if(k==='poll')q.passThreshold=null; else if(typeof q.passThreshold!=='number')q.passThreshold=DEFAULT_THRESHOLD;
  q.questions.forEach(qq=>{
    if(k==='truefalse'){qq.options=['Verdadeiro','Falso'];if(qq.correct>1)qq.correct=0;}
    else if(k==='poll'){qq.correct=null;if(qq.options.length<2)qq.options=['',''];}
    else{if(qq.correct===null||qq.correct===undefined)qq.correct=0;if(qq.options.length<2)qq.options=['',''];}
  });
  renderEditor();render();
}
function addQuestion(i){markDirty();trail.modules[i].quiz.questions.push(blankQuestion(trail.modules[i].quiz.kind));renderEditor();render();}
function delQuestion(i,qi){markDirty();const q=trail.modules[i].quiz;q.questions.splice(qi,1);if(q.questions.length===0)q.questions.push(blankQuestion(q.kind));renderEditor();render();}
function blankQuestion(kind){
  if(kind==='truefalse')return {q:'',options:['Verdadeiro','Falso'],correct:0};
  if(kind==='poll')return {q:'',options:['',''],correct:null};
  return {q:'',options:['',''],correct:0};
}
function addOption(i,qi){markDirty();trail.modules[i].quiz.questions[qi].options.push('');renderEditor();}
function delOption(i,qi,oi){markDirty();const qq=trail.modules[i].quiz.questions[qi];qq.options.splice(oi,1);if(qq.correct!==null&&qq.correct>=qq.options.length)qq.correct=0;renderEditor();render();}

/* ---------- file upload ---------- */
function pickFile(i,kind){
  const inp=document.getElementById('filePick');
  inp.accept=kind==='mp4'?'video/mp4':'application/pdf';
  inp.onchange=e=>{const f=e.target.files[0];if(!f){return;}const m=trail.modules[i];m.fileName=f.name;
    // PRODUÇÃO: sobe para o Firebase Storage e guarda só a URL/metadados
    if(window.RAGUIFE_CLOUD&&window.RAGUIFE_CLOUD.enabled&&typeof cloudUpload==='function'){
      toast('Enviando '+(kind==='mp4'?'vídeo':'PDF')+'...');
      cloudUpload(f,{folder:kind==='mp4'?'videos':'pdfs'},pct=>{
        const hint=document.getElementById('uplHint'+i);if(hint)hint.textContent='Enviando... '+pct+'%';
      }).then(res=>{
        m.src=res.url;m.fileSize=res.size;m.origem='upload';m.storagePath=res.path||'';m.mp4Blob=false;m.mp4Missing=false;
        if(typeof cloudSaveFileMeta==='function')cloudSaveFileMeta({url:res.url,tipo:kind,nomeArquivo:res.name,tamanho:res.size,trilhaId:trail.id,moduloId:m.id,criadoPor:(window._cu&&window._cu.email)||'',origem:'upload'});
        renderEditor();render();toast((kind==='mp4'?'Vídeo':'PDF')+' enviado e salvo na nuvem');
      }).catch(err=>{console.warn(err);toast('Falha no envio. Verifique a conexão.',true);});
      inp.value='';return;
    }
    // DEMO/local
    if(kind==='mp4'){m.src=URL.createObjectURL(f);m.mp4Blob=true;m.mp4Missing=false;m.origem='upload';renderEditor();render();toast('Vídeo carregado (sessão)');}
    else{const r=new FileReader();r.onload=ev=>{m.src=ev.target.result;m.origem='upload';renderEditor();render();toast('PDF carregado');};r.readAsDataURL(f);}
    inp.value='';};
  inp.click();
}
function refreshIfCurrent(i){if(i===currentIdx){document.getElementById('mediaStage')&&(document.getElementById('mediaStage').innerHTML=mediaStage(trail.modules[i]));renderRail();}}

function saveTrail(){
  if(!trail.title.trim()){toast('Dê um título à trilha',true);return;}
  save();render();toast('Trilha salva');closeEditor();
}

/* ---------- exportar / importar trilha em JSON ---------- */
function exportTrail(){
  if(!trail.title.trim()){toast('Dê um título antes de exportar',true);return;}
  const clone=JSON.parse(JSON.stringify(trail));
  clone.modules.forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}});
  const blob=new Blob([JSON.stringify(clone,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=(trail.title.replace(/[^a-zA-Z0-9-_ ]/g,'').trim()||'trilha')+'.json';
  document.body.appendChild(a);a.click();a.remove();
  URL.revokeObjectURL(url);
  toast('Trilha exportada');
}
function importTrailPick(){
  const inp=document.getElementById('filePick');
  inp.accept='application/json,.json';
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data||typeof data!=='object'||!Array.isArray(data.modules)){
          toast('Arquivo não parece uma trilha válida',true);return;
        }
        // mantém um id próprio para não sobrescrever outra trilha
        trail=normalizeTrail(Object.assign({
          id:trail.id||('t_'+Date.now().toString(36)),
          title:'',subtitle:'',modules:[]
        },data));
        if(!trail.id)trail.id='t_'+Date.now().toString(36);
        currentIdx=0;
        renderEditor();render();
        toast('Trilha importada — revise e salve');
      }catch(err){toast('JSON inválido',true);}
    };
    r.readAsText(f);inp.value='';
  };
  inp.click();
}
