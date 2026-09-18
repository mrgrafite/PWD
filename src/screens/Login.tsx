import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../api";
import { salvarSessao, type Sessao } from "../auth";
import AliMark from "../components/AliMark";

// Tela real de login (rollout item 3 do design doc de multi-tenant) —
// substitui o placeholder "sign-in-demo" (nunca chamava a API de verdade).
// Campo "Código da agência" é o slug do tenant; vazio cai no fallback do
// backend (semfronteiras), único tenant em uso diário até este rollout.
export default function Login() {
  const [slug, setSlug] = useState("semfronteiras");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { from?: string } | null)?.from ?? "/passageiros";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      const sessao = await apiPost<Sessao>("/api/auth/login", { slug: slug.trim(), email: email.trim(), senha });
      salvarSessao(sessao);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <div className="mark-row">
          <AliMark size={28} /> PWD
        </div>
        <div className="pitch">
          <h1>Gestão de passageiros, do primeiro contato ao embarque.</h1>
          <p>
            Cadastro, funil de vendas e reserva vinculada num só lugar — cada agência acessa
            só os dados do próprio tenant, pelo código cadastrado com a Ali Tecnologia.
          </p>
        </div>
        <div className="foot">Ali Tecnologia · plataforma PWD multi-tenant</div>
      </aside>

      <main className="login-formside">
        <div className="login-card">
          <h2>Entrar</h2>
          <p className="sub">Use o código da agência e as credenciais cadastradas pela sua equipe.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="slug">Código da agência</label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="semfronteiras"
                autoComplete="organization"
              />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@agencia.com.br"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <button type="submit" className="btn primary" disabled={carregando}>
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
