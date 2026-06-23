/* ====================== RENDER (student) ====================== */
function render(){
  renderTop();
  renderMain();
  renderRail();
}

function renderMain(){
  const main=document.getElementById('colMain');
  if(totalModules()===0){
    main.innerHTML=trailHeader()+`
      <div class="empty">
        <div class="e-ic">${ic('empty',36)}</div>
        <h3>Nenhum módulo cadastrado</h3>
        <p>Esta trilha ainda não tem conteúdo. Abra o editor para adicionar o primeiro módulo com vídeo, PDF ou texto.</p>
        <button class="btn btn-primary" onclick="setMode('editor')">${ic('edit',16)} Abrir editor</button>
      </div>`;
    return;
  }
  if(currentIdx>=totalModules())currentIdx=0;
  const m=trail.modules[currentIdx];
  main.innerHTML=trailHeader()+`
    <div id="mediaStage">${mediaStage(m)}</div>
    <div class="now-playing">
      <div class="now-idx">${currentIdx+1}</div>
      <div><h2>${esc(m.name)||'Módulo '+(currentIdx+1)}</h2>
        <div class="np-type">${ic(CTYPE[m.contentType].icon,14)} ${CTYPE[m.contentType].label}${m.quiz?' · '+QKIND[m.quiz.kind].label.split(' ')[0].toLowerCase():''}</div></div>
    </div>
    <div class="lesson-tabs">
      <button class="lesson-tab ${lessonTab==='conteudo'?'on':''}" onclick="setLessonTab('conteudo')">Conteúdo</button>
      <button class="lesson-tab ${lessonTab==='materiais'?'on':''}" onclick="setLessonTab('materiais')">Materiais</button>
      ${m.quiz?`<button class="lesson-tab ${lessonTab==='quiz'?'on':''}" onclick="setLessonTab('quiz')">${m.quiz.kind==='poll'?'Enquete':'Quiz'}${moduleHasGate(m)&&!isQuizPassed(m)?' <span class="tab-req">obrigatório</span>':''}${moduleHasGate(m)&&isQuizPassed(m)?' '+ic('check',13):''}</button>`:''}
    </div>
    <div class="lesson-body" id="lessonBody">${lessonBody(m)}</div>
    <div class="lesson-nav">
      <button class="btn btn-ghost" onclick="navModule(-1)" ${currentIdx===0?'disabled':''}>${ic('prev',16)} Módulo anterior</button>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
        ${completeControl(m)}
        <button class="btn btn-dark" onclick="navModule(1)" ${currentIdx===totalModules()-1?'disabled':''}>Próximo módulo ${ic('next',16)}</button>
      </div>
    </div>`;
}

/* botão de conclusão respeitando o gate do quiz */
function completeControl(m){
  if(progress.done.includes(m.id)){
    return `<button class="btn btn-ghost" onclick="toggleComplete()">${ic('check',16)} Concluído</button>`;
  }
  if(!canComplete(m)){
    const reason = m.quiz.kind==='poll'
      ? 'Responda a enquete para concluir'
      : 'Acerte o quiz para concluir';
    return `<div style="display:flex;align-items:center;gap:10px;">
      <span class="gate-hint">${ic('lock',15)} ${reason}</span>
      <button class="btn btn-primary" disabled>Marcar como concluído</button>
    </div>`;
  }
  return `<button class="btn btn-primary" onclick="toggleComplete()">Marcar como concluído</button>`;
}

function trailHeader(){
  return `<div class="trail-header">
    <div class="trail-eyebrow">Trilha de aprendizagem</div>
    <h1 class="trail-title">${esc(trail.title)||'Trilha sem título'}</h1>
    ${trail.subtitle?`<p class="trail-sub">${esc(trail.subtitle)}</p>`:`<p class="trail-sub" style="color:var(--gray-300);">Sem descrição. Adicione no editor.</p>`}
    <div class="trail-meta">
      <span class="tm">${ic('layers',15)} ${totalModules()} módulo${totalModules()!==1?'s':''}</span>
      <span class="tm">${ic('quiz',15)} ${trail.modules.filter(m=>m.quiz).length} com avaliação</span>
      <span class="tm">${ic('check',15)} ${totalModules()?pctDone()+'% concluído':'0% iniciado'}</span>
    </div>
  </div>`;
}

