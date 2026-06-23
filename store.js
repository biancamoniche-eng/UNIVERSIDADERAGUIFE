/* ============================================================
   store.js — estado global do sistema (localStorage, sem backend).
   Tudo começa VAZIO. O RH cria usuários e trilhas durante o uso.

   Modelo:
   db = {
     users:   [ { id, name, email, role:'collaborator|manager|rh', sector, managerId, createdAt } ],
     trails:  [ trail ],                 // mesmo formato do módulo de trilha
     progressByUser: { "<userId>__<trailId>": { done, polls, passed, scores } },
     events:  [ { id, title, date, local, desc, attendees:[userId] } ],
     certificates: [ { id, userId, trailId, trailTitle, userName, issuedAt } ]
   }
   session = { userId }   // quem está logado
============================================================ */
const DB_KEY='raguife_sistema_v1';
const SESSION_KEY='raguife_sistema_sessao';

let db={ users:[], trails:[], progressByUser:{}, events:[], certificates:[], cargoTrails:{}, lastAccess:{} };
try{window.db=db;}catch(e){}
let session=null;          // { userId }
let currentUser=null;      // objeto do usuário logado
try{Object.defineProperty(window,'_cu',{get:()=>currentUser});}catch(e){}
let currentTrailId=null;   // trilha aberta na Aprendizagem

function dbLoad(){
  try{const raw=localStorage.getItem(DB_KEY);if(raw){const d=JSON.parse(raw);
    db.users=d.users||[];db.trails=(d.trails||[]).map(normalizeTrail);
    db.progressByUser=d.progressByUser||{};
    db.events=(d.events||[]).map(e=>{
      e.assignment=e.assignment||{mode:'all',sectors:[],cargos:[],userIds:[]};
      e.participants=e.participants||[];
      e.vagas=Number(e.vagas)||0;e.hours=Number(e.hours)||0;
      // migra modelo antigo (attendees) → participants
      if((e.attendees||[]).length&&!e.participants.length){
        e.participants=e.attendees.map(uid=>({userId:uid,status:'inscrito',enrolledAt:e.date||new Date().toISOString(),confirmedAt:null,confirmedBy:null}));
      }
      e.attendees=e.attendees||[];
      return e;
    });
    db.certificates=d.certificates||[];
    db.cargoTrails=d.cargoTrails||{};   // { cargo: [trailId,...] } — trilhas obrigatórias por cargo
    db.lastAccess=d.lastAccess||{};     // { userId: ISOdate }
  }
  }catch(e){console.warn('store load',e);}
  try{const s=localStorage.getItem(SESSION_KEY);if(s)session=JSON.parse(s);}catch(e){}
  seedDefaults();
}
/* cria o usuário RH padrão (rh@raguife.com.br / R@guife123) se ainda não existir */
function seedDefaults(){
  const hasRh=db.users.some(u=>(u.email||'').toLowerCase()==='rh@raguife.com.br');
  if(!hasRh){
    db.users.unshift({
      id:newId('u'),name:'RH Raguife',role:'rh',sector:'Recursos Humanos',
      email:'rh@raguife.com.br',password:'R@guife123',managerId:null,login:'',
      createdAt:new Date().toISOString()
    });
    dbSave();
  }
}
function dbSave(){
  try{
    const clone=JSON.parse(JSON.stringify(db));
    // blobs de mp4 não persistem
    clone.trails.forEach(t=>(t.modules||[]).forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}}));
    localStorage.setItem(DB_KEY,JSON.stringify(clone));
  }catch(e){if(e.name==='QuotaExceededError')toast('Armazenamento cheio',true);else console.warn('store save',e);}
  // sincroniza com a nuvem (Firebase) quando habilitado — debounced
  if(typeof window.cloudPushDebounced==='function')window.cloudPushDebounced();
}
/* aplica um estado vindo da nuvem no db em memória (chamado pelo firebase-sync) */
window.cloudApplyState=function(state){
  if(!state||typeof state!=='object')return;
  db.users=Array.isArray(state.users)?state.users:[];
  db.trails=(Array.isArray(state.trails)?state.trails:[]).map(normalizeTrail);
  db.progressByUser=state.progressByUser||{};
  db.events=(state.events||[]).map(e=>{e.assignment=e.assignment||{mode:'all',sectors:[],cargos:[],userIds:[]};e.participants=e.participants||[];e.attendees=e.attendees||[];return e;});
  db.certificates=Array.isArray(state.certificates)?state.certificates:[];
  db.cargoTrails=state.cargoTrails||{};
  db.lastAccess=state.lastAccess||{};
  seedDefaults();
  try{localStorage.setItem(DB_KEY,JSON.stringify(db));}catch(e){}
  // re-renderiza a tela atual se o app já estiver montado
  if(typeof activeScreen!=='undefined'&&activeScreen&&activeScreen!=='login'&&typeof go==='function')go(activeScreen);
};
function sessionSave(){try{localStorage.setItem(SESSION_KEY,JSON.stringify(session));}catch(e){}}
function sessionClear(){session=null;currentUser=null;try{localStorage.removeItem(SESSION_KEY);}catch(e){}}

