/* ============================================================
   bridge.js — integra o módulo de trilha (data/view/editor) ao
   sistema (store/app/screens). Sobrescreve persistência para usar
   o store por-usuário, e fornece modal + boot.
============================================================ */

/* ---- modal genérico ---- */
function openModal(html){
  let back=document.getElementById('modalBack');
  back.querySelector('.modal-box').innerHTML=html;
  back.classList.add('open');
}
function closeModal(){document.getElementById('modalBack').classList.remove('open');}

/* confirmação estilizada (substitui o confirm() nativo) */
let _confirmCb=null;
function confirmModal(title,message,onYes,opts){
  opts=opts||{};
  _confirmCb=onYes;
  openModal(`
    <h3>${esc(title)}</h3>
    <p style="color:var(--gray-600);font-size:14px;margin-bottom:4px;">${esc(message)}</p>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn ${opts.danger?'btn-danger':'btn-primary'} btn-sm" onclick="_confirmYes()">${esc(opts.confirmLabel||'Confirmar')}</button>
    </div>`);
}
function _confirmYes(){const cb=_confirmCb;_confirmCb=null;closeModal();if(cb)cb();}

/* ---- sobrescreve save() do módulo de trilha ----
   No editor (RH): grava a trilha no store.
   No aluno: grava o progresso do usuário e emite certificado a 100%. */
function save(){
  try{
    if(mode==='editor'){
      const clone=JSON.parse(JSON.stringify(trail));
      clone.modules.forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}});
      trailUpsert(clone);
      currentTrailId=clone.id;
    }
    if(currentUser&&currentTrailId){
      progressSet(currentUser.id,currentTrailId,progress);
      // certificado automático a 100%
      const t=trailById(currentTrailId);
      if(t&&t.modules.length){
        const done=(progress.done||[]).filter(id=>t.modules.some(m=>m.id===id)).length;
        if(done>=t.modules.length && (!t.certificate || t.certificate.enabled!==false)){certIssue(currentUser.id,currentTrailId);}
      }
    }
  }catch(e){console.warn('save bridge',e);}
}

/* ---- sobrescreve saveTrail() do editor: salva no store e volta ---- */
function saveTrail(){
  if(!trail.title.trim()){toast('Dê um título à trilha',true);return;}
  const btn=document.querySelector('.editor-foot .btn-primary');
  if(btn){btn.disabled=true;btn.dataset._html=btn.innerHTML;btn.innerHTML='Salvando...';}
  // pequena pausa para o usuário perceber o estado (a gravação é instantânea)
  setTimeout(()=>{
    const clone=JSON.parse(JSON.stringify(trail));
    clone.modules.forEach(m=>{if(m.contentType==='mp4'&&m.mp4Blob){m.src='';m.mp4Missing=true;}});
    trailUpsert(clone);
    _trailDirty=false;
    if(btn){btn.innerHTML=ic('check',15)+' Salvo';}
    setTimeout(()=>{
      toast('Trilha salva');
      closeEditor();
      buildSidebar();
      go('rh-trilhas');
      if(btn){btn.disabled=false;btn.innerHTML=btn.dataset._html||'Salvar trilha';}
    },450);
  },250);
}

/* ---- nome do certificado = usuário logado ---- */
function getLearnerName(){return currentUser?currentUser.name:'';}
function setLearnerName(v){if(currentUser){userUpdate(currentUser.id,{name:v});currentUser.name=v;}}

/* ---- boot do sistema ---- */
window.addEventListener('DOMContentLoaded',boot);
