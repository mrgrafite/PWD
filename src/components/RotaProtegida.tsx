import { Navigate, Outlet, useLocation } from "react-router-dom";
import { estaAutenticado } from "../auth";

// Guarda tudo que fica dentro de <AppFrame /> — sem sessão salva, manda
// pro /login carregando a rota original em location.state.from, pra
// Login.tsx devolver o usuário exatamente onde ele tentou entrar.
export default function RotaProtegida() {
  const location = useLocation();
  if (!estaAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
