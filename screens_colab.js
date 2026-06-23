/* ============================================================
   screens_colab.js — telas do colaborador (e compartilhadas).
============================================================ */

/* helpers visuais compartilhados */
function pageHead(title,sub,actions){
  return `<div class="page-head"><div><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
}
function emptyBox(icon,title,desc,btn){
  return `<div class="empty"><div class="e-ic">${ic(icon,34)}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p>${btn||''}</div>`;
}

/* ---------- HOME ---------- */
SCREENS['home']=(host)=>{
  const my=trailsForUser(currentUser);
  const withProg=my.map(t=>({t,pct:trailPct(currentUser.id,t)}));
  const emAndamento=withProg.filter(x=>x.pct>0&&x.pct<100).sort((a,b)=>b.pct-a.pct);
  const naoIniciadas=withProg.filter(x=>x.pct===0);
  const certs=certsOf(currentUser.id);
  const pendentes=pendingMandatoryForUser(currentUser);
  const horas=trainingHoursOf(currentUser.id);
  // próxima atividade recomendada: 1) obrigatória pendente mais urgente, 2) em andamento, 3) nova
  let next=null,nextReason='';
  if(pendentes.length){const t=pendentes.slice().sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'))[0];next={t,pct:trailPct(currentUser.id,t)};nextReason='Obrigatória'+(t.deadline?' · prazo '+formatDate(t.deadline):'');}
  else if(emAndamento.length){next=emAndamento[0];nextReason='Continue de onde parou';}
  else if(naoIniciadas.length){next=naoIniciadas[0];nextReason='Comece agora';}

  host.innerHTML=`
    ${pageHead('Olá, '+currentUser.name.split(' ')[0], 'Bem-vindo à sua jornada de aprendizagem.')}
    ${pendentes.length?`<div class="callout callout-warn home-pend">${ic('warn',18)}<div><b>Você tem ${pendentes.length} treinamento${pendentes.length>1?'s':''} obrigatório${pendentes.length>1?'s':''} pendente${pendentes.length>1?'s':''}.</b> Conclua para ficar em dia.</div></div>`:''}
    ${next?`<div class="next-activity" onclick="openTrailAsStudent('${next.t.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openTrailAsStudent('${next.t.id}')">
      <div class="na-tag">${ic('play',13)} Próxima atividade · ${esc(nextReason)}</div>
      <div class="na-body">
        <div class="na-ic">${ic('trail',24)}</div>
        <div class="na-info"><h3>${esc(next.t.title)||'Trilha'}</h3>
          <p>${next.t.modules.length} módulo${next.t.modules.length!==1?'s':''}${trailDurationMin(next.t)?' · '+fmtDuration(trailDurationMin(next.t)):''}</p>
          <div class="rp-bar" style="margin-top:8px;"><span style="width:${next.pct}%"></span></div>
        </div>
        <div class="na-go">${ic('next',20)}</div>
      </div>
    </div>`:''}
    <div class="home-kpis">
      <div class="kpi-card"><div class="kpi-ic">${ic('trail',20)}</div><b>${my.length}</b><span>Trilhas disponíveis</span></div>
      <div class="kpi-card"><div class="kpi-ic">${ic('check',20)}</div><b>${withProg.filter(x=>x.pct===100).length}</b><span>Concluídas</span></div>
      <div class="kpi-card"><div class="kpi-ic">${ic('clock',20)}</div><b>${horas}h</b><span>Horas de treino</span></div>
      <div class="kpi-card"><div class="kpi-ic">${ic('certificate',20)}</div><b>${certs.length}</b><span>Certificados</span></div>
    </div>
    <div class="home-section">
      <div class="sec-head"><h2>Continuar aprendendo</h2></div>
      ${emAndamento.length
        ? `<div class="trail-grid">${emAndamento.map(x=>trailCardColab(x.t,x.pct)).join('')}</div>`
        : emptyBox('trail','Nada em andamento', my.length? 'Escolha uma trilha para começar.' : 'Nenhuma trilha foi publicada ainda pelo RH.', my.length?`<button class="btn btn-primary" onclick="go('trilhas')">${ic('trail',16)} Ver trilhas</button>`:'')}
    </div>`;
};
function trailCardColab(t,pct){
  const n=t.modules.length;
  const dur=fmtDuration(trailDurationMin(t));
  const dl=deadlineInfo(t);
  return `<div class="trail-card" role="button" tabindex="0" aria-label="Abrir trilha ${esc(t.title)||'sem título'}" onclick="openTrailAsStudent('${t.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTrailAsStudent('${t.id}')}">
    <div class="tc-top"><div class="tc-ic">${ic('trail',20)}</div>
      <div class="tc-badges">
        ${t.mandatory?`<span class="statuspill sp-mand">Obrigatória</span>`:''}
        ${pct===100?`<span class="statuspill sp-done">Concluída</span>`:pct>0?`<span class="statuspill sp-prog">${pct}%</span>`:''}
      </div>
    </div>
    <h3>${esc(t.title)||'Trilha sem título'}</h3>
    <p class="tc-sub">${esc(t.subtitle)||'&nbsp;'}</p>
    <div class="tc-foot"><span>${n} módulo${n!==1?'s':''}</span>${dur?`<span class="tc-dur">${ic('clock',13)} ${dur}</span>`:''}</div>
    ${dl&&pct<100?`<div class="tc-deadline ${dl.cls}">${ic('calendar',13)} ${dl.label}</div>`:''}
    <div class="rp-bar" style="margin-top:10px;"><span style="width:${pct}%"></span></div>
  </div>`;
}
/* info de prazo: rótulo + classe (no prazo / próximo / vencido) */
function deadlineInfo(t){
  if(!t.deadline)return null;
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const dl=new Date(t.deadline+'T00:00:00');
  const dias=Math.round((dl-hoje)/86400000);
  if(dias<0)return {cls:'dl-late',label:'Prazo vencido ('+formatDate(t.deadline)+')'};
  if(dias===0)return {cls:'dl-soon',label:'Prazo: hoje'};
  if(dias<=7)return {cls:'dl-soon',label:'Prazo em '+dias+' dia'+(dias>1?'s':'')};
  return {cls:'dl-ok',label:'Prazo: '+formatDate(t.deadline)};
}

/* ---------- TRILHAS (colaborador) ---------- */
SCREENS['trilhas']=(host)=>{
  const list=trailsForUser(currentUser);
  host.innerHTML=pageHead('Trilhas','Todas as trilhas disponíveis para você.')+
    (list.length
      ? `<div class="trail-grid">${list.map(t=>trailCardColab(t,trailPct(currentUser.id,t))).join('')}</div>`
      : emptyBox('trail','Nenhuma trilha publicada','O RH ainda não publicou trilhas. Volte em breve.',''));
};

/* ---------- EVENTOS (colaborador) ---------- */
SCREENS['eventos']=(host)=>{
  const evs=eventsForUser(currentUser).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  host.innerHTML=pageHead('Eventos','Treinamentos e encontros presenciais.')+
    (evs.length
      ? `<div class="event-list">${evs.map(e=>eventCardColab(e)).join('')}</div>`
      : emptyBox('calendar','Nenhum evento','Não há eventos atribuídos a você no momento.',''));
};
function eventCardColab(e){
  const p=eventParticipant(e,currentUser.id);
  const inscrito=p&&p.status!=='cancelado';
  const insc=eventEnrolledCount(e);
  const lotado=!eventHasVaga(e)&&!inscrito;
  const st=p?(EV_STATUS[p.status]||null):null;
  let btn;
  if(p&&(p.status==='presente'||p.status==='ausente')){
    btn=`<span class="ev-status ${st.cls}" style="align-self:flex-start;">${st.label==='Presente'?'Presença confirmada':'Marcado como ausente'}</span>`;
  }else if(inscrito){
    btn=`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><span class="ev-status st-insc">Inscrito</span>
      <button class="btn btn-ghost btn-sm" onclick="cancelEnroll('${e.id}')">Cancelar inscrição</button></div>`;
  }else if(lotado){
    btn=`<span class="ev-status st-canc" style="align-self:flex-start;">Vagas esgotadas</span>`;
  }else{
    btn=`<button class="btn btn-primary btn-sm" onclick="enrollEvent('${e.id}')">${ic('plus',15)} Inscrever-se</button>`;
  }
  return `<div class="event-card">
    <div class="ev-date">${ic('calendar',16)} ${esc(formatDate(e.date))||'Data a definir'}${e.hours?` · ${e.hours}h`:''}</div>
    <h3>${esc(e.title)||'Evento'}</h3>
    ${e.local?`<p class="ev-local">${ic('pin',14)} ${esc(e.local)}</p>`:''}
    ${e.desc?`<p class="ev-desc">${esc(e.desc)}</p>`:''}
    <div class="ev-meta"><span class="ev-chip">${ic('user',13)} ${e.vagas?`${insc}/${e.vagas} vagas`:`${insc} inscrito(s)`}</span></div>
    ${btn}
  </div>`;
}
function enrollEvent(eventId){
  const r=eventEnroll(eventId,currentUser.id);
  if(!r.ok){toast(r.error,true);return;}
  go('eventos');toast('Inscrição confirmada');
}
function cancelEnroll(eventId){
  eventCancelEnroll(eventId,currentUser.id);go('eventos');toast('Inscrição cancelada');
}

/* ---------- CONQUISTAS ---------- */
SCREENS['conquistas']=(host)=>{
  const certs=certsOf(currentUser.id);
  host.innerHTML=pageHead('Conquistas','Seus certificados e progresso.')+
    (certs.length
      ? `<div class="cert-grid">${certs.map(c=>`<div class="cert-mini">
          <div class="cm-ic">${ic('certificate',26)}</div>
          <h3>${esc(c.trailTitle)||'Trilha'}</h3>
          <p>Emitido em ${esc(formatDate(c.issuedAt.slice(0,10)))}</p>
          <button class="btn btn-ghost btn-sm" onclick="openCertFromStore('${c.trailId}')">${ic('print',14)} Ver certificado</button>
        </div>`).join('')}</div>`
      : emptyBox('trophy','Nenhuma conquista ainda','Conclua 100% de uma trilha para emitir seu primeiro certificado.', trailsForUser(currentUser).length?`<button class="btn btn-primary" onclick="go('trilhas')">${ic('trail',16)} Ver trilhas</button>`:''));
};

/* ---------- PERFIL ---------- */
SCREENS['perfil']=(host)=>{
  const u=currentUser;
  const trails=trailsForUser(currentUser);
  const concl=trails.filter(t=>trailPct(u.id,t)===100).length;
  host.innerHTML=pageHead('Perfil','Seus dados e desempenho.')+`
    <div class="profile-card">
      <div class="pf-avatar">${esc((u.name[0]||'?').toUpperCase())}</div>
      <div class="pf-info">
        <h2>${esc(u.name)}</h2>
        <p>${roleLabel(u.role)}${u.sector?' · '+esc(u.sector):''}</p>
        ${u.email?`<p class="muted">${esc(u.email)}</p>`:''}
      </div>
    </div>
    <div class="home-kpis" style="margin-top:18px;">
      <div class="kpi-card"><div class="kpi-ic">${ic('trail',20)}</div><b>${trails.length}</b><span>Trilhas disponíveis</span></div>
      <div class="kpi-card"><div class="kpi-ic">${ic('check',20)}</div><b>${concl}</b><span>Concluídas</span></div>
      <div class="kpi-card"><div class="kpi-ic">${ic('certificate',20)}</div><b>${certsOf(u.id).length}</b><span>Certificados</span></div>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:22px;" onclick="logout()">${ic('logout',16)} Sair da conta</button>`;
};

/* ---------- utilidades ---------- */
function formatDate(d){
  if(!d)return '';
  const parts=d.split('-');
  if(parts.length===3)return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}
