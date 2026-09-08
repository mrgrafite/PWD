import { Link } from "react-router-dom";
import { passageiros } from "../data/mock";

const ROTULO_STATUS: Record<string, string> = {
  aguardando: "Aguardando",
  vinculada: "Vinculada",
  emitida: "Emitida",
  alterada: "Alterada",
  cancelada: "Cancelada",
};

// Lista de passageiros — ponto de entrada para o Cadastro (Tela 1) e para
// o Detalhe da Reserva Vinculada (Tela 2) de cada passageiro.
export default function PassageirosLista() {
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

      <div className="section" style={{ padding: 0 }}>
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
                <td className="mono">{p.cpf}</td>
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
      </div>
    </>
  );
}
