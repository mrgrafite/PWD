import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api";
import type { EstagioFunil } from "../types";

interface MensagemChatApi {
  id: string;
  direcao: "in" | "out";
  texto: string | null;
  enviadoEm: string;
  status?: "enviada" | "entregue" | "lida" | "erro" | null;
  anexoTipo?: string | null;
  anexoUrl?: string | null;
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

// ✓ enviada, ✓✓ entregue, ✓✓ azul lida — convenção do próprio WhatsApp,
// só faz sentido pra mensagens "out" (as "in" não têm status de leitura
// do nosso lado).
function iconeStatus(status: MensagemChatApi["status"]) {
  if (status === "lida") return <span style={{ color: "#53bdeb" }}>✓✓</span>;
  if (status === "entregue") return <span>✓✓</span>;
  if (status === "erro") return <span style={{ color: "var(--bad)" }}>!</span>;
  return <span>✓</span>;
}

const VELOCIDADES = [1, 1.5, 2] as const;

// O <audio controls> nativo não tem botão de velocidade — soma um botão
// próprio do lado (cicla 1x/1.5x/2x) mantendo o resto do player nativo
// (play/pause/progresso/volume).
function PlayerAudio({ src, corTexto }: { src: string; corTexto: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [velocidade, setVelocidade] = useState<(typeof VELOCIDADES)[number]>(1);

  function alternarVelocidade() {
    const proxima = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length];
    setVelocidade(proxima);
    if (audioRef.current) audioRef.current.playbackRate = proxima;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <audio ref={audioRef} src={src} controls style={{ height: 36, width: 280 }} />
      <button
        type="button"
        onClick={alternarVelocidade}
        title="Velocidade de reprodução"
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: "3px 7px",
          borderRadius: 99,
          border: `1px solid ${corTexto}`,
          background: "transparent",
          color: corTexto,
          cursor: "pointer",
          opacity: 0.85,
        }}
      >
        {velocidade}x
      </button>
    </div>
  );
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
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Trava síncrona (além do estado "enviando", que só reflete na tela no
  // próximo render) — evita mandar a mesma mensagem duas vezes se o
  // usuário der Enter e clicar em Enviar quase ao mesmo tempo.
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    apiGet<NegocioComMensagens>(`/api/funil/${id}/mensagens`)
      .then(setNegocio)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  // Polling — pega mensagens novas (enviadas OU recebidas) e também
  // atualizações de status (entregue/lida) de mensagens já existentes, sem
  // precisar recarregar a tela. Compara um "retrato" simples (id+status de
  // cada mensagem) pra só re-renderizar quando algo realmente mudou —
  // importante com o chat aberto em mais de um computador ao mesmo tempo.
  useEffect(() => {
    if (!id) return;
    const intervalo = setInterval(() => {
      apiGet<NegocioComMensagens>(`/api/funil/${id}/mensagens`)
        .then((atualizado) => {
          setNegocio((atual) => {
            if (!atual) return atual;
            const retratoAtual = atual.mensagens.map((m) => `${m.id}:${m.status}`).join(",");
            const retratoNovo = atualizado.mensagens.map((m) => `${m.id}:${m.status}`).join(",");
            if (retratoAtual === retratoNovo) return atual;
            return { ...atual, mensagens: atualizado.mensagens };
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(intervalo);
  }, [id]);

  async function enviar() {
    if (!rascunho.trim() || !negocio || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErroEnvio(null);
    const texto = rascunho;
    setRascunho("");
    try {
      const mensagem = await apiPost<MensagemChatApi>(`/api/funil/${negocio.id}/mensagens`, { texto });
      setNegocio((n) => (n ? { ...n, mensagens: [...n.mensagens, mensagem] } : n));
    } catch (e) {
      setErroEnvio((e as Error).message);
      setRascunho(texto); // devolve o texto pro campo — o envio falhou, o usuário não perde o que escreveu
    } finally {
      enviandoRef.current = false;
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
                      maxWidth: m.anexoTipo === "audio" ? 340 : "68%",
                      alignSelf: m.direcao === "out" ? "flex-end" : "flex-start",
                      background: m.direcao === "out" ? "var(--accent-pwd)" : "var(--card)",
                      color: m.direcao === "out" ? "#eafaf6" : "var(--ink)",
                      border: m.direcao === "out" ? "none" : "1px solid var(--line)",
                      borderRadius: 13,
                      padding: "9px 13px",
                      fontSize: 12.5,
                    }}
                  >
                    {m.anexoTipo === "audio" && m.anexoUrl ? (
                      <PlayerAudio src={m.anexoUrl} corTexto={m.direcao === "out" ? "#eafaf6" : "var(--ink)"} />
                    ) : (
                      m.texto
                    )}
                    <span style={{ display: "flex", justifyContent: "flex-end", gap: 4, fontSize: 10, marginTop: 4, opacity: 0.85 }}>
                      {formatarHorario(m.enviadoEm)}
                      {m.direcao === "out" && iconeStatus(m.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {erroEnvio && (
            <div style={{ padding: "8px 16px", fontSize: 11.5, color: "var(--bad)", background: "var(--bad-bg)", borderTop: "1px solid var(--line)" }}>
              Não foi possível enviar: {erroEnvio}
            </div>
          )}
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