function mediaStage(m){
  if(m.contentType==='youtube'){
    const v=ytId(m.src);
    return v?`<div class="media-stage"><iframe src="https://www.youtube.com/embed/${v}" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe></div>`
      :mediaEmpty('Nenhum vídeo inserido','Adicione um link do YouTube neste módulo pelo editor.');
  }
  if(m.contentType==='mp4'){
    if(m.mp4Missing||!m.src)return mediaEmpty('Vídeo MP4 indisponível','O arquivo enviado não persiste entre sessões. Reenvie o MP4 pelo editor.');
    return `<div class="media-stage"><video src="${m.src}" controls></video></div>`;
  }
  if(m.contentType==='pdf'){
    if(!m.src)return mediaEmpty('Nenhum PDF inserido','Faça upload de um PDF neste módulo pelo editor.');
    return `<div class="media-stage" style="aspect-ratio:auto;"><iframe src="${m.src}" style="height:560px;"></iframe></div>`;
  }
  // text module → no media stage, show a quiet placeholder banner
  return `<div class="media-stage" style="aspect-ratio:21/6;background:linear-gradient(120deg,var(--green-900),var(--green-700));"><div class="media-empty"><div class="me-ic">${ic('text',30)}</div><b>Módulo de leitura</b><span>O conteúdo está abaixo, na aba Conteúdo.</span></div></div>`;
}
function mediaEmpty(title,desc){
  return `<div class="media-stage"><div class="media-empty"><div class="me-ic">${ic('video',32)}</div><b>${esc(title)}</b><span>${esc(desc)}</span></div></div>`;
}

function setLessonTab(t){lessonTab=t;quizState={answers:{},submitted:false};openMatPdf=null;document.querySelectorAll('.lesson-tab').forEach(el=>el.classList.remove('on'));renderMain();}
function lessonBody(m){
  if(lessonTab==='quiz'&&m.quiz)return quizRuntime(m);
  if(lessonTab==='materiais'){
    const mats=m.materials||[];
    if(mats.length===0)return `<p class="lesson-text" style="color:var(--gray-400);">Nenhum material complementar neste módulo.</p>`;
    return mats.map((mat,j)=>{
      const isPdf=mat.url&&mat.url.startsWith('data:');
      if(isPdf){
        return `<div class="mat-card">
          <span class="material-chip" style="cursor:default;margin:0;">${ic('doc',16)} ${esc(mat.name)||'Material PDF'}</span>
          <a class="btn btn-ghost btn-sm" href="${mat.url}" download="${esc(mat.name)||'material'}.pdf">${ic('download',15)} Baixar</a>
          <button class="btn btn-text btn-sm" onclick="toggleMatPdf(${j})">${ic('doc',15)} ${openMatPdf===j?'Ocultar':'Abrir aqui'}</button>
          ${openMatPdf===j?`<iframe class="mat-pdf-frame" src="${mat.url}"></iframe>`:''}
        </div>`;
      }
      return `<a class="material-chip" href="${esc(mat.url)}" target="_blank" rel="noopener">${ic('link',16)} ${esc(mat.name)||'Material'}</a>`;
    }).join('');
  }
  // conteudo
  if(m.contentType==='text'){
    return m.text?`<div class="lesson-text">${esc(m.text)}</div>`:`<p class="lesson-text" style="color:var(--gray-400);">Sem texto neste módulo.</p>`;
  }
  return m.text?`<div class="lesson-text">${esc(m.text)}</div>`:`<p class="lesson-text" style="color:var(--gray-400);">Sem descrição de conteúdo para este módulo.</p>`;
}

