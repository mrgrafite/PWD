import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api";
import type { EstagioFunil } from "../types";

interface MensagemChatApi {
  id: string;
  direcao: "in" | "out";
  texto: string;
  enviadoEm: string;
}

interface NegocioComMensagens {
  id: string;
  clienteNome: string;
  telefone: string | null;
  estagio: EstagioFunil;
  interesse: string | null;
  valorEstimado: string | null;
  responsavel: string | null;
  origemSuri: boolean;
  mensagens: MensagemChatApi[];
}

function formatarMoeda(v: string | null) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

function formatarHorario(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatarDiaSeparador(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const dataFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(d);
  if (d.toDateString() === hoje.toDateString()) return `hoje, ${dataFmt}`;
  const dia = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
  return `${dia}, ${dataFmt}`;
}

// Tela 6 — Conversa do Cliente (via Suri). Chat nativo do PWD, aberto como
// drill-down a partir de um card do funil (Tela 3) — não do menu
// Configurações. Dados vêm do backend (server/) — GET/POST
// /api/funil/:id/mensagens — não mais do mock.
//
// O envio aqui só persiste no banco (não chama a API de envio da Suri
// ainda): os contatos de hoje são mocks, não conversas reais do Portal
// Suri, e enviar de verdade poderia disparar mensagem pra um número real
// por engano.
export default function ConversaCliente() {
  const { id } = useParams();
  const [negocio, setNegocio] = useState<NegocioComMensagens | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    apiGet<NegocioComMensagens>(`/api/funil/${id}/mensagens`)
      .then(setNegocio)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  // Polling — pega mensagens novas (enviadas OU recebidas, ex.: via webhook
  // da Suri quando existir) sem precisar recarregar a tela. Só substitui o
  // estado quando a contagem muda, pra não re-renderizar à toa a cada 3s.
  useEffect(() => {
    if (!id) return;
    const intervalo = setInterval(() => {
      apiGet<NegocioComMensagens>(`/api/funil/${id}/mensagens`)
        .then((atualizado) => {
          setNegocio((atual) => {
            if (!atual || atualizado.mensagens.length === atual.mensagens.length) return atual;
            return { ...atual, mensagens: atualizado.mensagens };
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(intervalo);
  }, [id]);

  async function enviar() {
    if (!rascunho.trim() || !negocio || enviando) return;
    setEnviando(true);
    try {
      const mensagem = await apiPost<MensagemChatApi>(`/api/funil/${negocio.id}/mensagens`, { texto: rascunho });
      setNegocio((n) => (n ? { ...n, mensagens: [...n.mensagens, mensagem] } : n));
      setRascunho("");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando conversa...</p>;
  if (erro || !negocio) return <p style={{ color: "var(--bad)" }}>Não foi possível carregar a conversa: {erro}</p>;

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
            {negocio.mensagens.length === 0 && (
              <div style={{ margin: "auto", fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center" }}>
                Nenhuma mensagem ainda com este cliente.
              </div>
            )}
            {negocio.mensagens.map((m) => {
              const diaLabel = formatarDiaSeparador(m.enviadoEm);
              const mostrarSeparador = diaLabel !== diaAnterior;
              diaAnterior = diaLabel;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
                  {mostrarSeparador && (
                    <div style={{ alignSelf: "center", fontSize: 10.5, color: "var(--ink-faint)", background: "var(--card)", border: "1px solid var(--line)", padding: "3px 12px", borderRadius: 99, margin: "4px 0 8px" }}>
                      {diaLabel}
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
                      {formatarHorario(m.enviadoEm)}
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
              disabled={enviando}
            />
            <button className="btn primary" onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </button>
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
