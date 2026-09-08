import { useState } from "react";
import { eventosSuri } from "../data/mock";

const ROTULO_EVENTO: Record<string, string> = {
  novo_contato: "Novo contato",
  troca_de_fila: "Troca de fila",
  finalizacao_atendimento: "Finalização de atendimento",
  mensagem_recebida: "Mensagem recebida",
};

const DESCRICAO_EVENTO: Record<string, string> = {
  novo_contato: "Cria um Lead no funil de vendas.",
  troca_de_fila: "Move o card do funil — regra de mapeamento fila↔estágio ainda não definida.",
  finalizacao_atendimento: "Registra uma nota no histórico do Cliente/negociação.",
  mensagem_recebida: "Atualiza o histórico de conversa vinculado ao Cliente — fonte de dados do chat nativo (Tela 6).",
};

// Tela 5 — Configurações · Integrações. SPax é nativa (sempre ativa, sem
// configuração); Suri é de terceiros (token, webhook e eventos assinados).
export default function ConfiguracoesIntegracoes() {
  const [eventosAtivos, setEventosAtivos] = useState<Record<string, boolean>>({
    novo_contato: true,
    troca_de_fila: false,
    finalizacao_atendimento: true,
    mensagem_recebida: false,
  });

  function alternar(chave: string) {
    setEventosAtivos((s) => ({ ...s, [chave]: !s[chave] }));
  }

  return (
    <>
      <div className="topbar-crumbs">Configurações / Integrações</div>
      <div className="page-head">
        <div>
          <h1>Integrações</h1>
          <div className="subtitle">Tela 5</div>
        </div>
      </div>

      <div className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>SPax</h2>
          <span className="pill on">Sempre ativo</span>
        </div>
        <p style={{ color: "var(--ink-soft)", fontSize: 12.5, marginTop: 8 }}>
          Reconsulta automática a cada 1 hora · não requer configuração.
        </p>
      </div>

      <div className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Suri</h2>
          <span className="pill on">Conectado</span>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <div className="field">
            <label>Token de API</label>
            <input readOnly value="sk_live_••••••••••••3f2a" />
            <span className="hint">Alterar token</span>
          </div>
          <div className="field">
            <label>URL do webhook (cole no Portal Suri)</label>
            <input readOnly value="https://pwd.seudominio.com.br/api/webhooks/suri" />
            <span className="hint">A Suri valida com um handshake (GET) antes de começar a enviar eventos.</span>
          </div>
        </div>

        <h2 style={{ marginTop: 22, fontSize: 14 }}>Eventos assinados</h2>
        {Object.keys(ROTULO_EVENTO).map((chave) => (
          <label
            key={chave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={eventosAtivos[chave]}
              onChange={() => alternar(chave)}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{ROTULO_EVENTO[chave]}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{DESCRICAO_EVENTO[chave]}</div>
            </div>
          </label>
        ))}

        <h2 style={{ marginTop: 22, fontSize: 14 }}>Últimos eventos recebidos</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Recebido em</th>
              <th>Tipo</th>
              <th>Resumo</th>
            </tr>
          </thead>
          <tbody>
            {eventosSuri.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.recebidoEm}</td>
                <td>{ROTULO_EVENTO[ev.tipo]}</td>
                <td>{ev.resumo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn">Testar conexão</button>
          <button className="btn ghost">Desconectar</button>
        </div>
      </div>
    </>
  );
}