/* ---------- quiz runtime: quiz / poll / truefalse ---------- */
function quizRuntime(m){
  const q=m.quiz;
  const configured = q && q.questions && q.questions.some(qq=>qq.q && qq.q.trim() && (qq.options||[]).some(o=>o&&o.trim()));
  if(!configured){
    return `<p class="lesson-text" style="color:var(--gray-400);">A avaliação deste módulo ainda não foi configurada.</p>`;
  }
  const kindCls=QKIND[q.kind].cls;
  const kindLabel=q.kind==='poll'?'Enquete':(q.kind==='truefalse'?'Verdadeiro ou falso':'Prova');
  const sub = q.kind==='poll' ? `${q.questions.length} pergunta${q.questions.length!==1?'s':''}`
            : `${q.questions.length} pergunta${q.questions.length!==1?'s':''} · nota mínima ${quizThreshold(m)}%`;

  // bloco de cada pergunta
  const blocks = q.questions.map((qq,qi)=>{
    let opts;
    if(q.kind==='poll'){
      if(quizState.submitted){
        const votes=(progress.polls[m.id]&&progress.polls[m.id][qi])||{};
        const total=Object.values(votes).reduce((a,b)=>a+b,0)||1;
        opts=qq.options.map((o,i)=>{const c=votes[i]||0;const pc=Math.round(c/total*100);
          return `<div class="poll-bar"><span style="width:${pc}%"></span><div class="poll-label"><span>${esc(o)}</span><span>${pc}%</span></div></div>`;}).join('');
      }else{
        opts=qq.options.map((o,i)=>`<div class="opt ${quizState.answers[qi]===i?'sel':''}" onclick="pickOpt(${qi},${i})"><span class="bullet"></span>${esc(o)}</div>`).join('');
      }
    }else{
      opts=qq.options.map((o,i)=>{
        let cls='opt';
        if(quizState.submitted){if(i===qq.correct)cls+=' correct';else if(quizState.answers[qi]===i)cls+=' wrong';}
        else if(quizState.answers[qi]===i)cls+=' sel';
        return `<div class="${cls}" onclick="${quizState.submitted?'':`pickOpt(${qi},${i})`}"><span class="bullet">${quizState.submitted&&i===qq.correct?ic('check',13):(quizState.submitted&&quizState.answers[qi]===i?ic('x',13):'')}</span>${esc(o)}</div>`;
      }).join('');
    }
    const numTag = q.questions.length>1 ? `<div class="q-num">Pergunta ${qi+1} de ${q.questions.length}</div>` : '';
    return `<div class="quiz-question">${numTag}<div class="quiz-q-text">${esc(qq.q)||'(sem texto)'}</div>${opts}</div>`;
  }).join('');

  // rodapé: ação ou resultado
  let foot='';
  if(quizState.submitted){
    if(q.kind==='poll'){
      foot=`<div class="quiz-feedback qf-poll">${ic('poll',18)} Respostas registradas. Veja como o time respondeu.</div>`;
    }else{
      const pct=quizScorePct(m,quizState.answers);
      const min=quizThreshold(m);
      const acertos=quizCorrectCount(m,quizState.answers);
      const att=(progress.attempts&&progress.attempts[m.id])||{best:pct,count:1};
      const scoreCard=`<div class="quiz-result ${pct>=min?'qr-pass':'qr-fail'}">
        <div class="qr-score"><b>${pct}%</b><span>sua nota</span></div>
        <div class="qr-meta">
          <div>${acertos} de ${q.questions.length} corretas</div>
          <div class="muted">Mínimo p/ aprovar: ${min}% · Tentativa ${att.count}${att.best>pct?` · melhor: ${att.best}%`:''}</div>
        </div>
        <div class="qr-badge">${pct>=min?ic('check',20):ic('x',20)}</div>
      </div>`;
      if(pct>=min){
        foot=scoreCard+`<div class="quiz-feedback qf-pass" style="margin-top:10px;">${ic('check',18)} Aprovado! Módulo liberado para conclusão.</div>`;
      }else{
        foot=scoreCard+`<div class="quiz-feedback qf-fail" style="margin-top:10px;">${ic('x',18)} Não atingiu a nota mínima. As corretas estão destacadas — revise e tente de novo.</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="retryQuiz()">${ic('prev',15)} Refazer o quiz</button>`;
      }
    }
  }else{
    const isGate = q.kind!=='poll';
    const ready = quizAllAnswered(m,quizState.answers);
    foot=`${isGate?`<div class="gate-note">${ic('lock',14)} Atinja ${quizThreshold(m)}% de acerto para concluir o módulo.</div>`:''}
      <button class="btn btn-primary btn-sm" onclick="submitQuiz()" ${ready?'':'disabled'}>${q.kind==='poll'?'Enviar respostas':'Enviar respostas'}</button>
      ${!ready?`<span class="muted" style="font-size:12px;margin-left:10px;">Responda todas as perguntas</span>`:''}`;
  }

  return `<div class="quiz-card">
    <div class="quiz-card-head">
      <span class="quiz-kind ${kindCls}">${ic(QKIND[q.kind].icon,13)} ${kindLabel}</span>
      <span class="quiz-sub">${sub}</span>
    </div>
    ${blocks}
    <div class="quiz-foot">${foot}</div>
  </div>`;
}
let openMatPdf=null;
function toggleMatPdf(j){openMatPdf=openMatPdf===j?null:j;document.getElementById('lessonBody').innerHTML=lessonBody(trail.modules[currentIdx]);}
function pickOpt(qi,i){quizState.answers[qi]=i;document.getElementById('lessonBody').innerHTML=lessonBody(trail.modules[currentIdx]);}
function retryQuiz(){quizState={answers:{},submitted:false};document.getElementById('lessonBody').innerHTML=lessonBody(trail.modules[currentIdx]);}
function submitQuiz(){
  const m=trail.modules[currentIdx];const q=m.quiz;
  if(!quizAllAnswered(m,quizState.answers))return;
  if(q.kind==='poll'){
    // registra votos por pergunta
    progress.polls[m.id]=progress.polls[m.id]||{};
    q.questions.forEach((qq,qi)=>{
      progress.polls[m.id][qi]=progress.polls[m.id][qi]||{};
      const sel=quizState.answers[qi];
      progress.polls[m.id][qi][sel]=(progress.polls[m.id][qi][sel]||0)+1;
    });
  }else{
    // prova / V-F: aprova se atingiu a nota mínima; guarda MELHOR nota + nº de tentativas
    const pct=quizScorePct(m,quizState.answers);
    progress.attempts=progress.attempts||{};
    const a=progress.attempts[m.id]||{best:0,count:0};
    a.count+=1;
    a.best=Math.max(a.best||0,pct);
    progress.attempts[m.id]=a;
    progress.scores[m.id]=a.best; // mantém compat: scores = melhor nota
    if(pct>=quizThreshold(m))progress.passed[m.id]=true;
  }
  save();
  quizState.submitted=true;
  lessonTab='quiz';
  render();
}