function newId(p){return p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

/* ---------- usuários ---------- */
function usersAll(){return db.users;}
function userById(id){return db.users.find(u=>u.id===id)||null;}
function userCreate({name,email,role,sector,cargo,managerId,login,password}){
  const u={id:newId('u'),name:(name||'').trim(),email:(email||'').trim(),
    role:role||'collaborator',sector:(sector||'').trim(),cargo:(cargo||'').trim(),
    managerId:managerId||null,login:(login||'').trim(),
    password:(password&&password.trim())||defaultPassword(name),
    createdAt:new Date().toISOString()};
  db.users.push(u);dbSave();return u;
}
function userUpdate(id,patch){const u=userById(id);if(!u)return null;Object.assign(u,patch);dbSave();return u;}
function userDelete(id){
  db.users=db.users.filter(u=>u.id!==id);
  // limpa progresso e certificados órfãos do usuário
  Object.keys(db.progressByUser).forEach(k=>{if(k.startsWith(id+'__'))delete db.progressByUser[k];});
  db.certificates=db.certificates.filter(c=>c.userId!==id);
  db.events.forEach(e=>{e.attendees=(e.attendees||[]).filter(uid=>uid!==id);});
  dbSave();
}
function collaboratorsOf(managerId){return db.users.filter(u=>u.managerId===managerId);}

/* senha padrão = primeira letra do primeiro nome + último sobrenome (minúsculo)
   Ex.: "Carlos Silva" -> "csilva" */
function defaultPassword(name){
  const parts=(name||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!parts.length)return '';
  if(parts.length===1)return parts[0];
  return parts[0].charAt(0)+parts[parts.length-1];
}
function userByEmail(email){
  const e=(email||'').trim().toLowerCase();
  return db.users.find(u=>(u.email||'').toLowerCase()===e)||null;
}
/* autentica por e-mail + senha (todos os perfis) */
function authenticate(email,password){
  const u=userByEmail(email);
  if(!u)return {ok:false,error:'E-mail não encontrado'};
  const senha=u.password||defaultPassword(u.name); // se não tiver senha definida, usa a padrão
  if(senha!==password)return {ok:false,error:'Senha incorreta'};
  return {ok:true,user:u};
}

/* ---------- trilhas ---------- */
function trailsAll(){return db.trails;}
function trailsPublished(){return db.trails.filter(t=>t.status==='published');}
/* trilhas visíveis para um colaborador, respeitando a atribuição */
function trailsForUser(u){
  if(!u)return [];
  return trailsPublished().filter(t=>{
    const a=t.assignment||{mode:'all'};
    if(a.mode==='all')return true;
    const bySector=(a.sectors||[]).includes(u.sector);
    const byUser=(a.userIds||[]).includes(u.id);
    return bySector||byUser;
  });
}
function trailById(id){return db.trails.find(t=>t.id===id)||null;}
function trailUpsert(t){
  t=normalizeTrail(t);
  const i=db.trails.findIndex(x=>x.id===t.id);
  if(i>=0)db.trails[i]=t;else db.trails.push(t);
  dbSave();return t;
}
function trailDelete(id){
  db.trails=db.trails.filter(t=>t.id!==id);
  // limpa progresso e certificados órfãos da trilha
  Object.keys(db.progressByUser).forEach(k=>{if(k.endsWith('__'+id))delete db.progressByUser[k];});
  db.certificates=db.certificates.filter(c=>c.trailId!==id);
  dbSave();
}

/* ---------- backup geral (exportar/importar todo o sistema) ---------- */
function exportBackup(){
  const clone=JSON.parse(JSON.stringify(db));
  clone.trails.forEach(t=>(t.modules||[]).forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}}));
  return {version:1,exportedAt:new Date().toISOString(),db:clone};
}
function importBackup(payload){
  if(!payload||!payload.db||typeof payload.db!=='object')throw new Error('Arquivo de backup inválido.');
  const d=payload.db;
  db.users=Array.isArray(d.users)?d.users:[];
  db.trails=(Array.isArray(d.trails)?d.trails:[]).map(normalizeTrail);
  db.progressByUser=d.progressByUser||{};
  db.events=Array.isArray(d.events)?d.events:[];
  db.certificates=Array.isArray(d.certificates)?d.certificates:[];
  dbSave();
}

