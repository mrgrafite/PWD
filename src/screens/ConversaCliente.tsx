import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

const SeletorEmoji = lazy(() => import("../components/SeletorEmoji"));
import { apiGet, apiPatch, apiPost, apiUpload } from "../api";
import type { EstagioFunil } from "../types";

interface MensagemChatApi {
  id: string;
  direcao: "in" | "out";
  texto: string | null;
  enviadoEm: string;
  status?: "enviada" | "entregue" | "lida" | "erro" | null;
  anexoTipo?: string | null;
  anexoUrl?: string | null;
  anexoNome?: string | null;
}

interface EstagioLogApi {
  id: string;
  estagioAnterior: EstagioFunil;
  estagioNovo: EstagioFunil;
  alteradoEm: string;
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
  historicoEstagio: EstagioLogApi[];
}

const ROTULO_ESTAGIO: Record<EstagioFunil, string> = {
  lead: "Lead",
  orcamento: "Orçamento",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

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

function formatarDataHoraCurta(iso: string) {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${data} ${formatarHorario(iso)}`;
}

function formatarTempoGravacao(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

// Ícone de documento genérico (PDF, Word, etc.) — usado no card de anexo
// que não é imagem/vídeo/áudio, já que não dá pra tocar/exibir inline.
function IconeDocumento({ cor }: { cor: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

// Renderiza qualquer anexo que não seja áudio (que já tem o PlayerAudio):
// imagem abre inline (clicável pra abrir em nova aba, resolução real),
// vídeo com controles nativos, e documento (PDF, Word etc.) como um
// cartão clicável com nome do arquivo — a Suri manda tudo já num link
// público, então "abrir" aqui é só um <a target="_blank">.
function Anexo({ tipo, url, nome, corTexto }: { tipo: string; url: string; nome: string | null | undefined; corTexto: string }) {
  if (tipo === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={nome ?? "Imagem enviada"} style={{ maxWidth: 260, maxHeight: 260, borderRadius: 8, display: "block" }} />
      </a>
    );
  }
  if (tipo === "video") {
    return <video src={url} controls style={{ maxWidth: 260, borderRadius: 8, display: "block" }} />;
  }
  // "document" e qualquer outro tipo não previsto caem aqui — sempre dá
  // pra abrir o link, mesmo sem saber o tipo exato.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 8, color: corTexto, textDecoration: "none" }}
    >
      <IconeDocumento cor={corTexto} />
      <span style={{ wordBreak: "break-word" }}>{nome ?? "Abrir anexo"}</span>
    </a>
  );
}

// Tela 6 — Conversa do Cliente (via Suri). Chat nativo do PWD, aberto como
// drill-down a partir de um card do funil (Tela 3) — não do menu
// Configurações. Dados vêm do backend (server/) — GET/POST
// /api/funil/:id/mensagens — não mais do mock.
//
// Envio de texto e áudio chamam a API real de envio da Suri no backend
// (server/) — a mensagem só fica salva aqui depois de confirmado que
// chegou lá.
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

  // null = nenhuma alteração pendente (o <select> reflete negocio.estagio
  // direto, inclusive quando o polling traz uma mudança feita em outro
  // lugar); só vira not-null quando o atendente mexe no combo, e volta a
  // null depois de salvar — é isso que faz o botão "Salvar" só aparecer
  // quando há de fato uma mudança não gravada ainda.
  const [estagioSelecionado, setEstagioSelecionado] = useState<EstagioFunil | null>(null);
  const [salvandoEstagio, setSalvandoEstagio] = useState(false);
  const [erroEstagio, setErroEstagio] = useState<string | null>(null);

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

  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Insere no ponto onde o cursor está, não só no fim — o atendente pode
  // ter voltado pra corrigir algo no meio da frase.
  function inserirEmoji(emoji: string) {
    const input = inputRef.current;
    const pos = input?.selectionStart ?? rascunho.length;
    setRascunho(rascunho.slice(0, pos) + emoji + rascunho.slice(pos));
    setMostrarEmojis(false);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(pos + emoji.length, pos + emoji.length);
    });
  }
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function iniciarGravacao() {
    setErroEnvio(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        enviarAudio(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravando(true);
      setTempoGravacao(0);
      timerRef.current = setInterval(() => setTempoGravacao((t) => t + 1), 1000);
    } catch {
      setErroEnvio("Não foi possível acessar o microfone — verifique a permissão do navegador.");
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop();
    setGravando(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function cancelarGravacao() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setGravando(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function enviarAudio(blob: Blob) {
    if (!negocio) return;
    setEnviandoAudio(true);
    setErroEnvio(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      const mensagem = await apiUpload<MensagemChatApi>(`/api/funil/${negocio.id}/audio`, formData);
      setNegocio((n) => (n ? { ...n, mensagens: [...n.mensagens, mensagem] } : n));
    } catch (e) {
      setErroEnvio((e as Error).message);
    } finally {
      setEnviandoAudio(false);
    }
  }

  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  async function enviarAnexo(arquivo: File) {
    if (!negocio) return;
    setEnviandoAnexo(true);
    setErroEnvio(null);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const mensagem = await apiUpload<MensagemChatApi>(`/api/funil/${negocio.id}/anexo`, formData);
      setNegocio((n) => (n ? { ...n, mensagens: [...n.mensagens, mensagem] } : n));
    } catch (e) {
      setErroEnvio((e as Error).message);
    } finally {
      setEnviandoAnexo(false);
    }
  }

  // Grava a mudança de estágio (o backend cria a linha de histórico
  // atomicamente junto com o update) e recarrega o negócio inteiro em
  // seguida, em vez de só atualizar o campo local — assim o histórico
  // exibido no painel já sai atualizado, sem esperar o próximo polling.
  async function salvarEstagio() {
    if (!negocio || !estagioSelecionado || estagioSelecionado === negocio.estagio) return;
    setSalvandoEstagio(true);
    setErroEstagio(null);
    try {
      await apiPatch(`/api/funil/${negocio.id}/estagio`, { estagio: estagioSelecionado });
      const completo = await apiGet<NegocioComMensagens>(`/api/funil/${negocio.id}/mensagens`);
      setNegocio(completo);
      setEstagioSelecionado(null);
    } catch (e) {
      setErroEstagio((e as Error).message);
    } finally {
      setSalvandoEstagio(false);
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
                      maxWidth: m.anexoTipo ? 340 : "68%",
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
                    ) : m.anexoTipo && m.anexoUrl ? (
                      <Anexo tipo={m.anexoTipo} url={m.anexoUrl} nome={m.anexoNome} corTexto={m.direcao === "out" ? "#eafaf6" : "var(--ink)"} />
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
          {mostrarEmojis && !gravando && (
            <div style={{ borderTop: "1px solid var(--line)" }}>
              <Suspense fallback={<div style={{ padding: 16, fontSize: 12, color: "var(--ink-faint)" }}>Carregando emojis...</div>}>
                <SeletorEmoji onSelecionar={inserirEmoji} />
              </Suspense>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--line)", background: "var(--card)" }}>
            {gravando ? (
              <>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--bad)", flexShrink: 0, animation: "pulse-gravando 1s ease-in-out infinite" }} />
                <span style={{ flex: 1, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  Gravando... {formatarTempoGravacao(tempoGravacao)}
                </span>
                <button className="btn ghost" onClick={cancelarGravacao} title="Cancelar gravação">✕</button>
                <button className="btn primary" onClick={pararGravacao}>Parar e enviar</button>
              </>
            ) : (
              <>
                <button
                  className="btn ghost"
                  onClick={() => setMostrarEmojis((v) => !v)}
                  disabled={enviando || enviandoAudio || enviandoAnexo}
                  title="Emojis"
                  style={{ padding: "8px 10px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
                    <path d="M9 9.5h.01M15 9.5h.01" />
                  </svg>
                </button>
                <input
                  ref={anexoInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    e.target.value = ""; // permite escolher o mesmo arquivo de novo em seguida
                    if (arquivo) enviarAnexo(arquivo);
                  }}
                />
                <button
                  className="btn ghost"
                  onClick={() => anexoInputRef.current?.click()}
                  disabled={enviando || enviandoAudio || enviandoAnexo}
                  title="Anexar arquivo"
                  style={{ padding: "8px 10px" }}
                >
                  {enviandoAnexo ? (
                    "…"
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.19 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </button>
                <input
                  ref={inputRef}
                  style={{ flex: 1, fontSize: 13, borderRadius: 99, padding: "9px 16px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviar()}
                  placeholder="Digite uma mensagem..."
                  disabled={enviando || enviandoAudio || enviandoAnexo}
                />
                <button
                  className="btn ghost"
                  onClick={iniciarGravacao}
                  disabled={enviando || enviandoAudio || enviandoAnexo}
                  title="Gravar áudio"
                  style={{ padding: "8px 10px" }}
                >
                  {enviandoAudio ? (
                    "…"
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0" />
                      <path d="M12 18v3" />
                      <path d="M9 21h6" />
                    </svg>
                  )}
                </button>
                <button className="btn primary" onClick={enviar} disabled={enviando || enviandoAudio || enviandoAnexo}>
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </>
            )}
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
            <select
              value={estagioSelecionado ?? negocio.estagio}
              onChange={(e) => setEstagioSelecionado(e.target.value as EstagioFunil)}
              disabled={salvandoEstagio}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--line)" }}
            >
              <option value="lead">Lead</option>
              <option value="orcamento">Orçamento</option>
              <option value="negociacao">Negociação</option>
              <option value="ganho">Ganho</option>
              <option value="perdido">Perdido</option>
            </select>
            {estagioSelecionado !== null && estagioSelecionado !== negocio.estagio && (
              <button
                className="btn primary"
                onClick={salvarEstagio}
                disabled={salvandoEstagio}
                style={{ marginTop: 8, width: "100%" }}
              >
                {salvandoEstagio ? "Salvando..." : "Salvar novo estágio"}
              </button>
            )}
            {erroEstagio && (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--bad)" }}>{erroEstagio}</div>
            )}
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
          {negocio.historicoEstagio.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label className="mono" style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 5 }}>
                Histórico do funil
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {negocio.historicoEstagio.map((h) => (
                  <div key={h.id} style={{ fontSize: 11.5 }}>
                    <span className="mono" style={{ color: "var(--ink-faint)", fontSize: 10.5 }}>
                      {formatarDataHoraCurta(h.alteradoEm)}
                    </span>
                    <br />
                    {ROTULO_ESTAGIO[h.estagioAnterior]} → <strong>{ROTULO_ESTAGIO[h.estagioNovo]}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Link to="/vendas" style={{ fontSize: 12.5 }}>Ver no funil de vendas →</Link>
        </div>
      </div>
    </>
  );
}
