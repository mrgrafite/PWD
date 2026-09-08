import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppFrame from "./components/AppFrame";
import PassageirosLista from "./screens/PassageirosLista";
import CadastroPassageiro from "./screens/CadastroPassageiro";
import ReservaVinculada from "./screens/ReservaVinculada";
import FunilVendas from "./screens/FunilVendas";
import AgendaEmbarque from "./screens/AgendaEmbarque";
import ConfiguracoesIntegracoes from "./screens/ConfiguracoesIntegracoes";
import ConversaCliente from "./screens/ConversaCliente";
import EmConstrucao from "./screens/EmConstrucao";

// Seis telas do mockup "PWD Passageiro", portadas para componentes React.
// Rotas espelham o menu lateral (Passageiros / Vendas / Agenda / Configurações);
// a conversa do cliente (Tela 6) é um drill-down de /vendas/:id, não um item
// próprio do menu — mesma decisão tomada no mockup e no DPS.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppFrame />}>
          <Route index element={<Navigate to="/passageiros" replace />} />
          <Route path="passageiros" element={<PassageirosLista />} />
          <Route path="passageiros/novo" element={<CadastroPassageiro />} />
          <Route path="passageiros/:id/reserva" element={<ReservaVinculada />} />
          <Route path="grupos" element={<EmConstrucao titulo="Grupos / Excursões" crumb="Grupos / Excursões" />} />
          <Route path="clientes" element={<EmConstrucao titulo="Clientes" crumb="Clientes" />} />
          <Route path="vendas" element={<FunilVendas />} />
          <Route path="vendas/:id/conversa" element={<ConversaCliente />} />
          <Route path="reservas" element={<EmConstrucao titulo="Reservas" crumb="Reservas" />} />
          <Route path="agenda" element={<AgendaEmbarque />} />
          <Route path="configuracoes" element={<ConfiguracoesIntegracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
