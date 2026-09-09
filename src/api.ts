// Backend próprio do PWD (server/) — guarda credenciais (ex.: token da Suri)
// no servidor, nunca no front-end. Em dev local roda na porta 3001; em
// homologação/produção precisa apontar pro backend implantado, via
// VITE_PWD_SERVER_URL.
export const PWD_SERVER_URL = import.meta.env.VITE_PWD_SERVER_URL ?? "http://localhost:3001";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${PWD_SERVER_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
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

// Upload de arquivo (multipart/form-data) — sem Content-Type manual, o
// navegador define o boundary sozinho. Usado pra envio de áudio gravado.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const resp = await fetch(`${PWD_SERVER_URL}${path}`, { method: "POST", body: formData });
  if (!resp.ok) {
    const corpo = await resp.json().catch(() => ({}));
    throw new Error(corpo.erro ?? `Erro ${resp.status} ao chamar ${path}`);
  }
  return resp.json();
}
