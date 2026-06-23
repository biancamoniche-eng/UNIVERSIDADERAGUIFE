/* ====================== ICONS ====================== */
const I={
  play:'<circle cx="12" cy="12" r="9.5"/><path d="M10 8.5 16 12l-6 3.5z"/>',
  video:'<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="M15.5 10.2 21 7.5v9l-5.5-2.7"/>',
  doc:'<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 12.5h6M9 16h6"/>',
  text:'<path d="M5 6h14M5 11h14M5 16h9"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7.3l2-2a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7-.3l-2 2a4 4 0 0 0 5.7 5.7l1-1"/>',
  quiz:'<circle cx="12" cy="12" r="9.5"/><path d="M8.5 12.5 11 15l4.5-6"/>',
  poll:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tf:'<path d="M5 12.5 9 16l4-5"/><path d="M15 9h5M15 14h5"/>',
  check:'<path d="M5 12.5 9.5 17 19 7"/>',
  x:'<path d="M5 5l14 14M19 5 5 19"/>',
  prev:'<path d="M15 6l-6 6 6 6"/>',
  next:'<path d="M9 6l6 6-6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  layers:'<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 13l10 5 10-5M2 18l10 5 10-5" opacity=".5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13"/>',
  edit:'<path d="M4 20h4.2L19.8 8.4a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z"/><path d="M14 6.5 17.5 10"/>',
  upload:'<path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M5 19.5h14"/>',
  download:'<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M5 19.5h14"/>',
  chevD:'<path d="M6 9.5 12 15l6-5.5"/>',chevR:'<path d="M9.5 6 15 12l-5.5 6"/>',
  grip:'<circle cx="9" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  info:'<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5M12 7.5v.5"/>',
  warn:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.5"/>',
  empty:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M3.5 10h17M8 5V3.5M16 5V3.5"/>',
  book:'<path d="M5 4.5h11a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H5Z"/><path d="M5 4.5A1.5 1.5 0 0 0 3.5 6v13A1.5 1.5 0 0 1 5 17.5"/>',
  certificate:'<circle cx="12" cy="9" r="5.5"/><path d="M9 13.5 7.5 21l4.5-2.2L16.5 21 15 13.5"/><path d="M9.5 9 11 10.5 14.5 7"/>',
  award:'<circle cx="12" cy="9" r="5.5"/><path d="M9.5 9 11 10.5 14.5 7"/>',
  print:'<path d="M6 9V3.5h12V9M6 18H4.5A1.5 1.5 0 0 1 3 16.5V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5A1.5 1.5 0 0 1 19.5 18H18"/><rect x="7" y="14" width="10" height="6.5" rx="1"/>',
  trail:'<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="17" r="2.4"/><path d="M8.4 7H14a3.5 3.5 0 0 1 0 7H9.5a3.5 3.5 0 0 0 0 7h0"/>',
  team:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9"/>',
  chart:'<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="14" width="3" height="3"/>',
  trophy:'<path d="M7 4h10v4a5 5 0 0 1-10 0Z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M12 13v4M9 21h6M10 17h4"/>',
  home:'<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-5h4v5"/>',
  user:'<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  logout:'<path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h10M17 9l3 3-3 3"/>',
  pin:'<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a13.6 13.6 0 0 1-2.3 3M6.3 6.3A13.6 13.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9"/><path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  key:'<circle cx="8" cy="15" r="4.5"/><path d="M11 12.5 19 4.5M16 7l2.5 2.5M14 9l2.5 2.5"/>',
  eyePref:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};