/* ---------- progresso por usuário ---------- */
function progKey(userId,trailId){return userId+'__'+trailId;}
function progressGet(userId,trailId){
  const p=db.progressByUser[progKey(userId,trailId)];
  return p?JSON.parse(JSON.stringify(p)):{done:[],polls:{},passed:{},scores:{},attempts:{}};
}
function progressSet(userId,trailId,prog){
  db.progressByUser[progKey(userId,trailId)]={
    done:prog.done||[],polls:prog.polls||{},passed:prog.passed||{},scores:prog.scores||{},attempts:prog.attempts||{},
    updatedAt:new Date().toISOString()
  };
  dbSave();
}
function trailPct(userId,t){
  if(!t||!t.modules.length)return 0;
  const p=progressGet(userId,t.id);
  const done=(p.done||[]).filter(id=>t.modules.some(m=>m.id===id)).length;
  return Math.round(done/t.modules.length*100);
}

/* ---------- certificados ---------- */
function certsOf(userId){return db.certificates.filter(c=>c.userId===userId);}
function certFind(userId,trailId){return db.certificates.find(c=>c.userId===userId&&c.trailId===trailId)||null;}
function certIssue(userId,trailId){
  const existing=certFind(userId,trailId);if(existing)return existing;
  const t=trailById(trailId),u=userById(userId);
  const code='RAG-'+Date.now().toString(36).toUpperCase().slice(-6)+'-'+Math.random().toString(36).toUpperCase().slice(2,5);
  const c={id:newId('cert'),userId,trailId,trailTitle:t?t.title:'',userName:u?u.name:'',
    durationMin:t?trailDurationMin(t):0,moduleCount:t?t.modules.length:0,
    signature:(t&&t.certificate&&t.certificate.signature)||'Recursos Humanos',
    code, issuedAt:new Date().toISOString()};
  db.certificates.push(c);dbSave();return c;
}

/* ---------- eventos ---------- */
function eventsAll(){return db.events.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));}
function eventById(id){return db.events.find(e=>e.id===id)||null;}
function eventCreate({title,date,local,desc,assignment,vagas,hours}){
  const e={id:newId('ev'),title:(title||'').trim(),date:date||'',local:(local||'').trim(),desc:(desc||'').trim(),
    assignment:assignment||{mode:'all',sectors:[],cargos:[],userIds:[]},
    vagas:Number(vagas)||0,            // 0 = ilimitado
    hours:Number(hours)||0,            // carga horária do evento (horas)
    participants:[],                   // [{userId,status,enrolledAt,confirmedAt,confirmedBy}]
    attendees:[]};                     // mantido p/ compat
  db.events.push(e);dbSave();return e;
}
/* eventos visíveis para um colaborador, respeitando a atribuição */
function eventsForUser(u){
  if(!u)return [];
  return eventsAll().filter(e=>{
    const a=e.assignment||{mode:'all'};
    if(a.mode==='all')return true;
    const bySector=(a.sectors||[]).includes(u.sector);
    const byCargo=(a.cargos||[]).includes(u.cargo);
    const byUser=(a.userIds||[]).includes(u.id);
    return bySector||byCargo||byUser;
  });
}
function eventUpdate(id,patch){const e=db.events.find(x=>x.id===id);if(!e)return null;Object.assign(e,patch);dbSave();return e;}
function eventDelete(id){db.events=db.events.filter(e=>e.id!==id);dbSave();}

