# Universidade Raguife — Configuração Firebase (Produção / Rota B)

Este guia liga o sistema ao **Firebase** (Auth + Firestore + Storage) e o publica no **GitHub Pages**.
Enquanto o Firebase não estiver configurado, o sistema roda em **modo demo** (100% local), sem quebrar nada.

---

## 1. Criar o projeto Firebase

1. Acesse <https://console.firebase.google.com> e clique em **Adicionar projeto**.
2. Nome sugerido: `raguife-lms`. Pode desativar o Google Analytics.
3. No projeto criado, clique no ícone **Web `</>`** para registrar um app web.
   - Apelido: `Universidade Raguife`. **Não** marque "Firebase Hosting" (vamos usar GitHub Pages).
4. O console mostrará um objeto `firebaseConfig` com `apiKey`, `authDomain`, etc.

## 2. Colar as chaves

Abra **`src/js/firebase-config.js`** e cole os valores no `window.FIREBASE_CONFIG`:

```js
window.FIREBASE_CONFIG = {
  apiKey:            "AIza...",
  authDomain:        "raguife-lms.firebaseapp.com",
  projectId:         "raguife-lms",
  storageBucket:     "raguife-lms.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123...:web:abc..."
};
window.FORCE_DEMO_MODE = false;
```

Assim que as chaves forem válidas, o sistema entra em **modo produção** automaticamente
(o selo na barra lateral muda de "Demo (local)" para "Sincronizado").

## 3. Ativar Authentication

1. No console: **Build → Authentication → Get started**.
2. Aba **Sign-in method** → habilite **E-mail/senha**.
3. O RH padrão (`rh@raguife.com.br`) é criado automaticamente no primeiro login:
   o sistema detecta o cadastro local e cria o usuário no Auth com a senha informada.
   - Recomendado: no primeiro acesso use `rh@raguife.com.br` / `R@guife123`.
4. Para colaboradores/gestores, a senha padrão segue a regra do sistema
   (1ª letra do nome + sobrenome, ex.: Carlos Silva → `csilva`). No 1º login o Auth é criado.

## 4. Ativar Firestore

1. **Build → Firestore Database → Create database**.
2. Comece em **modo de produção** e escolha a região (ex.: `southamerica-east1`).
3. Aba **Rules** → cole as regras abaixo (ajuste conforme sua política):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // só usuários autenticados leem/escrevem
    function signedIn() { return request.auth != null; }

    match /configuracoes/{doc} {
      allow read, write: if signedIn();
    }
    match /usuarios/{uid} {
      allow read: if signedIn();
      allow write: if signedIn();
    }
    match /arquivos/{id}    { allow read, write: if signedIn(); }
    match /logs/{id}        { allow read, write: if signedIn(); }
    match /{document=**}    { allow read, write: if signedIn(); }
  }
}
```

> Observação: o estado consolidado do sistema é salvo no documento
> `configuracoes/estado_sistema` (com `version`, `updatedAt`, `updatedBy`).
> As coleções `usuarios`, `arquivos` e `logs` são usadas para auth, metadados e auditoria.

## 5. Ativar Storage

1. **Build → Storage → Get started** (aceite as regras iniciais).
2. Aba **Rules** → use algo como:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;                 // arquivos de aprendizagem são públicos para leitura
      allow write: if request.auth != null; // só autenticado faz upload
    }
  }
}
```

3. Estrutura de pastas criada automaticamente pelos uploads:
   - `videos/` — vídeos MP4 enviados.
   - `pdfs/` — PDFs enviados.
   - `arquivos/` — demais anexos/imagens.

## 6. Autorizar o domínio do GitHub Pages

Em **Authentication → Settings → Authorized domains**, adicione:
- `SEU-USUARIO.github.io`
- (e `localhost` para testes locais com um servidor http).

## 7. Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba a pasta do sistema (com `index.html` na raiz).
2. **Settings → Pages → Source: Deploy from a branch** → branch `main` / pasta `/root`.
3. Acesse `https://SEU-USUARIO.github.io/SEU-REPO/`.

> Importante: Firebase Auth e Storage **não** funcionam abrindo o arquivo por `file://`.
> Em produção, use sempre a URL do GitHub Pages (ou um servidor http local para testes).

---

## Coleções Firestore usadas

| Coleção | Uso |
|---|---|
| `configuracoes/estado_sistema` | Documento-espelho do estado (usuários, trilhas, progresso, eventos, certificados, cargos) com `version`, `updatedAt`, `updatedBy`. |
| `usuarios` | Documento por usuário do Auth (uid, email, role). |
| `arquivos` | Metadados de cada upload (url, tipo, tamanho, trilhaId, moduloId, origem). |
| `logs` | Auditoria de ações (login, sync, etc.). |

