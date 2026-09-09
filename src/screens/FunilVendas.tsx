import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import type { EstagioFunil } from "../types";

type StatusAtendimento = "roxo" | "vermelho" | "verde" | "amarelo" | null;

interface NegocioFunilApi {
  id: string;
  clienteNome: string;
  estagio: EstagioFunil;
  interesse: string | null;
  valorEstimado: string | null;
  origemSuri: boolean;
  statusAtendimento: StatusAtendimento;
}

const COLUNAS: { estagio: EstagioFunil; titulo: string }[] = [
  { estagio: "lead", titulo: "Lead" },
  { estagio: "orcamento", titulo: "Orçamento" },
  { estagio: "negociacao", titulo: "Negociação" },
  { estagio: "ganho", titulo: "Ganho" },
  { estagio: "perdido", titulo: "Perdido" },
];

const LEGENDA_STATUS: { status: Exclude<StatusAtendimento, null>; rotulo: string }[] = [
  { status: "vermelho", rotulo: "Conversa ativa — cliente aguardando resposta" },
  { status: "verde", rotulo: "Respondido há pouco (< 5min)" },
  { status: "amarelo", rotulo: "Respondido há 5min+ sem retorno do cliente" },
  { status: "roxo", rotulo: "Lead novo, ainda não atendido" },
];

// Intervalo do polling: o status é derivado de tempo decorrido (ex.: verde
// vira amarelo aos 5min), então precisa recalcular periodicamente mesmo sem
// nenhuma mensagem nova — 20s é frequente o bastante pra sentir "ao vivo"
// sem sobrecarregar o backend.
const INTERVALO_POLLING_MS = 20_000;

function formatarMoeda(v: string | null) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Tela 3 — Funil de Vendas (Kanban por Cliente). Um card com origemSuri
// representa um Lead criado automaticamente pelo evento "novo contato" da
// Suri; clicar no card abre a conversa (Tela 6). Dados vêm do backend
// (server/), não mais do mock — GET /api/funil.
export default function FunilVendas() {
  const [negocios, setNegocios] = useState<NegocioFunilApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const carregar = () =>
      apiGet<NegocioFunilApi[]>("/api/funil")
        .then(setNegocios)
        .catch((e) => setErro(e.message))
        .finally(() => setCarregando(false));

    carregar();
    const intervalo = setInterval(carregar, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <>
      <div className="topbar-crumbs">Vendas / Funil</div>
      <div className="page-head">
        <div>
          <h1>Funil de Vendas</h1>
          <div className="subtitle">Tela 3 — clique em um card para abrir a conversa do cliente</div>
        </div>
      </div>

      {!carregando && !erro && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginBottom: 16, fontSize: 12, color: "var(--ink-soft)" }}>
          {LEGENDA_STATUS.map((l) => (
            <div key={l.status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`status-atendimento ${l.status}`} />
              {l.rotulo}
            </div>
          ))}
        </div>
      )}

      {carregando && <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>}
      {erro && <p style={{ color: "var(--bad)" }}>Não foi possível carregar o funil: {erro}</p>}

      {!carregando && !erro && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {COLUNAS.map((col) => (
            <div key={col.estagio}>
              <h2 style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>
                {col.titulo} ({negocios.filter((n) => n.estagio === col.estagio).length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {negocios
                  .filter((n) => n.estagio === col.estagio)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="card"
                      style={{ padding: "12px 14px", cursor: "pointer" }}
                      onClick={() => navigate(`/vendas/${n.id}/conversa`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 }}>
                        {n.statusAtendimento && <span className={`status-atendimento ${n.statusAtendimento}`} />}
                        {n.clienteNome}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 8px" }}>
                        {n.interesse}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                          {formatarMoeda(n.valorEstimado)}
                        </span>
                        {n.origemSuri && <span className="pill">via Suri</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
