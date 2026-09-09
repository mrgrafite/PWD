import { useState } from "react";
import { eventosSuri, suriStatus } from "../data/mock";

const ROTULO_EVENTO: Record<string, string> = {
  novo_contato: "Novo contato",
  troca_de_fila: "Troca de fila",
  finalizacao_atendimento: "Finalização de atendimento",
  mensagem_recebida: "Mensagem recebida",
  mensagem_enviada: "Mensagem enviada",
  falha_envio: "Falha no envio",
  mensagem_lida: "Mensagem lida",
  mensagem_entregue: "Mensagem entregue",
};

const DESCRICAO_EVENTO: Record<string, string> = {
  novo_contato: "Cria um Lead no funil de vendas (associa por telefone a um Cliente existente, se houver).",
  troca_de_fila: "Move o card para o estágio correspondente do funil — regra de mapeamento ainda não definida.",
  finalizacao_atendimento: "Registra uma nota no histórico do Cliente/negociação.",
  mensagem_recebida: "Atualiza o histórico de conversa do Cliente — fonte de dados do chat nativo (Tela 6).",
  mensagem_enviada: "Confirma que uma mensagem enviada pelo PWD chegou na Suri (auditoria).",
  falha_envio: "Alerta quando uma mensagem enviada pelo PWD falha na entrega via Suri.",
  mensagem_lida: "Confirma que o cliente leu a mensagem (recibo de leitura do WhatsApp).",
  mensagem_entregue: "Confirma que a mensagem chegou no WhatsApp do cliente (antes da leitura).",
};

// Backend próprio do PWD (guarda o token da Suri no servidor — nunca no
// front-end). Em dev local roda em server/ (porta 3001); em homologação/
// produção precisa apontar pro backend implantado, via VITE_PWD_SERVER_URL.
const PWD_SERVER_URL = import.meta.env.VITE_PWD_SERVER_URL ?? "http://localhost:3001";

// URL real do webhook receptor (server/src/index.ts) — nunca hardcode um
// domínio fixo aqui, tem que refletir o backend de verdade configurado
// acima, senão o que aparece pra colar no Portal Suri não bate com o que
// está implantado.
const URL_WEBHOOK = `${PWD_SERVER_URL}/api/webhooks/suri`;

interface TesteConexao {
  status: "idle" | "carregando" | "ok" | "erro";
  mensagem?: string;
}