/* ---- participação em eventos (ciclo: inscrito → presente/ausente/cancelado) ---- */
function eventParticipant(e,userId){return (e.participants||[]).find(p=>p.userId===userId)||null;}
function eventEnrolledCount(e){return (e.participants||[]).filter(p=>p.status!=='cancelado').length;}
function eventHasVaga(e){return !e.vagas || eventEnrolledCount(e)<e.vagas;}
function eventEnroll(eventId,userId){
  const e=db.events.find(x=>x.id===eventId);if(!e)return {ok:false,error:'Evento não encontrado'};
  e.participants=e.participants||[];
  let p=eventParticipant(e,userId);
  if(p&&p.status!=='cancelado')return {ok:false,error:'Você já está inscrito'};
  if(!eventHasVaga(e))return {ok:false,error:'Vagas esgotadas'};
  if(p){p.status='inscrito';p.enrolledAt=new Date().toISOString();}
  else{e.participants.push({userId,status:'inscrito',enrolledAt:new Date().toISOString(),confirmedAt:null,confirmedBy:null});}
  dbSave();return {ok:true};
}
function eventCancelEnroll(eventId,userId){
  const e=db.events.find(x=>x.id===eventId);if(!e)return;
  const p=eventParticipant(e,userId);if(!p)return;
  p.status='cancelado';dbSave();
}
/* RH confirma presença/ausência; registra data e responsável */
function eventSetStatus(eventId,userId,status,byUserId){
  const e=db.events.find(x=>x.id===eventId);if(!e)return;
  e.participants=e.participants||[];
  let p=eventParticipant(e,userId);
  if(!p){p={userId,status:'inscrito',enrolledAt:new Date().toISOString(),confirmedAt:null,confirmedBy:null};e.participants.push(p);}
  p.status=status;
  if(status==='presente'||status==='ausente'){p.confirmedAt=new Date().toISOString();p.confirmedBy=byUserId||null;}
  dbSave();
}
/* histórico de eventos de um colaborador (todos em que tem participação) */
function eventsOfUser(userId){
  return eventsAll().filter(e=>eventParticipant(e,userId)).map(e=>({event:e,part:eventParticipant(e,userId)}));
}
function eventPresenceRate(e){
  const conf=(e.participants||[]).filter(p=>p.status==='presente'||p.status==='ausente');
  if(!conf.length)return null;
  return Math.round(conf.filter(p=>p.status==='presente').length/conf.length*100);
}

/* ===================== FASE 2: agregações e vínculos ===================== */

/* ---- trilhas obrigatórias por cargo ---- */
function cargoTrailsGet(cargo){return (db.cargoTrails[cargo]||[]).slice();}
function cargoTrailsSet(cargo,trailIds){db.cargoTrails[cargo]=trailIds||[];dbSave();}
function cargosAll(){return [...new Set(usersAll().map(u=>u.cargo).filter(Boolean))];}
/* trilhas obrigatórias para um usuário = trilhas marcadas mandatory + trilhas do cargo dele,
   limitado às que ele tem direito de ver (atribuição) */
function mandatoryTrailsForUser(u){
  if(!u)return [];
  const visibles=trailsForUser(u);
  const cargoIds=cargoTrailsGet(u.cargo);
  const set=new Set();
  visibles.forEach(t=>{ if(t.mandatory||cargoIds.includes(t.id))set.add(t.id); });
  // trilhas do cargo mesmo que não estejam na atribuição "all/restricted" — garante obrigatoriedade
  cargoIds.forEach(id=>set.add(id));
  return [...set].map(id=>trailById(id)).filter(Boolean).filter(t=>t.status==='published');
}
/* pendências obrigatórias (não concluídas) de um usuário */
function pendingMandatoryForUser(u){
  return mandatoryTrailsForUser(u).filter(t=>trailPct(u.id,t)<100);
}

/* ---- último acesso ---- */
function markAccess(userId){if(userId){db.lastAccess[userId]=new Date().toISOString();dbSave();}}
function lastAccessOf(userId){return db.lastAccess[userId]||null;}

/* ---- horas de treinamento de um usuário ---- */
function trainingHoursOf(userId){
  let min=0;
  // horas de trilhas concluídas (carga horária dos módulos)
  trailsAll().forEach(t=>{ if(trailPct(userId,t)===100)min+=trailDurationMin(t); });
  let hours=min/60;
  // horas de eventos com presença confirmada
  eventsOfUser(userId).forEach(({event,part})=>{ if(part.status==='presente')hours+=(event.hours||0); });
  return Math.round(hours*10)/10;
}

