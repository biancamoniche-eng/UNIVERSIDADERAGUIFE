/* ============================================================
   screens_rh.js — telas de RH e Gestor + ponte para a Aprendizagem.
============================================================ */

/* ---------- RH: TRILHAS (gestão) ---------- */
let rhTrailQuery='',rhTrailSort='recent';
SCREENS['rh-trilhas']=(host)=>{
  let list=trailsAll();
  if(rhTrailQuery){const q=rhTrailQuery.toLowerCase();list=list.filter(t=>(t.title||'').toLowerCase().includes(q)||(t.subtitle||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q));}
  // ordenação
  list=list.slice();
  if(rhTrailSort==='recent')list.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  else if(rhTrailSort==='title')list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
  else if(rhTrailSort==='mandatory')list.sort((a,b)=>(b.mandatory?1:0)-(a.mandatory?1:0));
  const actions=`<button class="btn btn-primary btn-sm" onclick="rhNewTrail()">${ic('plus',15)} Nova trilha</button>`;
  const tools=trailsAll().length?`<div class="toolbar-row">
    <div class="search-bar">${ic('search',16)}<input id="rhTrailSearch" placeholder="Buscar por título ou categoria..." value="${esc(rhTrailQuery)}" oninput="rhTrailQuery=this.value;go('rh-trilhas');setTimeout(()=>{var e=document.getElementById('rhTrailSearch');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}},0)"></div>
    <div class="filter-pills">
      ${[['recent','Recentes'],['title','A–Z'],['mandatory','Obrigatórias']].map(([k,l])=>`<button class="type-pill ${rhTrailSort===k?'on':''}" onclick="rhTrailSort='${k}';go('rh-trilhas')">${l}</button>`).join('')}
    </div>
  </div>`:'';
  // agrupa por categoria
  let body;
  if(!trailsAll().length){
    body=emptyBox('trail','Nenhuma trilha criada','Crie a primeira trilha com vídeos, PDFs, textos e avaliações.',`<button class="btn btn-primary" onclick="rhNewTrail()">${ic('plus',16)} Criar trilha</button>`);
  }else if(!list.length){
    body=emptyBox('search','Nada encontrado','Nenhuma trilha corresponde à busca.','');
  }else{
    const cats={};list.forEach(t=>{const c=t.category||'Sem categoria';(cats[c]=cats[c]||[]).push(t);});
    const catNames=Object.keys(cats);
    const useGroups=catNames.length>1||(catNames.length===1&&catNames[0]!=='Sem categoria');
    if(useGroups){
      body=catNames.sort((a,b)=>a==='Sem categoria'?1:b==='Sem categoria'?-1:a.localeCompare(b))
        .map(c=>`<div class="cat-group"><div class="cat-title">${ic('trail',14)} ${esc(c)} <span class="cat-count">${cats[c].length}</span></div>
          <div class="trail-grid">${cats[c].map(t=>rhTrailCard(t)).join('')}</div></div>`).join('');
    }else{
      body=`<div class="trail-grid">${list.map(t=>rhTrailCard(t)).join('')}</div>`;
    }
  }
  host.innerHTML=pageHead('Trilhas','Crie e gerencie as trilhas de aprendizagem.',actions)+onboardingPanel()+tools+body;
};
/* painel "primeiros passos" — aparece enquanto o sistema está sendo montado */
function onboardingPanel(){
  const hasUser=usersAll().some(u=>u.role!=='rh');
  const hasTrail=trailsAll().length>0;
  const hasPub=trailsPublished().length>0;
  if(hasUser&&hasTrail&&hasPub)return ''; // tudo pronto, some
  const step=(done,txt,action)=>`<div class="ob-step ${done?'done':''}">
    <span class="ob-check">${done?ic('check',14):''}</span>
    <span class="ob-txt">${txt}</span>
    ${!done&&action?action:''}
  </div>`;
  return `<div class="onboarding">
    <div class="ob-head">${ic('award',18)} <b>Primeiros passos</b><span>monte seu LMS em 3 passos</span></div>
    ${step(hasTrail,'Crie sua primeira trilha de aprendizagem',`<button class="btn btn-primary btn-sm" onclick="rhNewTrail()">Criar trilha</button>`)}
    ${step(hasUser,'Cadastre colaboradores',`<button class="btn btn-ghost btn-sm" onclick="go('rh-usuarios')">Ir para Usuários</button>`)}
    ${step(hasPub,'Publique uma trilha para os colaboradores verem',hasTrail?`<span class="muted" style="font-size:12.5px;">use o botão "Publicar" no card</span>`:'')}
  </div>`;
}
function rhTrailCard(t){
  const n=t.modules.length;
  const pub=t.status==='published';
  const dur=fmtDuration(trailDurationMin(t));
  const assignLabel = (t.assignment&&t.assignment.mode==='restricted')
    ? `${(t.assignment.sectors||[]).length} setor(es) · ${(t.assignment.userIds||[]).length} pessoa(s)`
    : 'Todos';
  return `<div class="trail-card trail-card-rh">
    <div class="tc-top"><div class="tc-ic">${ic('trail',20)}</div>
      <span class="statuspill ${pub?'sp-done':'sp-pend'}">${pub?'Publicada':'Rascunho'}</span>
    </div>
    <h3>${esc(t.title)||'Trilha sem título'}</h3>
    ${t.category?`<div class="tc-cat">${esc(t.category)}</div>`:''}
    <p class="tc-sub">${esc(t.subtitle)||'&nbsp;'}</p>
    <div class="tc-foot"><span>${n} módulo${n!==1?'s':''}</span>${dur?`<span class="tc-dur">${ic('clock',13)} ${dur}</span>`:''}</div>
    <div class="tc-assign">${ic('team',13)} ${esc(assignLabel)}</div>
    <div class="tc-rh-actions">
      <button class="btn ${pub?'btn-ghost':'btn-primary'} btn-sm" onclick="rhTogglePublish('${t.id}')">${pub?ic('eyeOff',14)+' Despublicar':ic('eye',14)+' Publicar'}</button>
      <button class="btn btn-ghost btn-sm" onclick="rhAssignForm('${t.id}')">${ic('team',14)} Atribuir</button>
      <div style="flex:1"></div>
      <button class="iconbtn sm" title="Pré-visualizar" aria-label="Pré-visualizar" onclick="openTrailAsStudent('${t.id}')">${ic('play',15)}</button>
      <button class="iconbtn sm" title="Editar" aria-label="Editar" onclick="rhEditTrail('${t.id}')">${ic('edit',15)}</button>
      <button class="iconbtn sm" title="Excluir" aria-label="Excluir" onclick="rhDeleteTrail('${t.id}')">${ic('trash',15)}</button>
    </div>
  </div>`;
}
function rhTogglePublish(id){
  const t=trailById(id);if(!t)return;
  if(t.status!=='published'){
    const probs=validateTrail(t);
    if(probs.length){
      openModal(`<h3>Não dá para publicar ainda</h3>
        <p style="color:var(--gray-600);font-size:14px;margin-bottom:12px;">Corrija os pontos abaixo antes de publicar:</p>
        <ul class="val-list">${probs.map(p=>`<li>${ic('warn',14)} ${esc(p)}</li>`).join('')}</ul>
        <div class="modal-actions">
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">Fechar</button>
          <button class="btn btn-primary btn-sm" onclick="closeModal();rhEditTrail('${t.id}')">${ic('edit',14)} Editar trilha</button>
        </div>`);
      return;
    }
    t.status='published';trailUpsert(t);toast('Trilha publicada');
  }else{t.status='draft';trailUpsert(t);toast('Trilha despublicada (rascunho)');}
  go('rh-trilhas');
}
function rhAssignForm(id){
  const t=trailById(id);if(!t)return;
  const a=t.assignment||{mode:'all',sectors:[],userIds:[]};
  const sectors=[...new Set(usersAll().map(u=>u.sector).filter(Boolean))];
  const colabs=usersAll().filter(u=>u.role!=='rh');
  openModal(`
    <h3>Atribuir trilha</h3>
    <p style="color:var(--gray-600);font-size:14px;margin-bottom:14px;">"${esc(t.title)||'Trilha'}"</p>
    <div class="fld"><label>Quem vê esta trilha?</label>
      <div class="type-pills">
        <button class="type-pill ${a.mode==='all'?'on':''}" onclick="rhAssignMode('all')" id="amAll">Todos</button>
        <button class="type-pill ${a.mode==='restricted'?'on':''}" onclick="rhAssignMode('restricted')" id="amRes">Selecionar</button>
      </div>
    </div>
    <div id="assignDetail" style="display:${a.mode==='restricted'?'block':'none'}">
      <div class="fld"><label>Setores</label>
        ${sectors.length?`<div class="chk-list">${sectors.map(s=>`<label class="chk"><input type="checkbox" value="${esc(s)}" ${a.sectors.includes(s)?'checked':''} onchange="rhAssignToggle('sector',this.value,this.checked)"> ${esc(s)}</label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhum setor cadastrado nos usuários.</p>'}
      </div>
      <div class="fld"><label>Pessoas específicas</label>
        ${colabs.length?`<div class="chk-list">${colabs.map(u=>`<label class="chk"><input type="checkbox" value="${u.id}" ${a.userIds.includes(u.id)?'checked':''} onchange="rhAssignToggle('user',this.value,this.checked)"> ${esc(u.name)} <span class="muted">(${roleLabel(u.role)})</span></label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhum colaborador cadastrado.</p>'}
      </div>
    </div>
    <div class="fld" style="border-top:1px solid var(--gray-100);padding-top:14px;margin-top:4px;">
      <label class="chk" style="font-size:14px;font-weight:700;"><input type="checkbox" id="tMandatory" ${t.mandatory?'checked':''}> Trilha obrigatória</label>
    </div>
    <div class="fld"><label>Prazo para conclusão (opcional)</label><input class="inp" type="date" id="tDeadline" value="${esc(t.deadline||'')}"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" onclick="rhAssignSave('${t.id}')">Salvar atribuição</button>
    </div>`);
  window._assignDraft={mode:a.mode,sectors:a.sectors.slice(),userIds:a.userIds.slice()};
}
function rhAssignMode(mode){window._assignDraft.mode=mode;
  document.getElementById('amAll').classList.toggle('on',mode==='all');
  document.getElementById('amRes').classList.toggle('on',mode==='restricted');
  document.getElementById('assignDetail').style.display=mode==='restricted'?'block':'none';
}
function rhAssignToggle(kind,value,checked){
  const d=window._assignDraft;
  const arr=kind==='sector'?d.sectors:d.userIds;
  const i=arr.indexOf(value);
  if(checked&&i<0)arr.push(value);else if(!checked&&i>=0)arr.splice(i,1);
}
function rhAssignSave(id){
  const t=trailById(id);if(!t)return;
  t.assignment=window._assignDraft;
  const mEl=document.getElementById('tMandatory'),dEl=document.getElementById('tDeadline');
  t.mandatory=mEl?mEl.checked:false;
  t.deadline=dEl?dEl.value:'';
  trailUpsert(t);closeModal();go('rh-trilhas');toast('Atribuição salva');
}
function rhNewTrail(){
  trail=normalizeTrail({id:newId('t'),title:'',subtitle:'',modules:[]});
  progress={done:[],polls:{},passed:{},scores:{},attempts:{}};
  currentIdx=0;mode='editor';
  enterLearningShell();
  setMode('editor');
}
function rhEditTrail(id){
  const t=trailById(id);if(!t)return;
  trail=JSON.parse(JSON.stringify(t));
  progress={done:[],polls:{},passed:{},scores:{},attempts:{}};
  currentIdx=0;mode='editor';
  enterLearningShell();
  setMode('editor');
}
function rhDeleteTrail(id){
  const t=trailById(id);if(!t)return;
  confirmModal('Excluir trilha','"'+(t.title||'sem título')+'" será removida permanentemente.',
    ()=>{trailDelete(id);go('rh-trilhas');toast('Trilha excluída');},{danger:true,confirmLabel:'Excluir'});
}

/* ---------- RH: USUÁRIOS ---------- */
let rhUserQuery='',rhUserRole='all';
SCREENS['rh-usuarios']=(host)=>{
  let list=usersAll();
  if(rhUserRole!=='all')list=list.filter(u=>u.role===rhUserRole);
  if(rhUserQuery){const q=rhUserQuery.toLowerCase();list=list.filter(u=>(u.name||'').toLowerCase().includes(q)||(u.sector||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q));}
  const actions=`<button class="btn btn-ghost btn-sm" onclick="go('rh-historico')">${ic('chart',15)} Histórico</button><button class="btn btn-ghost btn-sm" onclick="rhCargoTrails()">${ic('trail',15)} Trilhas por cargo</button><button class="btn btn-primary btn-sm" onclick="rhUserForm()">${ic('plus',15)} Novo usuário</button>`;
  const tools=usersAll().length?`<div class="toolbar-row">
    <div class="search-bar">${ic('search',16)}<input id="rhUserSearch" placeholder="Buscar por nome, setor ou e-mail..." value="${esc(rhUserQuery)}" oninput="rhUserQuery=this.value;go('rh-usuarios');setTimeout(()=>{var e=document.getElementById('rhUserSearch');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}},0)"></div>
    <div class="filter-pills">
      ${[['all','Todos'],['collaborator','Colaboradores'],['manager','Gestores'],['rh','RH']].map(([k,l])=>`<button class="type-pill ${rhUserRole===k?'on':''}" onclick="rhUserRole='${k}';go('rh-usuarios')">${l}</button>`).join('')}
    </div>
  </div>`:'';
  host.innerHTML=pageHead('Usuários','Cadastre colaboradores, gestores e RH.',actions)+tools+
    (usersAll().length
      ? (list.length?`<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Setor</th><th>Cargo</th><th></th></tr></thead>
          <tbody>${list.map(u=>`<tr>
            <td><div class="td-user"><span class="td-av">${esc((u.name[0]||'?').toUpperCase())}</span>${esc(u.name)||'—'}</div></td>
            <td>${esc(u.email)||'—'}</td>
            <td><span class="role-badge role-${u.role}">${roleLabel(u.role)}</span></td>
            <td>${esc(u.sector)||'—'}</td>
            <td>${esc(u.cargo)||'—'}</td>
            <td class="td-actions"><button class="iconbtn sm" title="Editar" aria-label="Editar" onclick="rhUserForm('${u.id}')">${ic('edit',14)}</button><button class="iconbtn sm" title="Excluir" aria-label="Excluir" onclick="rhUserDelete('${u.id}')">${ic('trash',14)}</button></td>
          </tr>`).join('')}</tbody></table></div>`:emptyBox('search','Nada encontrado','Nenhum usuário corresponde à busca.',''))
      : emptyBox('team','Nenhum usuário','Cadastre o primeiro colaborador, gestor ou RH.',`<button class="btn btn-primary" onclick="rhUserForm()">${ic('plus',16)} Novo usuário</button>`));
};
function rhUserForm(id){
  const u=id?userById(id):null;
  const managers=usersAll().filter(x=>x.role==='manager');
  const curPass=u?(u.password||defaultPassword(u.name)):'';
  openModal(`
    <h3>${u?'Editar usuário':'Novo usuário'}</h3>
    <div class="fld"><label>Nome completo</label><input class="inp" id="uName" value="${u?esc(u.name):''}" placeholder="Ex.: Carlos Silva" oninput="rhSuggestPass()"></div>
    <div class="fld"><label>E-mail (usado no login)</label><input class="inp" id="uEmail" type="email" value="${u?esc(u.email):''}" placeholder="carlos.silva@raguife.com.br"></div>
    <div class="fld"><label>Perfil</label><select class="inp" id="uRole" onchange="rhRoleChange(this.value)">
      <option value="collaborator" ${u&&u.role==='collaborator'?'selected':''}>Colaborador</option>
      <option value="manager" ${u&&u.role==='manager'?'selected':''}>Gestor</option>
      <option value="rh" ${u&&u.role==='rh'?'selected':''}>RH</option>
    </select></div>
    <div class="fld"><label>Setor</label><input class="inp" id="uSector" value="${u?esc(u.sector):''}" placeholder="Ex.: Produção"></div>
    <div class="fld"><label>Cargo</label><input class="inp" id="uCargo" value="${u?esc(u.cargo||''):''}" placeholder="Ex.: Operador de produção"></div>
    <div class="fld" id="uMgrWrap" style="display:${(!u||u.role==='collaborator')?'block':'none'}"><label>Gestor responsável</label>
      <select class="inp" id="uManager"><option value="">— nenhum —</option>
        ${managers.map(mg=>`<option value="${mg.id}" ${u&&u.managerId===mg.id?'selected':''}>${esc(mg.name)}</option>`).join('')}
      </select></div>
    <div class="fld"><label>Senha de acesso</label>
      <div class="pass-row">
        <input class="inp" id="uPassword" type="text" value="${esc(curPass)}" placeholder="Senha de acesso">
        <button type="button" class="btn-copy" title="Copiar senha" aria-label="Copiar senha" onclick="copyPass()">${ic('copy',15)}</button>
      </div>
      <p class="hint" id="uPassHint">Senha padrão = 1ª letra do nome + sobrenome (ex.: Carlos Silva → csilva). Informe ao colaborador; ele pode trocar depois.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" onclick="rhUserSave('${id||''}')">Salvar</button>
    </div>`);
  window._userPassEdited=!!id; // ao editar, não sobrescreve o que já existe
}
function rhRoleChange(role){
  const mgr=document.getElementById('uMgrWrap');
  if(mgr)mgr.style.display=role==='collaborator'?'block':'none';
}
/* sugere a senha padrão a partir do nome, enquanto o RH não editar manualmente */
function rhSuggestPass(){
  if(window._userPassEdited)return;
  const name=val('uName');const p=document.getElementById('uPassword');
  if(p)p.value=defaultPassword(name);
}
function copyPass(){
  const p=document.getElementById('uPassword');if(!p)return;
  const v=p.value||'';
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(()=>toast('Senha copiada')).catch(()=>fallbackCopy(p));}
  else fallbackCopy(p);
}
function fallbackCopy(input){input.select();try{document.execCommand('copy');toast('Senha copiada');}catch(e){toast('Copie manualmente',true);}}
function rhUserSave(id){
  const name=val('uName');if(!name.trim()){toast('Digite o nome',true);return;}
  const email=val('uEmail').trim();
  if(!email){toast('Informe o e-mail (usado no login)',true);return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast('E-mail inválido',true);return;}
  // e-mail único
  const clash=usersAll().find(x=>x.id!==id&&(x.email||'').toLowerCase()===email.toLowerCase());
  if(clash){toast('Já existe um usuário com esse e-mail',true);return;}
  const role=val('uRole');
  let password=val('uPassword').trim();
  if(!password)password=defaultPassword(name);
  const data={name,email,role,sector:val('uSector'),cargo:val('uCargo'),password,login:'',
    managerId:role==='collaborator'?(val('uManager')||null):null};
  if(id)userUpdate(id,data);else userCreate(data);
  closeModal();go('rh-usuarios');toast('Usuário salvo');
}
function rhUserDelete(id){
  const u=userById(id);if(!u)return;
  confirmModal('Excluir usuário','"'+u.name+'" será removido permanentemente.',
    ()=>{userDelete(id);go('rh-usuarios');toast('Usuário excluído');},{danger:true,confirmLabel:'Excluir'});
}

/* ---------- RH: EVENTOS ---------- */
SCREENS['rh-eventos']=(host)=>{
  const evs=eventsAll().slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const actions=`<button class="btn btn-primary btn-sm" onclick="rhEventForm()">${ic('plus',15)} Novo evento</button>`;
  host.innerHTML=pageHead('Eventos','Treinamentos e encontros presenciais.',actions)+
    (evs.length
      ? `<div class="event-list">${evs.map(e=>{
          const insc=eventEnrolledCount(e);
          const vagasTxt=e.vagas?`${insc}/${e.vagas} vagas`:`${insc} inscrito(s)`;
          const rate=eventPresenceRate(e);
          return `<div class="event-card">
            <div class="ev-date">${ic('calendar',16)} ${esc(formatDate(e.date))||'Data a definir'}${e.hours?` · ${e.hours}h`:''}</div>
            <h3>${esc(e.title)}</h3>
            ${e.local?`<p class="ev-local">${ic('pin',14)} ${esc(e.local)}</p>`:''}
            ${e.desc?`<p class="ev-desc">${esc(e.desc)}</p>`:''}
            <div class="ev-meta">
              <span class="ev-chip">${ic('team',13)} ${esc(eventAssignLabel(e))}</span>
              <span class="ev-chip">${ic('user',13)} ${vagasTxt}</span>
              ${rate!=null?`<span class="ev-chip ev-chip-rate">${ic('chart',13)} ${rate}% presença</span>`:''}
            </div>
            <div class="ev-foot" style="gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="rhEventManage('${e.id}')">${ic('team',14)} Participantes</button>
              <div style="flex:1"></div>
              <button class="iconbtn sm" title="Editar" aria-label="Editar" onclick="rhEventForm('${e.id}')">${ic('edit',14)}</button>
              <button class="iconbtn sm" title="Excluir" aria-label="Excluir" onclick="rhEventDelete('${e.id}')">${ic('trash',14)}</button>
            </div>
          </div>`;}).join('')}</div>`
      : emptyBox('calendar','Nenhum evento','Cadastre o primeiro evento presencial.',`<button class="btn btn-primary" onclick="rhEventForm()">${ic('plus',16)} Novo evento</button>`));
};
const EV_STATUS={inscrito:{label:'Inscrito',cls:'st-insc'},presente:{label:'Presente',cls:'st-pres'},ausente:{label:'Ausente',cls:'st-aus'},cancelado:{label:'Cancelado',cls:'st-canc'}};
/* tela de gestão de participantes + confirmação de presença */
function rhEventManage(eventId){
  const e=eventById(eventId);if(!e)return;
  const parts=(e.participants||[]).slice().sort((a,b)=>{
    const ua=userById(a.userId),ub=userById(b.userId);return (ua?ua.name:'').localeCompare(ub?ub.name:'');
  });
  const rate=eventPresenceRate(e);
  activeScreen='rh-eventos';
  const host=document.getElementById('screenHost');
  host.innerHTML=pageHead(esc(e.title),`${formatDate(e.date)||'Data a definir'}${e.local?' · '+esc(e.local):''}${e.hours?' · '+e.hours+'h':''}`,
    `<button class="btn btn-ghost btn-sm" onclick="go('rh-eventos')">${ic('prev',14)} Voltar</button>`)+`
    <div class="status-cards" style="margin-bottom:18px;">
      <div class="status-card sc-prog"><b>${eventEnrolledCount(e)}</b><span>Inscritos</span></div>
      <div class="status-card sc-done"><b>${(e.participants||[]).filter(p=>p.status==='presente').length}</b><span>Presentes</span></div>
      <div class="status-card sc-pend"><b>${(e.participants||[]).filter(p=>p.status==='ausente').length}</b><span>Ausentes</span></div>
      <div class="status-card"><b>${rate!=null?rate+'%':'—'}</b><span>Taxa presença</span></div>
    </div>
    <div class="ed-group">
      <div class="ed-group-title">${ic('team',16)} Adicionar participante</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select class="inp" id="evAddUser" style="flex:1;min-width:180px;">
          <option value="">Selecione um colaborador...</option>
          ${collaboratorsAll().filter(u=>!eventParticipant(e,u.id)||eventParticipant(e,u.id).status==='cancelado').map(u=>`<option value="${u.id}">${esc(u.name)}${u.sector?' · '+esc(u.sector):''}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="rhEventAddParticipant('${e.id}')">${ic('plus',14)} Inscrever</button>
      </div>
    </div>
    ${parts.length?`<div class="part-list">${parts.map(p=>{
      const u=userById(p.userId);if(!u)return '';
      const st=EV_STATUS[p.status]||EV_STATUS.inscrito;
      return `<div class="part-row">
        <div class="part-info"><span class="td-av">${esc((u.name[0]||'?').toUpperCase())}</span>
          <div><b>${esc(u.name)}</b><span class="muted">${esc(u.sector||'—')}${u.cargo?' · '+esc(u.cargo):''}</span>
          ${p.confirmedAt?`<span class="part-conf">${ic('check',11)} ${st.label} em ${formatDate(p.confirmedAt.slice(0,10))} por ${esc((userById(p.confirmedBy)||{}).name||'RH')}</span>`:''}
          </div>
        </div>
        <div class="part-actions">
          <span class="ev-status ${st.cls}">${st.label}</span>
          <button class="btn btn-sm ${p.status==='presente'?'btn-primary':'btn-ghost'}" onclick="rhEventConfirm('${e.id}','${u.id}','presente')">Presente</button>
          <button class="btn btn-sm ${p.status==='ausente'?'btn-danger':'btn-ghost'}" onclick="rhEventConfirm('${e.id}','${u.id}','ausente')">Ausente</button>
        </div>
      </div>`;}).join('')}</div>`
    :emptyBox('team','Ninguém inscrito ainda','Inscreva colaboradores acima ou aguarde as inscrições.','')}`;
}
function rhEventAddParticipant(eventId){
  const uid=val('evAddUser');if(!uid){toast('Selecione um colaborador',true);return;}
  const r=eventEnroll(eventId,uid);
  if(!r.ok){toast(r.error,true);return;}
  rhEventManage(eventId);toast('Participante inscrito');
}
function rhEventConfirm(eventId,userId,status){
  eventSetStatus(eventId,userId,status,currentUser.id);
  rhEventManage(eventId);
}
function eventAssignLabel(e){
  const a=e.assignment||{mode:'all'};
  if(a.mode==='all')return 'Todos';
  const parts=[];
  if((a.sectors||[]).length)parts.push((a.sectors.length)+' setor(es)');
  if((a.cargos||[]).length)parts.push((a.cargos.length)+' cargo(s)');
  if((a.userIds||[]).length)parts.push((a.userIds.length)+' pessoa(s)');
  return parts.length?parts.join(' · '):'Ninguém ainda';
}
function rhEventForm(id){
  const e=id?eventById(id):null;
  const sectors=[...new Set(usersAll().map(u=>u.sector).filter(Boolean))];
  const cargos=[...new Set(usersAll().map(u=>u.cargo).filter(Boolean))];
  const colabs=usersAll().filter(u=>u.role!=='rh');
  const a=e?e.assignment:{mode:'all',sectors:[],cargos:[],userIds:[]};
  window._evAssign={mode:a.mode,sectors:(a.sectors||[]).slice(),cargos:(a.cargos||[]).slice(),userIds:(a.userIds||[]).slice()};
  window._evEditId=id||'';
  openModal(`
    <h3>${e?'Editar evento':'Novo evento'}</h3>
    <div class="fld"><label>Título</label><input class="inp" id="eTitle" value="${e?esc(e.title):''}" placeholder="Ex.: Treinamento de Segurança"></div>
    <div class="fld-row">
      <div class="fld" style="flex:1;"><label>Data</label><input class="inp" id="eDate" type="date" value="${e?esc(e.date):''}"></div>
      <div class="fld" style="width:110px;"><label>Carga (h)</label><input class="inp" id="eHours" type="number" min="0" step="0.5" value="${e?e.hours:''}" placeholder="0"></div>
      <div class="fld" style="width:110px;"><label>Vagas</label><input class="inp" id="eVagas" type="number" min="0" value="${e?e.vagas:''}" placeholder="0 = ∞"></div>
    </div>
    <div class="fld"><label>Local</label><input class="inp" id="eLocal" value="${e?esc(e.local):''}" placeholder="Ex.: Auditório"></div>
    <div class="fld"><label>Descrição</label><textarea class="inp" id="eDesc" placeholder="Detalhes do evento">${e?esc(e.desc):''}</textarea></div>
    <div class="fld"><label>Quem participa?</label>
      <div class="type-pills">
        <button type="button" class="type-pill ${a.mode==='all'?'on':''}" id="evmAll" onclick="evAssignMode('all')">Todos</button>
        <button type="button" class="type-pill ${a.mode==='restricted'?'on':''}" id="evmRes" onclick="evAssignMode('restricted')">Selecionar</button>
      </div>
    </div>
    <div id="evDetail" style="display:${a.mode==='restricted'?'block':'none'}">
      <div class="fld"><label>Setores</label>
        ${sectors.length?`<div class="chk-list">${sectors.map(s=>`<label class="chk"><input type="checkbox" value="${esc(s)}" ${(a.sectors||[]).includes(s)?'checked':''} onchange="evAssignToggle('sector',this.value,this.checked)"> ${esc(s)}</label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhum setor cadastrado.</p>'}
      </div>
      <div class="fld"><label>Cargos</label>
        ${cargos.length?`<div class="chk-list">${cargos.map(c=>`<label class="chk"><input type="checkbox" value="${esc(c)}" ${(a.cargos||[]).includes(c)?'checked':''} onchange="evAssignToggle('cargo',this.value,this.checked)"> ${esc(c)}</label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhum cargo cadastrado.</p>'}
      </div>
      <div class="fld"><label>Pessoas específicas</label>
        ${colabs.length?`<div class="chk-list">${colabs.map(u=>`<label class="chk"><input type="checkbox" value="${u.id}" ${(a.userIds||[]).includes(u.id)?'checked':''} onchange="evAssignToggle('user',this.value,this.checked)"> ${esc(u.name)} <span class="muted">(${roleLabel(u.role)})</span></label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhum colaborador.</p>'}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" onclick="rhEventSave()">Salvar</button>
    </div>`);
}
function evAssignMode(mode){
  window._evAssign.mode=mode;
  document.getElementById('evmAll').classList.toggle('on',mode==='all');
  document.getElementById('evmRes').classList.toggle('on',mode==='restricted');
  document.getElementById('evDetail').style.display=mode==='restricted'?'block':'none';
}
function evAssignToggle(kind,value,checked){
  const d=window._evAssign;
  const arr=kind==='sector'?d.sectors:(kind==='cargo'?d.cargos:d.userIds);
  const i=arr.indexOf(value);
  if(checked&&i<0)arr.push(value);else if(!checked&&i>=0)arr.splice(i,1);
}
function rhEventSave(){
  const title=val('eTitle');if(!title.trim()){toast('Digite o título',true);return;}
  const data={title,date:val('eDate'),local:val('eLocal'),desc:val('eDesc'),
    hours:parseFloat(val('eHours'))||0,vagas:parseInt(val('eVagas'))||0,
    assignment:window._evAssign||{mode:'all',sectors:[],cargos:[],userIds:[]}};
  if(window._evEditId){eventUpdate(window._evEditId,data);toast('Evento atualizado');}
  else{eventCreate(data);toast('Evento criado');}
  closeModal();go('rh-eventos');
}
function rhEventDelete(id){confirmModal('Excluir evento','Este evento e suas inscrições serão removidos.',()=>{eventDelete(id);go('rh-eventos');toast('Evento excluído');},{danger:true,confirmLabel:'Excluir'});}

/* ---------- RH: INDICADORES ---------- */
SCREENS['rh-dashboard']=(host)=>{
  const users=usersAll().filter(u=>u.role!=='rh');
  const pubTrails=trailsPublished();
  const totalCerts=db.certificates.length;
  const st=dashboardStats();

  // matриз usuário×trilha (só trilhas atribuídas a cada um)
  let somaPct=0,cont=0,naoIniciou=0,emAndamento=0,concluiu=0;
  const stuck=[]; // {user, trail} travados em quiz
  users.forEach(u=>{
    const myTrails=trailsForUser(u);
    myTrails.forEach(t=>{
      const pct=trailPct(u.id,t);somaPct+=pct;cont++;
      if(pct===0)naoIniciou++;else if(pct===100)concluiu++;else emAndamento++;
      if(pct>0&&pct<100){
        const p=progressGet(u.id,t.id);
        const temReprova=(t.modules||[]).some(m=>m.quiz&&moduleHasGate(m)&&!p.passed[m.id]&&p.attempts&&p.attempts[m.id]&&p.attempts[m.id].count>0);
        if(temReprova)stuck.push({u,t});
      }
    });
  });
  const media=cont?Math.round(somaPct/cont):0;
  const mesLabel=new Date(st.mes+'-01T00:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  host.innerHTML=pageHead('Dashboard executivo','Visão gerencial da Universidade Raguife — '+mesLabel)+`
    <div class="dash-grid">
      <div class="dash-card"><div class="dash-ic">${ic('team',18)}</div><b>${st.treinados}</b><span>Colaboradores treinados</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('clock',18)}</div><b>${st.horasMes}h</b><span>Horas treinadas no mês</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('calendar',18)}</div><b>${st.eventosRealizados}</b><span>Eventos no mês</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('chart',18)}</div><b>${st.taxaPresenca!=null?st.taxaPresenca+'%':'—'}</b><span>Presença em eventos</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('trail',18)}</div><b>${st.taxaConclusao}%</b><span>Conclusão de trilhas</span></div>
      <div class="dash-card ${st.obrigatoriasPendentes?'dash-warn':''}"><div class="dash-ic">${ic('warn',18)}</div><b>${st.obrigatoriasPendentes}</b><span>Obrigatórias pendentes</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('certificate',18)}</div><b>${st.certificadosMes}</b><span>Certificados no mês</span></div>
      <div class="dash-card ${st.semAcesso?'dash-warn':''}"><div class="dash-ic">${ic('user',18)}</div><b>${st.semAcesso}</b><span>Nunca acessaram</span></div>
    </div>

    <div class="dash-rankings">
      <div class="rank-box"><div class="rank-title">${ic('chart',15)} Ranking por área</div>
        ${st.rankingArea.length?st.rankingArea.map((r,i)=>`<div class="rank-row"><span class="rank-pos">${i+1}</span><span class="rank-name">${esc(r.nome)}</span><div class="rp-bar"><span style="width:${r.pct}%"></span></div><span class="rank-pct">${r.pct}%</span></div>`).join(''):'<p class="muted" style="font-size:13px;padding:8px;">Sem dados.</p>'}
      </div>
      <div class="rank-box"><div class="rank-title">${ic('team',15)} Ranking por gestor</div>
        ${st.rankingGestor.length?st.rankingGestor.map((r,i)=>`<div class="rank-row"><span class="rank-pos">${i+1}</span><span class="rank-name">${esc(r.nome)}</span><div class="rp-bar"><span style="width:${r.pct}%"></span></div><span class="rank-pct">${r.pct}%</span></div>`).join(''):'<p class="muted" style="font-size:13px;padding:8px;">Sem dados.</p>'}
      </div>
    </div>

    ${pubTrails.length&&users.length?`
    <div class="home-section"><div class="sec-head"><h2>Status das atribuições</h2></div>
      <div class="status-cards">
        <div class="status-card sc-pend"><b>${naoIniciou}</b><span>Não iniciaram</span></div>
        <div class="status-card sc-prog"><b>${emAndamento}</b><span>Em andamento</span></div>
        <div class="status-card sc-done"><b>${concluiu}</b><span>Concluíram</span></div>
      </div>
    </div>
    <div class="home-section"><div class="sec-head"><h2>Conclusão por trilha</h2></div>
      <div class="ind-list">${pubTrails.map(t=>{
        const elig=users.filter(u=>trailsForUser(u).some(x=>x.id===t.id));
        let s=0;elig.forEach(u=>s+=trailPct(u.id,t));const avg=elig.length?Math.round(s/elig.length):0;
        const done=elig.filter(u=>trailPct(u.id,t)===100).length;
        return `<div class="ind-row"><div class="ind-name">${esc(t.title)||'Sem título'}<span class="muted" style="display:block;font-size:11.5px;font-weight:600;">${done}/${elig.length} concluíram</span></div><div class="rp-bar"><span style="width:${avg}%"></span></div><div class="ind-pct">${avg}%</div></div>`;
      }).join('')}</div></div>
    ${stuck.length?`<div class="home-section"><div class="sec-head"><h2>Precisam de atenção</h2></div>
      <div class="alert-list">${stuck.slice(0,10).map(x=>{
        const p=progressGet(x.u.id,x.t.id);
        const mod=(x.t.modules||[]).find(m=>m.quiz&&moduleHasGate(m)&&!p.passed[m.id]&&p.attempts&&p.attempts[m.id]);
        const att=mod&&p.attempts[mod.id]?p.attempts[mod.id]:{count:0,best:0};
        return `<div class="alert-row">${ic('warn',16)}<div><b>${esc(x.u.name)}</b> travado em "${esc(x.t.title)}"<span class="muted" style="display:block;font-size:12px;">${att.count} tentativa(s) no quiz · melhor nota ${att.best}%</span></div></div>`;
      }).join('')}</div></div>`:''}
    `:emptyBox('chart','Sem dados ainda','Publique trilhas e cadastre usuários para ver os indicadores.','')}`;
};

/* ---------- GESTOR: MINHA EQUIPE ---------- */
SCREENS['gestor-equipe']=(host)=>{
  const team=collaboratorsOf(currentUser.id);
  const trails=trailsAll();
  host.innerHTML=pageHead('Minha equipe','Acompanhe o progresso dos seus colaboradores.')+
    (team.length
      ? `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Colaborador</th><th>Setor</th><th>Progresso médio</th><th>Certificados</th></tr></thead>
          <tbody>${team.map(u=>{
            let s=0;trails.forEach(t=>s+=trailPct(u.id,t));const avg=trails.length?Math.round(s/trails.length):0;
            return `<tr><td><div class="td-user"><span class="td-av">${esc((u.name[0]||'?').toUpperCase())}</span>${esc(u.name)}</div></td>
              <td>${esc(u.sector)||'—'}</td>
              <td><div class="ind-inline"><div class="rp-bar"><span style="width:${avg}%"></span></div><span>${avg}%</span></div></td>
              <td>${certsOf(u.id).length}</td></tr>`;
          }).join('')}</tbody></table></div>`
      : emptyBox('team','Nenhum colaborador na sua equipe','Peça ao RH para vincular colaboradores a você (campo "Gestor responsável").',''));
};
SCREENS['gestor-trilhas']=(host)=>{ SCREENS['trilhas'](host); };

/* ---------- RH: AJUSTES (backup + avisos) ---------- */
/* ===================== RELATÓRIOS GERENCIAIS (XLSX) ===================== */
SCREENS['rh-relatorios']=(host)=>{
  const st=dashboardStats();
  const mesLabel=new Date(st.mes+'-01T00:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  host.innerHTML=pageHead('Relatórios gerenciais','Exporte os dados da Universidade Raguife para Excel (.xlsx).')+`
    <div class="callout callout-info" style="margin-bottom:18px;">${ic('info',18)}<div>Os relatórios consideram o mês de referência <b>${mesLabel}</b> quando aplicável. Os arquivos abrem no Excel, Google Sheets ou LibreOffice.</div></div>
    <div class="report-grid">
      ${reportCard('relConsolidado','Relatório consolidado','Tudo em um arquivo: trilhas, eventos, certificados, horas e pendências.','file')}
      ${reportCard('relTrilhas','Participação em trilhas','Progresso de cada colaborador por trilha.','trail')}
      ${reportCard('relEventos','Participação em eventos','Inscrições, presenças e ausências por evento.','calendar')}
      ${reportCard('relCertificados','Certificados emitidos','Lista de certificados com carga horária e data.','certificate')}
      ${reportCard('relHoras','Horas treinadas','Horas de treinamento acumuladas por colaborador.','clock')}
      ${reportCard('relAtivos','Colaboradores e acesso','Ativos, último acesso e quem nunca acessou.','team')}
      ${reportCard('relPendentes','Obrigatórias pendentes','Treinamentos obrigatórios ainda não concluídos.','warn')}
    </div>`;
};
function reportCard(fn,title,desc,icon){
  return `<div class="report-card">
    <div class="report-ic">${ic(icon,20)}</div>
    <div class="report-body"><h3>${title}</h3><p>${desc}</p></div>
    <button class="btn btn-primary btn-sm" onclick="${fn}()">${ic('download',14)} Excel</button>
  </div>`;
}
function fdate(d){return d?formatDate((''+d).slice(0,10)):'';}
function relTrilhas(){
  const rows=[['Colaborador','Setor','Cargo','Trilha','Categoria','Obrigatória','Progresso (%)','Status']];
  collaboratorsAll().forEach(u=>trailsForUser(u).forEach(t=>{
    const pct=trailPct(u.id,t);
    rows.push([u.name,u.sector||'',u.cargo||'',t.title||'',t.category||'',t.mandatory?'Sim':'Não',pct,pct===100?'Concluída':pct>0?'Em andamento':'Não iniciada']);
  }));
  downloadXlsx('participacao-trilhas.xlsx',[{name:'Trilhas',rows}]);
}
function relEventos(){
  const rows=[['Evento','Data','Local','Carga (h)','Colaborador','Setor','Status','Confirmado em','Confirmado por']];
  eventsAll().forEach(e=>(e.participants||[]).forEach(p=>{
    const u=userById(p.userId);if(!u)return;
    rows.push([e.title||'',fdate(e.date),e.local||'',e.hours||0,u.name,u.sector||'',(EV_STATUS[p.status]||{}).label||p.status,p.confirmedAt?fdate(p.confirmedAt):'',p.confirmedBy?(userById(p.confirmedBy)||{}).name||'':'']);
  }));
  downloadXlsx('participacao-eventos.xlsx',[{name:'Eventos',rows}]);
}
function relCertificados(){
  const rows=[['Colaborador','Trilha','Carga horária (min)','Código','Data de emissão']];
  db.certificates.forEach(c=>rows.push([c.userName||'',c.trailTitle||'',c.durationMin||0,c.code||'',fdate(c.issuedAt)]));
  downloadXlsx('certificados-emitidos.xlsx',[{name:'Certificados',rows}]);
}
function relHoras(){
  const rows=[['Colaborador','Setor','Cargo','Horas de treinamento','Trilhas concluídas','Eventos presentes']];
  collaboratorsAll().forEach(u=>{
    const h=learningHistory(u.id);
    rows.push([u.name,u.sector||'',u.cargo||'',trainingHoursOf(u.id),h.concluidas.length,h.eventos.filter(x=>x.part.status==='presente').length]);
  });
  downloadXlsx('horas-treinadas.xlsx',[{name:'Horas',rows}]);
}
function relAtivos(){
  const rows=[['Colaborador','Setor','Cargo','Gestor','Último acesso','Já acessou?']];
  collaboratorsAll().forEach(u=>{
    const la=lastAccessOf(u.id);
    rows.push([u.name,u.sector||'',u.cargo||'',u.managerId?(userById(u.managerId)||{}).name||'':'',la?fdate(la):'Nunca',la?'Sim':'Não']);
  });
  downloadXlsx('colaboradores-acesso.xlsx',[{name:'Acesso',rows}]);
}
function relPendentes(){
  const rows=[['Colaborador','Setor','Cargo','Trilha obrigatória pendente','Progresso (%)','Prazo']];
  collaboratorsAll().forEach(u=>pendingMandatoryForUser(u).forEach(t=>{
    rows.push([u.name,u.sector||'',u.cargo||'',t.title||'',trailPct(u.id,t),t.deadline?fdate(t.deadline):'']);
  }));
  if(rows.length===1)rows.push(['Nenhuma pendência','','','','','']);
  downloadXlsx('obrigatorias-pendentes.xlsx',[{name:'Pendentes',rows}]);
}
function relConsolidado(){
  const st=dashboardStats();
  const resumo=[['Indicador','Valor'],
    ['Mês de referência',st.mes],
    ['Total de colaboradores',st.totalColabs],
    ['Colaboradores treinados',st.treinados],
    ['Horas treinadas no mês',st.horasMes],
    ['Eventos no mês',st.eventosRealizados],
    ['Taxa de presença (%)',st.taxaPresenca==null?'—':st.taxaPresenca],
    ['Taxa de conclusão de trilhas (%)',st.taxaConclusao],
    ['Obrigatórias pendentes',st.obrigatoriasPendentes],
    ['Certificados no mês',st.certificadosMes],
    ['Nunca acessaram',st.semAcesso]];
  const trilhas=[['Colaborador','Setor','Cargo','Trilha','Obrigatória','Progresso (%)','Status']];
  collaboratorsAll().forEach(u=>trailsForUser(u).forEach(t=>{const pct=trailPct(u.id,t);trilhas.push([u.name,u.sector||'',u.cargo||'',t.title||'',t.mandatory?'Sim':'Não',pct,pct===100?'Concluída':pct>0?'Em andamento':'Não iniciada']);}));
  const eventos=[['Evento','Data','Colaborador','Status','Confirmado por']];
  eventsAll().forEach(e=>(e.participants||[]).forEach(p=>{const u=userById(p.userId);if(u)eventos.push([e.title||'',fdate(e.date),u.name,(EV_STATUS[p.status]||{}).label||p.status,p.confirmedBy?(userById(p.confirmedBy)||{}).name||'':'']);}));
  const certs=[['Colaborador','Trilha','Carga (min)','Código','Emissão']];
  db.certificates.forEach(c=>certs.push([c.userName||'',c.trailTitle||'',c.durationMin||0,c.code||'',fdate(c.issuedAt)]));
  const horas=[['Colaborador','Setor','Horas','Último acesso']];
  collaboratorsAll().forEach(u=>{const la=lastAccessOf(u.id);horas.push([u.name,u.sector||'',trainingHoursOf(u.id),la?fdate(la):'Nunca']);});
  downloadXlsx('relatorio-universidade-raguife.xlsx',[
    {name:'Resumo',rows:resumo},{name:'Trilhas',rows:trilhas},{name:'Eventos',rows:eventos},{name:'Certificados',rows:certs},{name:'Horas',rows:horas}]);
}

/* ===================== HISTÓRICO DE APRENDIZAGEM ===================== */
let rhHistQuery='';
SCREENS['rh-historico']=(host)=>{
  let list=collaboratorsAll();
  if(rhHistQuery){const q=rhHistQuery.toLowerCase();list=list.filter(u=>(u.name||'').toLowerCase().includes(q)||(u.sector||'').toLowerCase().includes(q));}
  const search=collaboratorsAll().length?`<div class="search-bar">${ic('search',16)}<input id="rhHistSearch" placeholder="Buscar colaborador..." value="${esc(rhHistQuery)}" oninput="rhHistQuery=this.value;go('rh-historico');setTimeout(()=>{var e=document.getElementById('rhHistSearch');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}},0)"></div>`:'';
  host.innerHTML=pageHead('Histórico de aprendizagem','Visão consolidada por colaborador.',`<button class="btn btn-ghost btn-sm" onclick="go('rh-usuarios')">${ic('team',14)} Usuários</button>`)+search+
    (list.length?`<div class="hist-list">${list.map(u=>{
      const h=learningHistory(u.id);
      return `<div class="hist-card" onclick="rhOpenHistory('${u.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')rhOpenHistory('${u.id}')">
        <div class="hist-head"><span class="td-av">${esc((u.name[0]||'?').toUpperCase())}</span>
          <div class="hist-id"><b>${esc(u.name)}</b><span class="muted">${esc(u.sector||'—')}${u.cargo?' · '+esc(u.cargo):''}</span></div>
          <div class="hist-pct"><b>${h.percentualGeral}%</b><span>geral</span></div>
        </div>
        <div class="hist-mini">
          <span>${ic('check',12)} ${h.concluidas.length} concluídas</span>
          <span>${ic('certificate',12)} ${h.certificados.length} cert.</span>
          <span>${ic('calendar',12)} ${h.eventos.filter(x=>x.part.status==='presente').length} eventos</span>
          <span>${ic('clock',12)} ${h.horas}h</span>
          ${h.pendentesObrigatorias.length?`<span class="hist-pend">${ic('warn',12)} ${h.pendentesObrigatorias.length} pendente(s)</span>`:''}
        </div>
      </div>`;
    }).join('')}</div>`:emptyBox('team','Nenhum colaborador','Cadastre colaboradores para ver o histórico.',''));
};
function rhOpenHistory(userId){
  const h=learningHistory(userId);if(!h)return;
  const u=h.user;
  activeScreen='rh-historico';
  const host=document.getElementById('screenHost');
  host.innerHTML=pageHead(esc(u.name),`${esc(u.sector||'—')}${u.cargo?' · '+esc(u.cargo):''}`,`<button class="btn btn-ghost btn-sm" onclick="go('rh-historico')">${ic('prev',14)} Voltar</button>`)+`
    <div class="dash-grid">
      <div class="dash-card"><div class="dash-ic">${ic('chart',18)}</div><b>${h.percentualGeral}%</b><span>Conclusão geral</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('check',18)}</div><b>${h.concluidas.length}</b><span>Trilhas concluídas</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('trail',18)}</div><b>${h.andamento.length}</b><span>Em andamento</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('certificate',18)}</div><b>${h.certificados.length}</b><span>Certificados</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('calendar',18)}</div><b>${h.eventos.filter(x=>x.part.status==='presente').length}</b><span>Eventos presentes</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('clock',18)}</div><b>${h.horas}h</b><span>Horas de treinamento</span></div>
      <div class="dash-card"><div class="dash-ic">${ic('user',18)}</div><b style="font-size:15px;">${h.ultimoAcesso?fdate(h.ultimoAcesso):'Nunca'}</b><span>Último acesso</span></div>
      <div class="dash-card ${h.pendentesObrigatorias.length?'dash-warn':''}"><div class="dash-ic">${ic('warn',18)}</div><b>${h.pendentesObrigatorias.length}</b><span>Obrigatórias pendentes</span></div>
    </div>
    ${h.pendentesObrigatorias.length?`<div class="home-section"><div class="sec-head"><h2>Treinamentos obrigatórios pendentes</h2></div>
      <div class="alert-list">${h.pendentesObrigatorias.map(t=>`<div class="alert-row">${ic('warn',16)}<div><b>${esc(t.title)}</b><span class="muted" style="display:block;font-size:12px;">${trailPct(u.id,t)}% concluído${t.deadline?' · prazo '+fdate(t.deadline):''}</span></div></div>`).join('')}</div></div>`:''}
    <div class="home-section"><div class="sec-head"><h2>Trilhas</h2></div>
      ${(h.concluidas.length||h.andamento.length)?`<div class="ind-list">
        ${h.concluidas.map(t=>`<div class="ind-row"><div class="ind-name">${esc(t.title)} <span class="ev-status st-pres" style="margin-left:6px;">Concluída</span></div><div class="rp-bar"><span style="width:100%"></span></div><div class="ind-pct">100%</div></div>`).join('')}
        ${h.andamento.map(x=>`<div class="ind-row"><div class="ind-name">${esc(x.t.title)}</div><div class="rp-bar"><span style="width:${x.pct}%"></span></div><div class="ind-pct">${x.pct}%</div></div>`).join('')}
      </div>`:'<p class="muted" style="font-size:14px;">Nenhuma trilha iniciada.</p>'}
    </div>
    ${h.eventos.length?`<div class="home-section"><div class="sec-head"><h2>Eventos</h2></div>
      <div class="part-list">${h.eventos.map(x=>{const st=EV_STATUS[x.part.status]||EV_STATUS.inscrito;return `<div class="part-row"><div class="part-info"><span class="td-av">${ic('calendar',14)}</span><div><b>${esc(x.event.title)}</b><span class="muted">${fdate(x.event.date)}${x.event.hours?' · '+x.event.hours+'h':''}</span></div></div><span class="ev-status ${st.cls}">${st.label}</span></div>`;}).join('')}</div></div>`:''}
    ${h.certificados.length?`<div class="home-section"><div class="sec-head"><h2>Certificados</h2></div>
      <div class="cert-grid">${h.certificados.map(c=>`<div class="cert-mini"><div class="cert-mini-ic">${ic('certificate',18)}</div><div><b>${esc(c.trailTitle)}</b><span class="muted">${fdate(c.issuedAt)} · ${c.code}</span></div></div>`).join('')}</div></div>`:''}
  `;
}

/* ===================== TRILHAS POR CARGO ===================== */
function rhCargoTrails(){
  const cargos=cargosAll();
  openModal(`
    <h3>Trilhas obrigatórias por cargo</h3>
    <p style="color:var(--gray-600);font-size:14px;margin-bottom:14px;">Vincule trilhas que serão obrigatórias para todos os colaboradores de um cargo.</p>
    ${cargos.length?`<div class="fld"><label>Cargo</label><select class="inp" id="ctCargo" onchange="rhCargoTrailsRender()">
      ${cargos.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
    </select></div>
    <div id="ctTrails"></div>`:'<p class="muted">Cadastre colaboradores com cargo primeiro.</p>'}
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Fechar</button>
      ${cargos.length?`<button class="btn btn-primary btn-sm" onclick="rhCargoTrailsSave()">Salvar vínculos</button>`:''}
    </div>`);
  if(cargos.length)rhCargoTrailsRender();
}
function rhCargoTrailsRender(){
  const cargo=val('ctCargo');
  const linked=cargoTrailsGet(cargo);
  const box=document.getElementById('ctTrails');
  const pubs=trailsAll();
  box.innerHTML=`<div class="fld"><label>Trilhas obrigatórias para "${esc(cargo)}"</label>
    ${pubs.length?`<div class="chk-list">${pubs.map(t=>`<label class="chk"><input type="checkbox" value="${t.id}" ${linked.includes(t.id)?'checked':''}> ${esc(t.title||'Sem título')} ${t.status!=='published'?'<span class="muted">(rascunho)</span>':''}</label>`).join('')}</div>`:'<p class="muted" style="font-size:13px;">Nenhuma trilha criada.</p>'}
  </div>`;
}
function rhCargoTrailsSave(){
  const cargo=val('ctCargo');
  const ids=[...document.querySelectorAll('#ctTrails input[type=checkbox]:checked')].map(c=>c.value);
  cargoTrailsSet(cargo,ids);closeModal();toast('Vínculos salvos');go('rh-usuarios');
}

SCREENS['rh-ajustes']=(host)=>{
  const nUsers=usersAll().length,nTrails=trailsAll().length,nCerts=db.certificates.length;
  host.innerHTML=pageHead('Ajustes','Backup dos dados e informações do sistema.')+`
    <div class="callout callout-warn" style="margin-bottom:20px;">${ic('info',18)}<div>
      <b>Os dados ficam só neste navegador.</b> Se você abrir o sistema em outro computador, outro navegador ou numa aba anônima, os dados não estarão lá. Use o backup abaixo para levar tudo de um lugar para outro.
    </div></div>

    <div class="settings-card">
      <div class="set-row">
        <div><h3>Backup completo</h3><p>Baixe um arquivo com tudo: usuários, trilhas, progresso, eventos e certificados.</p></div>
        <button class="btn btn-primary btn-sm" onclick="rhExportBackup()">${ic('download',15)} Exportar backup</button>
      </div>
      <div class="set-row">
        <div><h3>Restaurar backup</h3><p>Importe um arquivo de backup. <b>Substitui</b> todos os dados atuais.</p></div>
        <button class="btn btn-ghost btn-sm" onclick="rhImportBackup()">${ic('upload',15)} Importar backup</button>
      </div>
      <div class="set-row set-stats">
        <div class="set-stat"><b>${nUsers}</b><span>usuários</span></div>
        <div class="set-stat"><b>${nTrails}</b><span>trilhas</span></div>
        <div class="set-stat"><b>${nCerts}</b><span>certificados</span></div>
      </div>
    </div>

    <div class="settings-card" style="margin-top:16px;border-color:#f3d6d3;">
      <div class="set-row">
        <div><h3 style="color:#c4564b;">Apagar tudo</h3><p>Remove todos os dados deste navegador e recomeça do zero.</p></div>
        <button class="btn btn-danger btn-sm" onclick="rhResetAll()">${ic('trash',15)} Apagar tudo</button>
      </div>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:16px;" onclick="logout()">${ic('logout',16)} Sair da conta</button>`;
};
function rhExportBackup(){
  const data=exportBackup();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='backup-universidade-raguife-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast('Backup exportado');
}
function rhImportBackup(){
  const inp=document.getElementById('filePick');
  inp.accept='application/json,.json';
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const payload=JSON.parse(ev.target.result);
        confirmModal('Restaurar backup','Isto substitui TODOS os dados atuais. Deseja continuar?',()=>{
          try{importBackup(payload);currentUser=null;session=null;toast('Backup restaurado');goLogin();}
          catch(err){toast('Backup inválido',true);}
        },{danger:true,confirmLabel:'Restaurar'});
      }catch(err){toast('Arquivo JSON inválido',true);}
    };
    r.readAsText(f);inp.value='';
  };
  inp.click();
}
function rhResetAll(){
  confirmModal('Apagar tudo','Todos os usuários, trilhas, progresso e certificados deste navegador serão removidos. Esta ação não pode ser desfeita.',()=>{
    try{localStorage.removeItem(DB_KEY);localStorage.removeItem(SESSION_KEY);}catch(e){}
    db={users:[],trails:[],progressByUser:{},events:[],certificates:[]};
    currentUser=null;session=null;toast('Tudo apagado');goLogin();
  },{danger:true,confirmLabel:'Apagar tudo'});
}

