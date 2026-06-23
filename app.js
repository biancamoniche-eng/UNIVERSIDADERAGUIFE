/* ============================================================
   app.js — shell do sistema, navegação e roteador de telas.
   Reproduz o protótipo: Login → telas de colaborador e RH.
============================================================ */

/* navegação por perfil (igual ao protótipo) */
const NAV_COLAB=[
  {id:'home',label:'Início',icon:'home'},
  {id:'trilhas',label:'Trilhas',icon:'trail'},
  {id:'eventos',label:'Eventos',icon:'calendar'},
  {id:'conquistas',label:'Conquistas',icon:'trophy'},
  {id:'perfil',label:'Perfil',icon:'user'},
];
const NAV_RH=[
  {id:'rh-dashboard',label:'Dashboard',icon:'chart'},
  {id:'rh-trilhas',label:'Trilhas',icon:'trail'},
  {id:'rh-usuarios',label:'Usuários',icon:'team'},
  {id:'rh-eventos',label:'Eventos',icon:'calendar'},
  {id:'rh-relatorios',label:'Relatórios',icon:'download'},
  {id:'rh-ajustes',label:'Ajustes',icon:'gear'},
];
const NAV_GESTOR=[
  {id:'gestor-equipe',label:'Minha equipe',icon:'team'},
  {id:'gestor-trilhas',label:'Trilhas',icon:'trail'},
  {id:'perfil',label:'Perfil',icon:'user'},
];

let activeScreen='login';

function navFor(){
  if(!currentUser)return [];
  if(currentUser.role==='rh')return NAV_RH;
  if(currentUser.role==='manager')return NAV_GESTOR;
  return NAV_COLAB;
}
function roleLabel(r){return r==='rh'?'RH':r==='manager'?'Gestor':'Colaborador';}

/* ---------- boot ---------- */
function boot(){
  const logoEl=document.getElementById('brandLogo');
  if(logoEl&&window.UNI_LOGO)logoEl.src=window.UNI_LOGO;
  dbLoad();
  // inicia a camada Firebase (produção); se não configurado, segue em modo demo
  if(typeof window.cloudInit==='function'){window.cloudInit();}
  if(session&&session.userId){currentUser=userById(session.userId);}
  if(currentUser){enterApp();}
  else{goLogin();}
}

