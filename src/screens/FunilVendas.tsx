import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { funil } from "../data/mock";
import type { EstagioFunil, NegocioFunil } from "../types";

const COLUNAS: { estagio: EstagioFunil; titulo: string }[] = [
  { estagio: "lead", titulo: "Lead" },
  { estagio: "orcamento", titulo: "Orçamento" },
  { estagio: "negociacao", titulo: "Negociação" },
  { estagio: "ganho", titulo: "Ganho" },
  { estagio: "perdido", titulo: "Perdido" },
];

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Tela 3 — Funil de Vendas (Kanban por Cliente). Um card com origemSuri
// representa um Lead criado automaticamente pelo evento "novo contato" da
// Suri; clicar no card abre a conversa (Tela 6).
export default function FunilVendas() {
  const [negocios] = useState<NegocioFunil[]>(funil);
  const navigate = useNavigate();

  return (
    <>
      <div className="topbar-crumbs">Vendas / Funil</div>
      <div className="page-head">
        <div>
          <h1>Funil de Vendas</h1>
          <div className="subtitle">Tela 3 — clique em um card para abrir a conversa do cliente</div>
        </div>
      </div>

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
    </>
  );
}