function ic(n,s=20){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]||''}</svg>`;}

/* ====================== CONTENT TYPES ====================== */
const CTYPE={
  youtube:{label:'Vídeo (YouTube)',icon:'play',cls:'ct-video'},
  mp4:{label:'Vídeo (MP4)',icon:'video',cls:'ct-video'},
  pdf:{label:'PDF',icon:'doc',cls:'ct-pdf'},
  text:{label:'Texto',icon:'text',cls:'ct-text'},
};
const QKIND={
  quiz:{label:'Prova (resposta certa)',icon:'quiz',cls:'qk-quiz'},
  poll:{label:'Enquete (sem resposta certa)',icon:'poll',cls:'qk-poll'},
  truefalse:{label:'Verdadeiro ou falso',icon:'tf',cls:'qk-tf'},
};

/* ====================== DATA MODEL (vazio; localStorage) ======================
  Estrutura pronta para JSON / API:
  trail = {
    id, title, subtitle,
    modules: [
      { id, name, contentType:'youtube|mp4|pdf|text', src, fileName, text,
        materials:[{name,url}],
        quiz: null | {
          kind:'quiz|poll|truefalse',
          passThreshold: Number,        // % mínimo de acerto p/ aprovar (quiz/truefalse)
          questions: [ { q, options:[..], correct:Number|null } ]
        }
      }
    ]
  }
  progress = {
    done:[],                       // ids dos módulos concluídos
    polls:{ moduleId:{ qIdx:{optIdx:count} } }, // votos de enquete por pergunta
    passed:{ moduleId:true },       // módulos cujo quiz/prova foi aprovado
    scores:{ moduleId: Number }     // % de acerto na última tentativa aprovada
  }
  Regra de conclusão: módulo com quiz 'quiz'/'truefalse' só conclui quando o
  aluno atinge a NOTA MÍNIMA (passThreshold). Pode refazer quantas vezes quiser.
  Enquete ('poll') exige apenas responder, não bloqueia por acerto.
=============================================================================*/
const KEY='raguife_trilha_modulo';
let trail={id:'t_'+Math.random().toString(36).slice(2,8),title:'',subtitle:'',modules:[]};
let progress={done:[],polls:{},passed:{},scores:{},attempts:{}};
let mode='student';
let currentIdx=0;
let lessonTab='conteudo';
let quizState={answers:{},submitted:false};  // answers: { qIdx: optIdx }

const DEFAULT_THRESHOLD=70;  // nota mínima padrão (%)

/* normaliza um quiz para o novo formato (múltiplas perguntas + nota mínima),
   migrando o formato antigo { question, options, correct } se necessário. */
function normalizeQuiz(q){
  if(!q)return null;
  // formato antigo → novo
  if(q.questions===undefined && q.question!==undefined){
    q={ kind:q.kind||'quiz', passThreshold:q.passThreshold??DEFAULT_THRESHOLD,
        questions:[{ q:q.question||'', options:q.options||['',''], correct:(q.correct===undefined?0:q.correct) }] };
  }
  q.kind=q.kind||'quiz';
  q.questions=Array.isArray(q.questions)?q.questions:[];
  if(q.questions.length===0)q.questions=[{q:'',options:['',''],correct:q.kind==='poll'?null:0}];
  if(q.kind==='poll')q.passThreshold=null;
  else if(typeof q.passThreshold!=='number')q.passThreshold=DEFAULT_THRESHOLD;
  // garante coerência de cada pergunta
  q.questions.forEach(qq=>{
    qq.options=Array.isArray(qq.options)?qq.options:['',''];
    if(q.kind==='truefalse')qq.options=['Verdadeiro','Falso'];
    if(q.kind==='poll')qq.correct=null;
    else if(typeof qq.correct!=='number')qq.correct=0;
  });
  return q;
}
function normalizeTrail(t){
  if(!t)return t;
  t.modules=Array.isArray(t.modules)?t.modules:[];
  // status de publicação: 'draft' (só RH) ou 'published' (aparece p/ colaborador)
  if(t.status!=='published'&&t.status!=='draft')t.status='draft';
  // atribuição: a quem a trilha se destina
  t.assignment=t.assignment||{mode:'all',sectors:[],userIds:[]};
  if(typeof t.category!=='string')t.category='';        // categoria/tema (opcional)
  if(typeof t.mandatory!=='boolean')t.mandatory=false;   // trilha obrigatória?
  if(typeof t.deadline!=='string')t.deadline='';          // prazo (YYYY-MM-DD), opcional
  if(typeof t.category!=='string')t.category='';          // categoria/tema da trilha
  // configuração do certificado
  t.certificate=t.certificate||{};
  if(typeof t.certificate.enabled!=='boolean')t.certificate.enabled=true; // emite ao concluir 100%
  if(typeof t.certificate.signature!=='string')t.certificate.signature='Recursos Humanos';
  if(!['all','restricted'].includes(t.assignment.mode))t.assignment.mode='all';
  t.assignment.sectors=Array.isArray(t.assignment.sectors)?t.assignment.sectors:[];
  t.assignment.userIds=Array.isArray(t.assignment.userIds)?t.assignment.userIds:[];
  t.modules.forEach(m=>{
    m.materials=m.materials||[];
    if(typeof m.durationMin!=='number')m.durationMin=0; // carga horária por módulo (min)
    if(m.quiz)m.quiz=normalizeQuiz(m.quiz);
  });
  return t;
}
/* carga horária total da trilha (minutos) */
function trailDurationMin(t){return (t.modules||[]).reduce((a,m)=>a+(m.durationMin||0),0);}

/* valida uma trilha antes de publicar; retorna lista de problemas (vazia = ok) */
function validateTrail(t){
  const probs=[];
  if(!t.title||!t.title.trim())probs.push('A trilha está sem título.');
  if(!t.modules||!t.modules.length){probs.push('A trilha não tem módulos.');return probs;}
  t.modules.forEach((m,i)=>{
    const n='Módulo '+(i+1)+(m.name?` ("${m.name}")`:'');
    if(m.contentType==='youtube'&&!(m.src||'').trim())probs.push(`${n}: vídeo do YouTube sem link.`);
    if(m.contentType==='pdf'&&!(m.src||'').trim())probs.push(`${n}: PDF não enviado.`);
    if(m.contentType==='text'&&!(m.text||'').trim())probs.push(`${n}: texto vazio.`);
    if(m.contentType==='mp4'&&!(m.src||'')&&!m.mp4Missing)probs.push(`${n}: vídeo MP4 não enviado.`);
    if(m.quiz){
      const q=m.quiz;
      (q.questions||[]).forEach((qq,qi)=>{
        const qn=`${n}, pergunta ${qi+1}`;
        if(!(qq.q||'').trim())probs.push(`${qn}: sem enunciado.`);
        const opts=(qq.options||[]).filter(o=>(o||'').trim());
        if(opts.length<2)probs.push(`${qn}: precisa de ao menos 2 alternativas.`);
        if(q.kind!=='poll'&&(qq.correct===null||qq.correct===undefined||!(qq.options[qq.correct]||'').trim()))
          probs.push(`${qn}: marque a alternativa correta.`);
      });
    }
  });
  return probs;
}
function fmtDuration(min){
  if(!min)return '';
  const h=Math.floor(min/60),m=min%60;
  if(h&&m)return `${h}h${String(m).padStart(2,'0')}`;
  if(h)return `${h}h`;
  return `${m} min`;
}

function load(){
  try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);trail=normalizeTrail(d.trail||trail);progress=d.progress||progress;progress.done=progress.done||[];progress.polls=progress.polls||{};progress.passed=progress.passed||{};progress.scores=progress.scores||{};}}catch(e){}
}
function save(){
  try{
    const clone=JSON.parse(JSON.stringify({trail,progress}));
    clone.trail.modules.forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}});
    localStorage.setItem(KEY,JSON.stringify(clone));
  }catch(e){if(e.name==='QuotaExceededError')toast('Armazenamento cheio — PDFs grandes podem não persistir',true);}
}
function uid(){return 'm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ytId(u){if(!u)return '';const m=u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);return m?m[1]:'';}
function toast(msg,warn){const t=document.getElementById('toast');t.className='toast'+(warn?' warn show':' show');t.innerHTML=`${ic(warn?'warn':'check',18)} ${esc(msg)}`;clearTimeout(window._t);window._t=setTimeout(()=>t.classList.remove('show'),2600);}
function ring(pct,size,stroke){const r=(size-stroke)/2,c=size/2,circ=2*Math.PI*r,off=circ*(1-pct/100);return `<div class="pring" style="width:${size}px;height:${size}px;"><svg width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${r}" stroke="var(--gray-100)" stroke-width="${stroke}" fill="none"/><circle cx="${c}" cy="${c}" r="${r}" stroke="var(--lime-500)" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/></svg><span class="pl" style="font-size:${Math.round(size*.28)}px;color:var(--green-900);">${pct}%</span></div>`;}