/* ---------- login ---------- */
function goLogin(){
  activeScreen='login';
  currentUser=null;sessionClear();
  document.getElementById('appShell').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  renderLogin();
}
function renderLogin(){
  const host=document.getElementById('loginBody');
  host.innerHTML=`
    <div class="login-card">
      <div class="login-logo"><img src="${window.UNI_LOGO||''}" alt=""></div>
      <h1>Universidade Raguife</h1>
      <p class="login-sub">Entre com seu e-mail e senha.</p>
      <div class="login-pane">
        <div class="fld"><label>E-mail</label><input class="inp" id="loginEmail" type="email" placeholder="seu.email@raguife.com.br" autocomplete="username" onkeydown="if(event.key==='Enter')doLoginByEmail()"></div>
        <div class="fld"><label>Senha</label><input class="inp" id="loginPass" type="password" placeholder="Sua senha" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLoginByEmail()"></div>
        <button class="btn btn-primary btn-block" onclick="doLoginByEmail()">${ic('logout',16)} Entrar</button>
        <p id="loginErr" class="login-err"></p>
      </div>
    </div>`;
}
async function doLoginByEmail(){
  const email=val('loginEmail'),pass=val('loginPass');
  const err=document.getElementById('loginErr');
  if(err)err.textContent='';
  // PRODUÇÃO: Firebase Auth, se habilitado
  if(window.RAGUIFE_CLOUD&&window.RAGUIFE_CLOUD.enabled){
    if(err)err.textContent='Entrando...';
    try{
      let r=await window.cloudLogin(email,pass);
      // primeiro acesso: usuário existe no cadastro local/Firestore mas ainda não no Auth → cria
      if(!r.ok&&r.error==='E-mail não cadastrado'){
        const localU=userByEmail(email);
        if(localU&&(localU.password||defaultPassword(localU.name))===pass){
          const c=await window.cloudCreateAuthUser(email,pass);
          if(c.ok)r={ok:true,user:c.user};
        }
      }
      if(!r.ok){if(err)err.textContent=r.error||'Não foi possível entrar';return;}
      // garante que a lista de usuários da nuvem foi carregada antes de resolver o perfil
      if(typeof window.cloudPullState==='function'){try{await window.cloudPullState();}catch(e){}}
      // resolve o usuário local correspondente (perfil/role vêm do cadastro)
      const localU=userByEmail(email);
      if(!localU){
        if(err)err.textContent='Usuário autenticado, mas sem cadastro no sistema. Procure o RH.';
        if(window.cloudLogout)window.cloudLogout(); // não permite acesso de não cadastrado
        return;
      }
      currentUser=localU;session={userId:localU.id};sessionSave();
      if(window.cloudLog)window.cloudLog('login',{email});
      enterApp();
      return;
    }catch(e){ if(err)err.textContent='Falha ao entrar. Tente novamente.'; return; }
  }
  // DEMO/local
  const r=authenticate(email,pass);
  if(!r.ok){if(err)err.textContent=r.error;return;}
  currentUser=r.user;session={userId:r.user.id};sessionSave();enterApp();
}
/* chamado pela camada Firebase quando o Auth restaura a sessão automaticamente */
window.cloudResolveSession=function(fbUser){
  if(currentUser)return; // já logado
  const localU=userByEmail(fbUser.email);
  if(localU){currentUser=localU;session={userId:localU.id};sessionSave();
    if(activeScreen==='login')enterApp();}
};
function logout(){ if(window.cloudLogout)window.cloudLogout(); goLogin(); }

/* ---------- shell ---------- */
function enterApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('appShell').style.display='flex';
  if(currentUser&&typeof markAccess==='function')markAccess(currentUser.id);
  buildSidebar();
  const nav=navFor();
  go(nav[0]?nav[0].id:'home');
}
function buildSidebar(){
  const nav=navFor();
  document.getElementById('sidebar').innerHTML=`
    <div class="side-logo"><img src="${window.UNI_LOGO||''}" alt=""><span>Universidade<br>Raguife</span></div>
    <div class="side-role">${roleLabel(currentUser.role)}</div>
    ${nav.map(n=>`<div class="side-link" data-nav="${n.id}" onclick="go('${n.id}')">${ic(n.icon,18)}<span>${n.label}</span></div>`).join('')}
    <div style="flex:1"></div>
    <div class="side-user">
      <span class="su-av">${esc((currentUser.name[0]||'?').toUpperCase())}</span>
      <span class="su-nm">${esc(currentUser.name)}</span>
    </div>
    <div id="cloudBadge" class="cloud-badge cb-demo">Demo (local)</div>
    <div class="side-link side-logout" onclick="logout()">${ic('logout',17)}<span>Sair</span></div>`;
  if(typeof renderCloudBadge==='function'){const cb=document.getElementById('cloudBadge');if(cb)renderCloudBadge(cb);}
  document.getElementById('bottomTabs').innerHTML=nav.map(n=>
    `<div class="bottom-tab" data-tab="${n.id}" onclick="go('${n.id}')">${ic(n.icon,20)}<span>${n.label}</span></div>`).join('');
}

const SCREENS={};   // id -> render function
function go(id){
  activeScreen=id;
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===id));
  document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===id));
  const main=document.getElementById('screenHost');
  const fn=SCREENS[id];
  if(fn){fn(main);}else{main.innerHTML='<div class="empty"><p>Tela não encontrada.</p></div>';}
  window.scrollTo(0,0);
}
