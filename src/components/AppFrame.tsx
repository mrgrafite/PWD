import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  {
    to: "/passageiros",
    label: "Passageiros",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-4 3.2-6.5 7-6.5s7 2.5 7 6.5" />
      </svg>
    ),
  },
  {
    to: "/grupos",
    label: "Grupos / Excursões",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8.5" cy="9" r="2.6" />
        <circle cx="16" cy="9.5" r="2.2" />
        <path d="M3.5 19c.4-3.2 2.6-5 5-5s4.6 1.8 5 5" />
        <path d="M13.5 14.3c2 .2 3.6 1.8 4 4.7" />
      </svg>
    ),
  },
  {
    to: "/clientes",
    label: "Clientes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="10.5" rx="1.6" />
        <path d="M9 8V6.3A2.3 2.3 0 0 1 11.3 4h1.4A2.3 2.3 0 0 1 15 6.3V8" />
      </svg>
    ),
  },
  {
    to: "/vendas",
    label: "Vendas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16l-6 8v5.5l-4 2V13L4 5Z" />
      </svg>
    ),
  },
  {
    to: "/reservas",
    label: "Reservas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h11M4 12l4-4M4 12l4 4" />
        <path d="M20 6.5v11a1.3 1.3 0 0 1-1.3 1.3H15" />
        <path d="M15 5.2h3.7A1.3 1.3 0 0 1 20 6.5" />
      </svg>
    ),
  },
  {
    to: "/agenda",
    label: "Agenda",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5.5" width="16" height="14.5" rx="1.8" />
        <path d="M4 9.5h16M8 3.5v3M16 3.5v3" />
        <path d="M8.5 13.2l1.6 1.6 3.4-3.6" />
      </svg>
    ),
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2.6" />
        <path d="M12 4.5v2M12 17.5v2M19.5 12h-2M6.5 12h-2M17.4 6.6l-1.4 1.4M8 16l-1.4 1.4M17.4 17.4l-1.4-1.4M8 8 6.6 6.6" />
      </svg>
    ),
  },
];

// Moldura do app: sidebar fixa (menu, sempre visível) + coluna de conteúdo
// com topbar (chip do usuário logado). Espelha o chrome do mockup "PWD
// Passageiro" em todas as 6 telas.
export default function AppFrame() {
  return (
    <div className="app-frame">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="mark">PW</span> PWD
        </div>
        <ul className="navlist">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-foot">
          Sem Fronteiras Turismo
          <br />
          ambiente: produção
        </div>
      </nav>

      <div className="content-col">
        <div className="topbar">
          <div className="user-chip">
            <span className="avatar">MS</span> Marcelo Santos
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
