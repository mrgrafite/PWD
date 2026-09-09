import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";

const ROTULO_STATUS: Record<string, string> = {
  aguardando: "Aguardando",
  vinculada: "Vinculada",
  emitida: "Emitida",
  alterada: "Alterada",
  cancelada: "Cancelada",
};

interface PassageiroApi {
  id: string;
  nomeCompleto: string;
  cpf: string | null;
  reserva?: { status: string } | null;
}

// Lista de passageiros — ponto de entrada para o Cadastro (Tela 1) e para
// o Detalhe da Reserva Vinculada (Tela 2) de cada passageiro. Dados vêm do
// backend (server/) — GET /api/passageiros.
export default function PassageirosLista() {
  const [passageiros, setPassageiros] = useState<PassageiroApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PassageiroApi[]>("/api/passageiros")
      .then(setPassageiros)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <>
      <div className="topbar-crumbs">Passageiros</div>
      <div className="page-head">
        <div>
          <h1>Passageiros</h1>
          <div className="subtitle">Cadastro e acompanhamento da reserva vinculada ao SPax</div>
        </div>
        <Link to="/passageiros/novo" className="btn primary">+ Novo cadastro</Link>
      </div>

      {carregando && <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>}
      {erro && <p style={{ color: "var(--bad)" }}>Não foi possível carregar os passageiros: {erro}</p>}

      {!carregando && !erro && (
        <div className="section" style={{ padding: 0 }}>
          {passageiros.length === 0 ? (
            <p style={{ padding: 16, color: "var(--ink-faint)", fontSize: 12.5 }}>
              Nenhum passageiro cadastrado ainda.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Status da reserva</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {passageiros.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nomeCompleto}</td>
                    <td className="mono">{p.cpf ?? "—"}</td>
                    <td>
                      <span className={`pill ${p.reserva?.status === "vinculada" || p.reserva?.status === "emitida" ? "on" : "off"}`}>
                        {ROTULO_STATUS[p.reserva?.status ?? "aguardando"]}
                      </span>
                    </td>
                    <td>
                      <Link to={`/passageiros/${p.id}/reserva`}>Ver reserva →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