/* ---- histórico de aprendizagem consolidado de um colaborador ---- */
function learningHistory(userId){
  const u=userById(userId);if(!u)return null;
  const all=trailsForUser(u);
  const concluidas=[],andamento=[];
  all.forEach(t=>{const pct=trailPct(userId,t);if(pct===100)concluidas.push(t);else if(pct>0)andamento.push({t,pct});});
  const certs=certsOf(userId);
  const eventos=eventsOfUser(userId);
  // percentual geral de conclusão (sobre trilhas atribuídas)
  let soma=0;all.forEach(t=>soma+=trailPct(userId,t));
  const geral=all.length?Math.round(soma/all.length):0;
  return {
    user:u,
    concluidas, andamento,
    certificados:certs,
    eventos,
    horas:trainingHoursOf(userId),
    ultimoAcesso:lastAccessOf(userId),
    percentualGeral:geral,
    pendentesObrigatorias:pendingMandatoryForUser(u)
  };
}

/* ---- agregações para dashboard/relatórios ---- */
function collaboratorsAll(){return usersAll().filter(u=>u.role!=='rh');}
function monthKey(d){return (d||'').slice(0,7);} // YYYY-MM
function dashboardStats(refMonth){
  const colabs=collaboratorsAll();
  const mes=refMonth||new Date().toISOString().slice(0,7);
  const treinados=colabs.filter(u=>trailsForUser(u).some(t=>trailPct(u.id,t)>0)||eventsOfUser(u.id).some(x=>x.part.status==='presente')).length;
  let horasMes=0;
  // horas no mês: eventos presentes com data no mês + certificados emitidos no mês
  db.events.forEach(e=>{ if(monthKey(e.date)===mes){(e.participants||[]).forEach(p=>{if(p.status==='presente')horasMes+=(e.hours||0);});} });
  db.certificates.forEach(c=>{ if(monthKey(c.issuedAt)===mes)horasMes+=(c.durationMin||0)/60; });
  const eventosMes=db.events.filter(e=>monthKey(e.date)===mes);
  // taxa de presença média
  const rates=db.events.map(eventPresenceRate).filter(r=>r!=null);
  const taxaPresenca=rates.length?Math.round(rates.reduce((a,b)=>a+b,0)/rates.length):null;
  // taxa de conclusão de trilhas (média geral)
  let s=0,n=0;colabs.forEach(u=>trailsForUser(u).forEach(t=>{s+=trailPct(u.id,t);n++;}));
  const taxaConclusao=n?Math.round(s/n):0;
  // obrigatórias pendentes (total de pares colaborador×trilha)
  let pend=0;colabs.forEach(u=>{pend+=pendingMandatoryForUser(u).length;});
  // ranking por área (setor) e por gestor
  const porArea={};colabs.forEach(u=>{const k=u.sector||'—';(porArea[k]=porArea[k]||{soma:0,n:0});let ps=0,pn=0;trailsForUser(u).forEach(t=>{ps+=trailPct(u.id,t);pn++;});porArea[k].soma+=pn?ps/pn:0;porArea[k].n++;});
  const rankingArea=Object.keys(porArea).map(k=>({nome:k,pct:Math.round(porArea[k].soma/porArea[k].n)})).sort((a,b)=>b.pct-a.pct);
  const porGestor={};colabs.forEach(u=>{const mg=u.managerId?(userById(u.managerId)||{}).name||'—':'Sem gestor';(porGestor[mg]=porGestor[mg]||{soma:0,n:0});let ps=0,pn=0;trailsForUser(u).forEach(t=>{ps+=trailPct(u.id,t);pn++;});porGestor[mg].soma+=pn?ps/pn:0;porGestor[mg].n++;});
  const rankingGestor=Object.keys(porGestor).map(k=>({nome:k,pct:Math.round(porGestor[k].soma/porGestor[k].n)})).sort((a,b)=>b.pct-a.pct);
  return {
    mes,
    totalColabs:colabs.length,
    treinados,
    horasMes:Math.round(horasMes*10)/10,
    eventosRealizados:eventosMes.length,
    taxaPresenca,
    taxaConclusao,
    obrigatoriasPendentes:pend,
    certificadosMes:db.certificates.filter(c=>monthKey(c.issuedAt)===mes).length,
    semAcesso:colabs.filter(u=>!lastAccessOf(u.id)).length,
    rankingArea, rankingGestor
  };
}