As demais entidades do documento de requisitos (trilhas, módulos, conteúdos, progresso,
eventos, participantes, certificados, cargos, cargo_trilhas) vivem **dentro** do estado
consolidado em `configuracoes/estado_sistema`, o que simplifica o sync e o controle de versão.
Para escala maior, a Fase seguinte pode "explodir" essas entidades em coleções dedicadas.

## Estrutura do Firebase Storage

```
gs://SEU-BUCKET/
├── videos/    ← MP4 enviados pelo editor de trilhas
├── pdfs/      ← PDFs enviados
└── arquivos/  ← imagens e anexos diversos
```

## Modo demo x produção

- **Sem config** (ou `FORCE_DEMO_MODE=true`): roda 100% local (localStorage), abre por `file://`,
  ideal para demonstração/contingência. Selo: "Demo (local)".
- **Com config válida**: Firebase vira a base oficial; localStorage atua como cache/fallback
  e o sistema sincroniza ao reconectar. Selo: "Sincronizado / Salvando... / Offline".

## Pendências para a próxima fase

- Explodir o estado consolidado em coleções Firestore dedicadas (trilhas, módulos, conteúdos…)
  para consultas e regras de segurança mais granulares.
- Regras de segurança por papel (RH/gestor/colaborador) no Firestore.
- Resolução de conflito campo-a-campo (hoje o controle é por versão do documento de estado).
- Drag-and-drop visual de módulos/conteúdos e tipos de conteúdo extras (checklist, desafio).
- Importação de participantes de eventos via Excel/CSV.

---

## Regras de segurança (arquivos prontos)

O pacote inclui `firestore.rules` e `storage.rules`. Para aplicar:

**Firestore:** Console → Firestore Database → aba **Rules** → cole o conteúdo de
`firestore.rules` → **Publicar**. Resumo do que elas garantem:
- Banco **não público**: tudo exige usuário autenticado.
- `configuracoes/estado_sistema` (estado do sistema): leitura para autenticados,
  escrita só para **RH e Gestor**.
- `usuarios/{uid}`: cada um cria/lê o próprio doc; RH gerencia todos.
- `logs`: qualquer autenticado registra; só RH lê o histórico.
- Qualquer outro caminho é bloqueado por padrão.

**Storage:** Console → Storage → aba **Rules** → cole o conteúdo de `storage.rules`
→ **Publicar**. Resumo:
- Leitura liberada (necessária para exibir vídeo/PDF embutido).
- Escrita só autenticada, com limite de tamanho (vídeo até 200 MB, PDF/anexo até 25 MB).

> Modelo de permissões do app: **RH** acesso total; **Gestor** acompanha a equipe e
> confirma presença; **Colaborador** acessa apenas os próprios dados (o app filtra por perfil,
> e as regras impedem que um colaborador grave no estado do sistema).

---

## Checklist de teste real do MVP

Depois de configurar e publicar no GitHub Pages, valide nesta ordem:

1. **Login RH** — entre com `rh@raguife.com.br` / `R@guife123`. O selo na lateral deve
   passar de "Demo (local)" para "Conectando..." → "Sincronizado".
2. **Auth real** — no Console → Authentication → Users, confirme que o e-mail do RH apareceu.
3. **Persistência** — crie uma trilha e um colaborador, recarregue a página (F5). Os dados
   continuam lá (vindos do Firestore, não só do cache).
4. **Firestore** — no Console → Firestore, confirme o documento `configuracoes/estado_sistema`
   com os campos `estado`, `version`, `updatedAt`, `updatedBy`.
5. **Multiusuário** — abra o sistema em outro navegador/computador, entre como o colaborador
   criado (e-mail + senha padrão = 1ª letra do nome + sobrenome). Ele deve ver a trilha publicada.
6. **Sincronização** — com os dois logados, crie/edite algo como RH; em segundos o outro
   usuário vê a atualização (toast "Dados atualizados").
7. **Não cadastrado** — tente entrar com um e-mail que não existe no sistema. O acesso deve
   ser **negado** ("e-mail não cadastrado").
8. **Upload** — no editor de trilha, adicione um módulo de PDF e envie um arquivo. Confirme em
   Console → Storage que ele subiu para `pdfs/`. Recarregue e veja o PDF continuar disponível.
9. **Vídeo externo** — adicione um módulo de vídeo do YouTube (não listado) por link; ele deve
   aparecer embutido dentro do sistema.
10. **Evento + presença** — crie um evento, inscreva o colaborador, marque presença como RH.
    Saia e entre como o colaborador: a presença deve constar no histórico dele.
11. **Relatórios** — exporte um relatório XLSX e confira os dados.
12. **Offline/reconexão** — desligue a internet por alguns segundos (selo "Offline"), faça uma
    alteração, religue. Ao reconectar, a alteração deve sincronizar.
13. **Mobile** — repita o login e a navegação principal no celular pela URL do GitHub Pages.
14. **Modo demo** — abra o `Universidade-Raguife-DEMO.html` localmente: deve funcionar sem
    Firebase (contingência), com selo "Demo (local)".