/* ============================================================
   PONTE: tela de Aprendizagem (módulo de trilha existente)
============================================================ */
function enterLearningShell(){
  // troca o conteúdo do host pela estrutura que o módulo de trilha espera
  activeScreen='learning';
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('[data-tab]').forEach(el=>el.classList.remove('active'));
  const host=document.getElementById('screenHost');
  host.innerHTML=`
    <div class="learning-bar">
      <button class="btn btn-ghost btn-sm" onclick="exitLearning()">${ic('prev',15)} Voltar</button>
      <div class="mode-toggle" id="modeToggleWrap" style="${currentUser.role==='rh'?'':'display:none'}">
        <button id="modeStudent" class="on" onclick="setMode('student')">Aluno</button>
        <button id="modeEditor" onclick="setMode('editor')">Editar</button>
      </div>
      <div class="tb-progress" id="tbProgress"></div>
    </div>
    <div class="trail-stage">
      <div class="col-main" id="colMain"></div>
      <aside class="col-rail" id="colRail"></aside>
    </div>`;
  // o tbTrail do módulo aponta para um elemento que pode não existir aqui:
  if(!document.getElementById('tbTrail')){
    const span=document.createElement('span');span.id='tbTrail';span.style.display='none';
    document.body.appendChild(span);
  }
  render(); // do módulo de trilha (view.js)
}
function openTrailAsStudent(trailId){
  const t=trailById(trailId);if(!t)return;
  trail=JSON.parse(JSON.stringify(t));
  currentTrailId=trailId;
  progress=progressGet(currentUser.id,trailId);
  // retomar: vai para o primeiro módulo ainda não concluído
  let idx=trail.modules.findIndex(m=>!(progress.done||[]).includes(m.id));
  if(idx<0)idx=0; // tudo concluído → começa do início (revisão)
  currentIdx=idx;mode='student';lessonTab='conteudo';quizState={answers:{},submitted:false};
  enterLearningShell();
  setMode('student');
  if(idx>0)toast('Retomando de onde você parou');
}
function exitLearning(){
  // volta para a tela apropriada do perfil
  const back = currentUser.role==='rh' ? 'rh-trilhas' : 'trilhas';
  buildSidebar();go(back);
}
function openCertFromStore(trailId){
  const t=trailById(trailId);if(!t)return;
  trail=JSON.parse(JSON.stringify(t));
  currentTrailId=trailId;
  progress=progressGet(currentUser.id,trailId);
  openCertificate();
}

/* utilitário de formulário */
function val(id){const el=document.getElementById(id);return el?el.value:'';}
