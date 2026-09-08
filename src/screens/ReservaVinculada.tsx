import { useParams, Link } from "react-router-dom";
import { passageiros } from "../data/mock";

const ROTULO_STATUS: Record<string, string> = {
  aguardando: "Aguardando",
  vinculada: "Vinculada",
  emitida: "Emitida",
  alterada: "Alterada",
  cancelada: "Cancelada",
};

function formatarMoeda(v?: number) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Tela 2 — Detalhe da Reserva Vinculada. Status sincronizado com o SPax
// (reconsulta a cada 1h) e o alerta de repasse tarifário.
export default function ReservaVinculada() {
  const { id } = useParams();
  const passageiro = passageiros.find((p) => p.id === id) ?? passageiros[0];
  const reserva = passageiro.reserva;

  return (
    <>
      <div className="topbar-crumbs">
        <Link to="/passageiros">Passageiros</Link> / {passageiro.nomeCompleto} / Reserva
      </div>
      <div className="page-head">
        <div>
          <h1>{passageiro.nomeCompleto}</h1>
          <div className="subtitle">Tela 2 — Detalhe da Reserva Vinculada (CPF {passageiro.cpf})</div>
        </div>
        <span className={`pill ${reserva?.status === "vinculada" || reserva?.status === "emitida" ? "on" : "off"}`}>
          {ROTULO_STATUS[reserva?.status ?? "aguardando"]}
        </span>
      </div>

      {reserva?.alertaTarifaAtivo && (
        <div className="callout warn">
          <strong>Alerta de repasse tarifário:</strong>&nbsp;a tarifa de mercado atual
          ({formatarMoeda(reserva.tarifaAtual)}) ficou mais barata que a tarifa reservada
          ({formatarMoeda(reserva.tarifaReservada)}). Avalie se vale reemitir — a decisão é sempre manual.
        </div>
      )}

      {reserva?.status === "aguardando" && (
        <div className="callout good">
          Ainda sem reserva encontrada no SPax — este é o estado inicial esperado, não um erro.
          A próxima reconsulta automática está marcada para {reserva.proximaReconsultaEm}.
        </div>
      )}

      <div className="section">
        <h2>Reserva</h2>
        <div className="form-grid">
          <div className="field">
            <label>Localizador</label>
            <input readOnly value={reserva?.localizador ?? "—"} />
          </div>
          <div className="field">
            <label>Tarifa reservada</label>
            <input readOnly value={formatarMoeda(reserva?.tarifaReservada)} />
          </div>
          <div className="field">
            <label>Tarifa atual</label>
            <input readOnly value={formatarMoeda(reserva?.tarifaAtual)} />
          </div>
          <div className="field">
            <label>Prazo de emissão</label>
            <input readOnly value={reserva?.prazoEmissao ?? "—"} />
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Log de reconsultas ao SPax</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Consultado em</th>
              <th>Resultado</th>
              <th>Tarifa consultada</th>
            </tr>
          </thead>
          <tbody>
            {(passageiro.reconsultas ?? []).map((r, i) => (
              <tr key={i}>
                <td>{r.consultadoEm}</td>
                <td>{r.resultado === "ok" ? "OK" : r.resultado === "sem_reserva" ? "Sem reserva" : "Erro"}</td>
                <td>{formatarMoeda(r.tarifaConsultada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
