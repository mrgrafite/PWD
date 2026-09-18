// Sessão do login por slug/tenant (rollout item 3 do design doc) — guarda
// o JWT emitido por POST /api/auth/login no localStorage do navegador.
// Sem refresh token por ora: o JWT expira em 12h (ver server/src/auth.ts)
// e o usuário simplesmente loga de novo, mesmo padrão de qualquer app sem
// "lembrar por 30 dias" ainda implementado.

export interface Perfil {
  id: string;
  nome: string;
  [chave: string]: unknown;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil | null;
}

export interface Sessao {
  token: string;
  tenantSlug: string;
  usuario: Usuario;
}

const CHAVE_STORAGE = "pwd_sessao";

export function salvarSessao(sessao: Sessao) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao));
}

export function lerSessao(): Sessao | null {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Sessao;
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_STORAGE);
}

export function estaAutenticado(): boolean {
  return lerSessao() !== null;
}
