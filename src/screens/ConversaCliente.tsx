import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { chatsPorNegocio, funil } from "../data/mock";
import type { MensagemChat } from "../types";

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

// Tela 6 — Conversa do Cliente (via Suri). Chat nativo do PWD, aberto como
// drill-down a partir de um card do funil (Tela 3) — não do menu
// Configurações. Mensagens saem/entram via API/webhook da Suri; o
// atendente nunca precisa abrir a Suri (token de serviço único).
export default function ConversaCliente() {
  const { id } = useParams();
  const negocio = funil.find((n) => n.id === id) ?? funil[0];
  const [mensagens, setMensagens] = useState<MensagemChat[]>(chatsPorNegocio[negocio.id] ?? []);
  const [rascunho, setRascunho] = useState("");

  function enviar() {
    if (!rascunho.trim()) return;
    const agora = new Date();
    const horario = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
    setMensagens((m) => [
      ...m,
      { id: `local-${Date.now()}`, direcao: "out", texto: rascunho, horario, data: "hoje" },
    ]);
    setRascunho("");
    // Em produção: chamar a API de envio de mensagens da Suri aqui.
  }

  let diaAnterior = "";

  return (
    <>
      <div className="topbar-crumbs">Vendas / Funil / {negocio.clienteNome}</div>
      <div className="page-head">
        <div>
          <h1>{negocio.clienteNome}</h1>
          <div className="subtitle">
            {negocio.estagio === "lead" ? "Lead" : negocio.estagio} · {negocio.interesse}
          </div>
        </div>
        <Link to="/vendas" className="btn ghost">← Voltar ao funil</Link>
      </div>

      <div className="callout good">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--good)", display: "inline-block", marginTop: 4 }} />
        &nbsp;Conectado ao WhatsApp do cliente — mensagens sincronizadas em tempo real.
        <span className="mono" style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, background: "var(--panel-pwd)", color: "var(--accent-pwd-strong)", padding: "2px 8px", borderRadius: 99 }}>
          via Suri
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", height: 520 }}>
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--line)", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--card)" }}>
            <span className="avatar-circle" style={{ width: 32, height: 32, fontSize: 12 }}>{iniciais(negocio.clienteNome)}</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{negocio.clienteNome}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{negocio.telefone ?? "telefone não informado"} · WhatsApp</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10, background: "var(--paper)" }}>
            {mensagens.length === 0 && (
              <div style={{ margin: "auto", fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center" }}>
                Nenhuma mensagem ainda com este cliente.
              </div>
            )}
            {mensagens.map((m) => {
              const mostrarSeparador = m.data !== diaAnterior;
              diaAnterior = m.data;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
                  {mostrarSeparador && (
                    <div style={{ alignSelf: "center", fontSize: 10.5, color: "var(--ink-faint)", background: "var(--card)", border: "1px solid var(--line)", padding: "3px 12px", borderRadius: 99, margin: "4px 0 8px" }}>
                      {m.data}
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "68%",
                      alignSelf: m.direcao === "out" ? "flex-end" : "flex-start",
                      background: m.direcao === "out" ? "var(--accent-pwd)" : "var(--card)",
                      color: m.direcao === "out" ? "#eafaf6" : "var(--ink)",
                      border: m.direcao === "out" ? "none" : "1px solid var(--line)",
                      borderRadius: 13,
                      padding: "9px 13px",
                      fontSize: 12.5,
                    }}
                  >
                    {m.texto}
                    <span style={{ display: "block", fontSize: 10, marginTop: 4, opacity: 0.65, textAlign: "right" }}>
                      {m.horario}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--line)", background: "var(--card)" }}>
            <input
              style={{ flex: 1, fontSize: 13, borderRadius: 99, padding: "9px 16px", border: "1px solid var(--line)", background: "var(--paper)" }}
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Digite uma mensagem..."
            />
            <button className="btn primary" onClick={enviar}>Enviar</button>
          </div>
          <div style={{ padding: "0 16px 10px", fontSize: 10.5, color: "var(--ink-faint)", background: "var(--card)" }}>
            Mensagens enviadas por aqui são entregues no WhatsApp do cliente via Suri — o atendente nunca precisa abrir a Suri.
          </div>
        </div>

        <div style={{ padding: "18px 16px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="avatar-circle" style={{ width: 36, height: 36, fontSize: 13 }}>{iniciais(negocio.clienteNome)}</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{negocio.clienteNome}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{negocio.telefone ?? "telefone não informado"}</div>
            </div>
          </div>
          {negocio.origemSuri && (
            <div className="pill" style={{ marginBottom: 14 }}>Criado via Suri · novo contato</div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label className="mono" style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 5 }}>
              Estágio do funil
            </label>
            <select defaultValue={negocio.estagio} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--line)" }}>
              <option value="lead">Lead</option>
              <option value="orcamento">Orçamento</option>
              <option value="negociacao">Negociação</option>
              <option value="ganho">Ganho</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="mono" style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 5 }}>
              Valor estimado
            </label>
            <div>{formatarMoeda(negocio.valorEstimado)}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="mono" style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 5 }}>
              Interesse
            </label>
            <div>{negocio.interesse}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="mono" style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 5 }}>
              Responsável
            </label>
            <div>{negocio.responsavel}</div>
          </div>
          <Link to="/vendas" style={{ fontSize: 12.5 }}>Ver no funil de vendas →</Link>
        </div>
      </div>
    </>
  );
}
