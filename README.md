# Universidade Raguife — LMS Corporativo

Plataforma de aprendizagem corporativa (trilhas, modulos, quiz, certificados,
onboarding, eventos presenciais, dashboard RH, historico e relatorios).
HTML/CSS/JavaScript puro. Roda em **GitHub Pages + Firebase** (producao) ou em
**modo demo local** (contingencia, sem configuracao).

---

## Comece em 4 passos

### 1. Preencher as chaves do Firebase
Abra **src/js/firebase-config.js** e cole os valores do seu projeto Firebase
(passo a passo completo em **FIREBASE-SETUP.md**).

### 2. Subir no GitHub
Crie um repositorio e suba **todos os arquivos desta pasta** (mantendo a estrutura),
com o index.html na raiz do repositorio.

### 3. Ativar GitHub Pages
No repositorio: **Settings -> Pages -> Source: Deploy from a branch ->
branch main / pasta / (root) -> Save**.

### 4. Testar o MVP
Acesse https://SEU-USUARIO.github.io/SEU-REPOSITORIO/ e siga o
**checklist de teste real** no fim do FIREBASE-SETUP.md.
Login inicial do RH: **rh@raguife.com.br / R@guife123**.

---

## O que tem no pacote

```
index.html                  <- arquivo principal (GitHub Pages carrega este)
FIREBASE-SETUP.md           <- guia completo de configuracao + checklist de teste
firestore.rules             <- regras de seguranca do Firestore (colar no console)
storage.rules               <- regras de seguranca do Storage (colar no console)
README.md                   <- este arquivo
src/
  css/
    styles.css
    system.css
  js/
    firebase-config.js      <- *** COLE AQUI AS CHAVES DO FIREBASE ***
    firebase-sync.js        <- camada Auth + Firestore + Storage + sync
    logo.js  data.js  view.js  editor.js  store.js
    xlsx.js  app.js  screens_colab.js  screens_rh.js  bridge.js
```

## Modo demo (contingencia)
Sem preencher as chaves, o sistema roda 100% local (dados no navegador).
Util para demonstracao. Tambem existe uma versao de arquivo unico
(Universidade-Raguife-DEMO.html) que abre por duplo-clique, sem servidor.

## Requisitos
Nenhuma instalacao. Sem Node, sem backend, sem terminal.
Apenas um navegador e (para producao) uma conta Firebase gratuita + GitHub Pages.
