import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import type { EstagioFunil } from "../types";

interface NegocioFunilApi {
  id: string;
  clienteNome: string;
  estagio: EstagioFunil;
  interesse: string | null;
  valorEstimado: string | null;
  origemSuri: boolean;
}

const COLUNAS: { estagio: EstagioFunil; titulo: string }[] = [
  { estagio: "lead", titulo: "Lead" },
  { estagio: "orcamento", titulo: "Orçamento" },
  { estagio: "negociacao", titulo: "Negociação" },
  { estagio: "ganho", titulo: "Ganho" },
  { estagio: "perdido", titulo: "Perdido" },
];

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
    apiGet<NegocioFunilApi[]>("/api/funil")
      .then(setNegocios)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
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
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{n.clienteNome}</div>
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