/* ---------- navigation + completion ---------- */
function navModule(d){currentIdx=Math.max(0,Math.min(totalModules()-1,currentIdx+d));lessonTab='conteudo';quizState={answers:{},submitted:false};render();window.scrollTo({top:0,behavior:'smooth'});}
function openModule(i){currentIdx=i;lessonTab='conteudo';quizState={answers:{},submitted:false};render();window.scrollTo({top:0,behavior:'smooth'});}
function toggleComplete(){
  const m=trail.modules[currentIdx];
  const already=progress.done.includes(m.id);
  if(!already && !canComplete(m)){
    // gate: redireciona para o quiz
    lessonTab='quiz';render();
    toast(m.quiz.kind==='poll'?'Responda a enquete para concluir':'Atinja a nota mínima para concluir',true);
    return;
  }
  const wasComplete = pctDone()===100;
  const i=progress.done.indexOf(m.id);
  if(i>=0)progress.done.splice(i,1);else progress.done.push(m.id);
  save();render();
  const nowComplete = pctDone()===100;
  if(nowComplete && !wasComplete){
    toast('🎉 Trilha concluída! Certificado disponível.');
    openCertificate();
  }else{
    toast(i>=0?'Módulo reaberto':'Módulo concluído');
  }
}

/* ====================== RAIL (progress + module list) ====================== */
function renderRail(){
  const rail=document.getElementById('colRail');
  const complete = totalModules()>0 && pctDone()===100;
  rail.innerHTML=`
    <div class="rail-progress">
      <h3>Progresso da trilha</h3>
      ${totalModules()===0
        ? `<p class="rp-empty">Nenhum progresso registrado.</p>`
        : `<div class="rp-row"><div class="rp-ring">${ring(pctDone(),58,6)}</div><div class="rp-meta"><b>${doneCount()} de ${totalModules()}</b><span>módulos concluídos</span></div></div>
           <div class="rp-bar"><span style="width:${pctDone()}%"></span></div>`}
      ${complete?`<button class="btn btn-primary btn-block cert-cta" style="margin-top:16px;" onclick="openCertificate()">${ic('certificate',16)} Ver certificado</button>`:''}
    </div>
    <div class="rail-list">
      <div class="rl-head">Conteúdo da trilha</div>
      ${totalModules()===0
        ? `<div class="rail-empty"><div class="re-ic">${ic('book',26)}</div><p>Nenhum módulo cadastrado</p></div>`
        : trail.modules.map((m,i)=>moduleRow(m,i)).join('')}
    </div>`;
}
function moduleRow(m,i){
  const st=moduleStatus(m);
  const statusPill=st==='done'?'<span class="statuspill sp-done">Concluído</span>':(st==='current'?'<span class="statuspill sp-prog">Em andamento</span>':'<span class="statuspill sp-pend">Não iniciado</span>');
  const node=st==='done'?ic('check',13):(i+1);
  return `<div class="mod-item ${i===currentIdx?'active':''} ${st}" onclick="openModule(${i})">
    <div class="mod-status">${node}</div>
    <div class="mod-info">
      <div class="mod-name">${esc(m.name)||'Módulo '+(i+1)}</div>
      <div class="mod-tags">
        <span class="mt ${CTYPE[m.contentType].cls}">${ic(CTYPE[m.contentType].icon,13)} ${CTYPE[m.contentType].label.split(' ')[0]}</span>
        ${m.quiz?`<span class="mt">${ic(QKIND[m.quiz.kind].icon,13)} ${m.quiz.kind==='poll'?'Enquete':(m.quiz.kind==='truefalse'?'V/F':'Quiz')}</span>`:''}
        ${statusPill}
      </div>
    </div>
  </div>`;
}

