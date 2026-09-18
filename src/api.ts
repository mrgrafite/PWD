import { lerSessao, limparSessao } from "./auth";

// Backend próprio do PWD (server/) — guarda credenciais (ex.: token da Suri)
// no servidor, nunca no front-end. Em dev local roda na porta 3001; em
// homologação/produção precisa apontar pro backend implantado, via
// VITE_PWD_SERVER_URL.
export const PWD_SERVER_URL = import.meta.env.VITE_PWD_SERVER_URL ?? "http://localhost:3001";

// Único ponto que sabe como sair pro login — chamado quando o backend
// devolve 401 (sessão expirada/tenant desativado) em qualquer chamada
// autenticada. Full reload (não useNavigate) porque este módulo não é um
// componente React; um redirect duro também garante que todo estado em
// memória da sessão anterior seja descartado.
function irParaLogin() {
  limparSessao();
  if (!window.location.pathname.endsWith("/login")) {
    window.location.href = `${import.meta.env.BASE_URL}login`;
  }
}

function headersAutenticados(extra?: HeadersInit): HeadersInit {
  const sessao = lerSessao();
  return {
    ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}),
    ...extra,
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${PWD_SERVER_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...headersAutenticados(init?.headers) },
  });
  if (resp.status === 401) irParaLogin();
  if (!resp.ok) {
    const corpo = await resp.json().catch(() => ({}));
    throw new Error(corpo.erro ?? `Erro ${resp.status} ao chamar ${path}`);
  }
  return resp.json();
}

export function apiGet<T>(path: string) {
  return api<T>(path);
}

export function apiPost<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

// Upload de arquivo (multipart/form-data) — sem Content-Type manual, o
// navegador define o boundary sozinho. Usado pra envio de áudio gravado.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const resp = await fetch(`${PWD_SERVER_URL}${path}`, {
    method: "POST",
    body: formData,
    headers: headersAutenticados(),
  });
  if (resp.status === 401) irParaLogin();
  if (!resp.ok) {
    const corpo = await resp.json().catch(() => ({}));
    throw new Error(corpo.erro ?? `Erro ${resp.status} ao chamar ${path}`);
  }
  return resp.json();
}
