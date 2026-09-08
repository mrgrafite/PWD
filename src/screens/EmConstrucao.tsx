interface Props {
  titulo: string;
  crumb: string;
}

// Placeholder para itens do menu já presentes no mockup/DPS mas cuja tela
// ainda não foi portada para este template (Grupos/Excursões, Clientes,
// Reservas). Existe para o item de menu não virar link morto.
export default function EmConstrucao({ titulo, crumb }: Props) {
  return (
    <>
      <div className="topbar-crumbs">{crumb}</div>
      <div className="page-head">
        <div>
          <h1>{titulo}</h1>
          <div className="subtitle">Ainda não portada para este template — ver DPS e mockup para o desenho completo</div>
        </div>
      </div>
      <div className="section">
        <p style={{ color: "var(--ink-soft)", margin: 0 }}>Em construção.</p>
      </div>
    </>
  );
}