// Tela 5 — Configurações · Integrações. SPax é nativa (sempre ativa, sem
// configuração); Suri é de terceiros (credenciais, webhook e eventos
// assinados).
export default function ConfiguracoesIntegracoes() {
  const [eventosAtivos, setEventosAtivos] = useState<Record<string, boolean>>({
    novo_contato: true,
    troca_de_fila: true,
    finalizacao_atendimento: true,
    mensagem_recebida: true,
    mensagem_enviada: true,
    falha_envio: true,
    mensagem_lida: true,
    mensagem_entregue: true,
  });
  const [copiado, setCopiado] = useState(false);
  const [teste, setTeste] = useState<TesteConexao>({ status: "idle" });

  function alternar(chave: string) {
    setEventosAtivos((s) => ({ ...s, [chave]: !s[chave] }));
  }

  async function testarConexao() {
    setTeste({ status: "carregando" });
    try {
      const resp = await fetch(`${PWD_SERVER_URL}/api/suri/status`);
      const data = await resp.json();
      if (!resp.ok || !data.conectado) {
        setTeste({ status: "erro", mensagem: data.erro ?? `Backend respondeu ${resp.status}` });
        return;
      }
      setTeste({ status: "ok", mensagem: `${data.nome} · ${data.status} · ambiente ${data.ambiente}` });
    } catch {
      setTeste({ status: "erro", mensagem: `Não foi possível alcançar o backend do PWD em ${PWD_SERVER_URL}` });
    }
  }

  async function copiarWebhook() {
    try {
      await navigator.clipboard.writeText(URL_WEBHOOK);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) — sem efeito visível
    }
  }

  return (
    <>
      <div className="topbar-crumbs">Configurações / Integrações</div>
      <div className="page-head">
        <div>
          <h1>Integrações</h1>
          <div className="subtitle">Ferramentas externas conectadas ao PWD via API e webhooks</div>
        </div>
      </div>

      <div className="section">
        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".03em", color: "var(--ink-faint)" }}>
          Integração nativa
        </h2>
        <div className="integration-card">
          <div className="integration-head">
            <span className="integration-logo spax">SP</span>
            <div className="txt">
              <div className="name">SPax — Emissão de bilhetes</div>
              <div className="desc">Reconsulta automática a cada 1 hora · não requer configuração</div>
            </div>
            <span className="pill on">Sempre ativo</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".03em", color: "var(--ink-faint)" }}>
          Ferramentas de terceiros
        </h2>
        <div className="integration-card">
          <div className="integration-head">
            <span className="integration-logo">SU</span>
            <div className="txt">
              <div className="name">Suri — Atendimento via WhatsApp</div>
              <div className="desc">
                Conectado desde {suriStatus.conectadoDesde} · último evento recebido {suriStatus.ultimoEventoEm}
              </div>
            </div>
            <span className="pill on">Conectado</span>
          </div>

          <div className="integration-body">
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 14, marginBottom: 12 }}>Credenciais</h2>
              <div className="form-grid">
                <div className="field span-2">
                  <label>Token de API (Suri)</label>
                  <input className="mono" value="sk_live_••••••••••••3f2a" disabled />
                </div>
                <div className="field span-2">
                  <label>Conectado desde</label>
                  <input value={suriStatus.conectadoDesde} disabled />
                </div>
              </div>
              <span className="add-link" style={{ marginTop: 8 }}>Alterar token</span>
            </div>

            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 14, marginBottom: 4 }}>URL do webhook</h2>
              <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 10 }}>
                Cole no Portal Suri → Configurações → Geral → Webhook
              </p>
              <div className="copy-field">
                <input className="mono" value={URL_WEBHOOK} disabled />
                <button className="btn ghost" onClick={copiarWebhook} type="button">
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <span className="hint">
                A Suri valida esta URL com um handshake (GET esperando 200 + identificador do chatbot) antes de começar a enviar eventos.
              </span>
            </div>

            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 14, marginBottom: 4 }}>Eventos assinados</h2>
              {Object.keys(ROTULO_EVENTO).map((chave) => (
                <div className="switch-row" key={chave}>
                  <div className="txt">
                    <div className="name">{ROTULO_EVENTO[chave]}</div>
                    <div className="desc">{DESCRICAO_EVENTO[chave]}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={eventosAtivos[chave]}
                    className={`switch ${eventosAtivos[chave] ? "on" : ""}`}
                    onClick={() => alternar(chave)}
                  >
                    <span className="knob" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <h2 style={{ fontSize: 14, marginBottom: 12 }}>Últimos eventos recebidos</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recebido em</th>
                    <th>Evento</th>
                    <th>Contato</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosSuri.map((ev) => (
                    <tr key={ev.id}>
                      <td className="mono">{ev.recebidoEm}</td>
                      <td>{ROTULO_EVENTO[ev.tipo]}</td>
                      <td>{ev.contato}</td>
                      <td>
                        <span className={`res-badge ${ev.resultadoTipo}`}>{ev.resultado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn ghost" onClick={testarConexao} disabled={teste.status === "carregando"}>
                {teste.status === "carregando" ? "Testando..." : "Testar conexão"}
              </button>
              <button className="btn danger-outline">Desconectar</button>
              {teste.status === "ok" && (
                <span style={{ fontSize: 12, color: "var(--good)" }}>✓ Conectado — {teste.mensagem}</span>
              )}
              {teste.status === "erro" && (
                <span style={{ fontSize: 12, color: "var(--bad)" }}>✗ {teste.mensagem}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