/* ====================== PROGRESS (somente dados reais) ====================== */
function totalModules(){return trail.modules.length;}
function doneCount(){return progress.done.filter(id=>trail.modules.some(m=>m.id===id)).length;}
function pctDone(){const t=totalModules();return t?Math.round(doneCount()/t*100):0;}
function moduleStatus(m){
  if(progress.done.includes(m.id))return 'done';
  const idx=trail.modules.indexOf(m);
  // "em andamento" = é o módulo atualmente aberto e ainda não concluído
  if(idx===currentIdx)return 'current';
  return 'pending';
}

/* ---- gate do quiz: o módulo exige aprovação antes de concluir? ---- */
// 'quiz' e 'truefalse' exigem ACERTO; 'poll' exige apenas o voto.
function moduleHasGate(m){return !!(m.quiz && (m.quiz.kind==='quiz' || m.quiz.kind==='truefalse'));}
function modulePollPending(m){return !!(m.quiz && m.quiz.kind==='poll');}
function isQuizPassed(m){return !!progress.passed[m.id];}
// pode concluir se: não tem quiz; OU é enquete já respondida; OU prova/VF aprovada
function canComplete(m){
  if(!m.quiz)return true;
  if(m.quiz.kind==='poll')return !!(progress.polls[m.id]&&Object.keys(progress.polls[m.id]).length);
  return isQuizPassed(m);
}

/* ---- avaliação por percentual (múltiplas perguntas) ---- */
// conta acertos de uma tentativa: answers = { qIdx: optIdx }
function quizCorrectCount(m,answers){
  let n=0;
  m.quiz.questions.forEach((qq,qi)=>{ if(answers[qi]===qq.correct)n++; });
  return n;
}
function quizScorePct(m,answers){
  const total=m.quiz.questions.length||1;
  return Math.round(quizCorrectCount(m,answers)/total*100);
}
function quizThreshold(m){
  return (m.quiz && typeof m.quiz.passThreshold==='number')?m.quiz.passThreshold:DEFAULT_THRESHOLD;
}
function quizAllAnswered(m,answers){
  return m.quiz.questions.every((qq,qi)=>answers[qi]!==undefined && answers[qi]!==null);
}

/* ====================== TOP BAR ====================== */
function renderTop(){
  document.getElementById('tbTrail').textContent=trail.title||'Trilha sem título';
  const tp=document.getElementById('tbProgress');
  if(totalModules()===0){tp.innerHTML='';return;}
  tp.innerHTML=`<span>${doneCount()}/${totalModules()}</span><div class="mini-bar"><span style="width:${pctDone()}%"></span></div>`;
}
