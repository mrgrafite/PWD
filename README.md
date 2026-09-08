# PWD — Sistema de Gestão de Passageiros (template)

Front-end em React + Vite + TypeScript, portando as seis telas do mockup
"PWD Passageiro" (Artifact) e do documento `DPS-PWD-Módulo de Passageiros`
para componentes reais. **Escopo desta primeira versão: só front-end, com
dados mockados em memória (`src/data/mock.ts`)** — sem backend, sem
persistência real, sem integrações ativas com SPax ou Suri.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5183` (porta fixada em `vite.config.ts`).

## Estrutura

```
src/
  types/index.ts        modelo de dados (Passageiro, Reserva Vinculada, Cliente/Funil, etc.)
  data/mock.ts           dados fixos em memória — mesmos nomes/casos do mockup original
  components/AppFrame.tsx  layout (sidebar + conteúdo)
  screens/
    PassageirosLista.tsx      lista de passageiros (ponto de entrada)
    CadastroPassageiro.tsx    Tela 1 — Cadastro do Passageiro (abas + autopreenchimento por CEP via ViaCEP)
    ReservaVinculada.tsx      Tela 2 — Detalhe da Reserva Vinculada + alerta de repasse tarifário
    FunilVendas.tsx           Tela 3 — Funil de Vendas (Kanban)
    AgendaEmbarque.tsx        Tela 4 — Agenda de Embarque, visão Calendário com seletor de período
    ConfiguracoesIntegracoes.tsx  Tela 5 — Configurações · Integrações (SPax nativa + Suri)
    ConversaCliente.tsx       Tela 6 — Conversa do Cliente (via Suri), drill-down do Funil
```

As rotas em `App.tsx` espelham o menu lateral (Passageiros / Vendas / Agenda /
Configurações). A conversa do cliente é acessada a partir de um card do Funil
(`/vendas/:id/conversa`), não do menu — mesma decisão tomada no mockup.

## O que falta para virar produto de verdade

Ver `PWD - Notas do Projeto.md` (pasta acima) e o DPS para o detalhe completo.
Resumo do que este template ainda não faz:

- **Backend/API própria do PWD** — hoje os dados vêm só de `src/data/mock.ts`.
- **Integração PWD × SPax** (pull, reconsulta a cada 1h, chave/token de
  serviço) — a Tela 2 hoje mostra dados fixos, não uma reserva real.
- **Integração PWD × Suri** (API de envio + webhook de eventos) — a Tela 5
  e a Tela 6 são só a interface; não há endpoint de webhook nem chamada real
  à API da Suri.
- Persistência real (banco de dados) do modelo em `src/types/index.ts`.
- Autenticação e perfis de acesso (ver seção "Permissões e Perfis" do DPS —
  ainda não formalizados).

## Referência de design

Tokens de cor/tipografia em `src/index.css` (IBM Plex Sans/Mono, verde-azulado
`--accent-pwd` como cor primária, laranja `--accent-spax` reservado para
destaques ligados ao SPax). Ajuste esses tokens se a identidade visual mudar.
