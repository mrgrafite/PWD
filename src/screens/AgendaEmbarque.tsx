import { useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { eventosEmbarque } from "../data/mock";

type Periodo = "dia" | "semana-util" | "semana" | "7dias" | "mes";

const OPCOES: { valor: Periodo; rotulo: string }[] = [
  { valor: "dia", rotulo: "Dia" },
  { valor: "semana-util", rotulo: "Semana útil" },
  { valor: "semana", rotulo: "Semana" },
  { valor: "7dias", rotulo: "Próximos 7 dias" },
  { valor: "mes", rotulo: "Mês" },
];

function intervaloPara(periodo: Periodo, hoje: Date): Date[] {
  switch (periodo) {
    case "dia":
      return [hoje];
    case "7dias":
      return eachDayOfInterval({ start: hoje, end: addDays(hoje, 6) });
    case "semana": {
      const inicio = startOfWeek(hoje, { locale: ptBR });
      return eachDayOfInterval({ start: inicio, end: endOfWeek(hoje, { locale: ptBR }) });
    }
    case "semana-util": {
      const inicio = startOfWeek(hoje, { locale: ptBR, weekStartsOn: 1 });
      return eachDayOfInterval({ start: inicio, end: addDays(inicio, 4) });
    }
    case "mes":
      return eachDayOfInterval({ start: startOfMonth(hoje), end: endOfMonth(hoje) });
  }
}

// Tela 4 — Agenda de Embarque, visão Calendário. Seletor de período com as
// cinco opções definidas com o patrocinador; "Próximos 7 dias" é sempre uma
// janela rolante a partir de hoje (não uma semana fixa). Horários sempre 24h.
export default function AgendaEmbarque() {
  const [periodo, setPeriodo] = useState<Periodo>("7dias");
  const hoje = useMemo(() => new Date(), []);
  const dias = useMemo(() => intervaloPara(periodo, hoje), [periodo, hoje]);

  const eventosPorDia = (dia: Date) =>
    eventosEmbarque.filter((ev) => isSameDay(parseISO(ev.data), dia));

  return (
    <>
      <div className="topbar-crumbs">Agenda / Embarque</div>
      <div className="page-head">
        <div>
          <h1>Agenda de Embarque</h1>
          <div className="subtitle">Tela 4 — visão Calendário (todos os horários em 24h)</div>
        </div>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          {OPCOES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${dias.length}, 1fr)`,
          overflow: "hidden",
        }}
      >
        {dias.map((dia) => {
          const eventos = eventosPorDia(dia);
          return (
            <div
              key={dia.toISOString()}
              style={{
                borderRight: "1px solid var(--line)",
                padding: "10px 10px 16px",
                minHeight: 220,
                background: isWeekend(dia) ? "var(--paper)" : "var(--card)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 8 }}>
                {format(dia, "EEE dd/MM", { locale: ptBR })}
              </div>
              {eventos.length === 0 && (
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>—</div>
              )}
              {eventos.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: "var(--panel-pwd)",
                    color: "var(--accent-pwd-strong)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: 11.5,
                    marginBottom: 6,
                  }}
                >
                  <strong>{ev.hora}</strong> {ev.passageiroNome}
                  <div style={{ opacity: 0.75 }}>{ev.destino}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