/* ====================== CERTIFICADO ====================== */
/* nome do aluno persiste localmente (sem backend) */
function getLearnerName(){ try{return localStorage.getItem('raguife_aluno_nome')||'';}catch(e){return '';} }
function setLearnerName(v){ try{localStorage.setItem('raguife_aluno_nome',v||'');}catch(e){} }

function openCertificate(){
  if(pctDone()!==100){toast('Conclua todos os módulos para emitir o certificado',true);return;}
  renderCertificate();
  document.getElementById('certBack').classList.add('open');
}
function closeCertificate(){document.getElementById('certBack').classList.remove('open');_certPreview=false;}

/* pré-visualização do certificado pelo RH (no editor), com nome de exemplo */
let _certPreview=false;
function previewCertificate(){
  _certPreview=true;
  renderCertificate();
  document.getElementById('certBack').classList.add('open');
}

function renderCertificate(){
  const nome=_certPreview?'Nome do Colaborador':getLearnerName();
  // busca o certificado emitido (tem código, carga horária, data) — se existir
  const cert=(!_certPreview&&typeof certFind==='function'&&currentUser&&currentTrailId)?certFind(currentUser.id,currentTrailId):null;
  const emissao=cert?new Date(cert.issuedAt):new Date();
  const hoje=emissao.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const nMod=cert?cert.moduleCount:totalModules();
  const durMin=cert?cert.durationMin:(typeof trailDurationMin==='function'?trailDurationMin(trail):0);
  const dur=(typeof fmtDuration==='function')?fmtDuration(durMin):'';
  const code=cert?cert.code:(_certPreview?'(gerado ao concluir)':'—');
  const signature=cert?cert.signature:((trail.certificate&&trail.certificate.signature)||'Recursos Humanos');
  document.getElementById('certModal').innerHTML=`
    ${_certPreview?`<div class="cert-preview-banner no-print">${ic('eye',15)} Pré-visualização do modelo — assim o certificado será gerado quando o colaborador concluir 100%.</div>`:''}
    <div class="cert-toolbar no-print">
      <div class="cert-name-field">
        <label>${_certPreview?'Nome (exemplo)':'Nome no certificado'}</label>
        <input class="inp" id="certName" placeholder="Digite o nome do aluno" value="${esc(nome)}" oninput="onCertNameInput(this.value)" ${_certPreview?'disabled':''}>
      </div>
      <div class="cert-actions">
        <button class="btn btn-ghost btn-sm" onclick="closeCertificate()">Fechar</button>
        ${_certPreview?'':`<button class="btn btn-primary btn-sm" onclick="printCertificate()">${ic('print',15)} Imprimir / PDF</button>`}
      </div>
    </div>
    <div class="cert-paper" id="certPaper">
      <div class="cert-border">
        <div class="cert-logo"><img src="${window.UNI_LOGO||''}" alt=""></div>
        <div class="cert-kicker">Universidade Raguife</div>
        <h1 class="cert-title">Certificado de Conclusão</h1>
        <p class="cert-line">Certificamos que</p>
        <div class="cert-learner" id="certLearner">${esc(nome)||'—'}</div>
        <p class="cert-line">concluiu com aproveitamento a trilha de aprendizagem</p>
        <div class="cert-trail">${esc(trail.title)||'Trilha sem título'}</div>
        <p class="cert-desc">composta por ${nMod} módulo${nMod!==1?'s':''}${dur?`, com carga horária de <b>${dur}</b>`:''}, cumprindo todas as avaliações exigidas.</p>
        <div class="cert-foot">
          <div class="cert-foot-item"><div class="cert-foot-line"></div><span>Data de conclusão</span><b>${hoje}</b></div>
          <div class="cert-seal">${ic('award',30)}</div>
          <div class="cert-foot-item"><div class="cert-foot-line"></div><span>Universidade Raguife</span><b>${esc(signature)}</b></div>
        </div>
        <div class="cert-code">Código de validação: <b>${esc(code)}</b></div>
      </div>
    </div>`;
}
function onCertNameInput(v){
  setLearnerName(v);
  const el=document.getElementById('certLearner');
  if(el)el.textContent=v||'—';
}
function printCertificate(){
  const nome=(document.getElementById('certName')||{}).value||'';
  if(!nome.trim()){toast('Digite o nome do aluno antes de imprimir',true);return;}
  window.print();
}
