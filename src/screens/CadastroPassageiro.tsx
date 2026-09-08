import { useState } from "react";
import { clientes, grupos } from "../data/mock";
import type { TipoDocumentoNacional, TipoPassaporte } from "../types";

type Aba = "titular" | "familia" | "passaporte" | "visto";

interface EnderecoForm {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  paisResidencia: string;
}

interface DependenteForm {
  id: string;
  nome: string;
  parentesco: string;
  nascimento: string;
}

interface VistoForm {
  id: string;
  pais: string;
  tipo: string;
  numero: string;
  dataEmissao: string;
  validade: string;
}

const ENDERECO_VAZIO: EnderecoForm = {
  cep: "",
  logradouro: "",
  bairro: "",
  cidade: "",
  estado: "",
  paisResidencia: "Brasil",
};

const UFS = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

// Tela 1 — Cadastro do Passageiro.
// Autopreenchimento de endereço por CEP (ViaCEP) na aba Titular, conforme
// documentado no DPS: o CEP é o único campo digitado, o resto é liberado
// para edição manual se a consulta falhar (ou se o atendente pedir, no
// caso de endereço atípico).
export default function CadastroPassageiro() {
  const [aba, setAba] = useState<Aba>("titular");
  const [endereco, setEndereco] = useState<EnderecoForm>(ENDERECO_VAZIO);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepErro, setCepErro] = useState(false);

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoNacional>("RG");

  // Dependentes e vistos são simplificados aqui como listas locais do
  // formulário (nome/data + país/tipo/número). No modelo real cada
  // dependente é um Passageiro completo (titularId) com endereço, documento,
  // passaporte e visto próprios — a edição completa por dependente fica
  // para quando o cadastro tiver persistência real.
  const [dependentes, setDependentes] = useState<DependenteForm[]>([]);
  const [novoDependente, setNovoDependente] = useState<{ nome: string; parentesco: string; nascimento: string } | null>(null);

  const [vistos, setVistos] = useState<VistoForm[]>([]);
  const [novoVisto, setNovoVisto] = useState<{ pais: string; tipo: string; numero: string; dataEmissao: string; validade: string } | null>(null);

  const [tipoPassaporte, setTipoPassaporte] = useState<TipoPassaporte>("regular");
  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoVerso, setFotoVerso] = useState<string | null>(null);

  const [estadoPassaporte, setEstadoPassaporte] = useState("");
  const [cidadePassaporte, setCidadePassaporte] = useState("");
  const [cidadesPassaporte, setCidadesPassaporte] = useState<string[]>([]);
  const [carregandoCidadesPassaporte, setCarregandoCidadesPassaporte] = useState(false);

  const [estadoDocumento, setEstadoDocumento] = useState("");
  const [cidadeDocumento, setCidadeDocumento] = useState("");
  const [cidadesDocumento, setCidadesDocumento] = useState<string[]>([]);
  const [carregandoCidadesDocumento, setCarregandoCidadesDocumento] = useState(false);

  async function carregarMunicipios(uf: string, setCidades: (v: string[]) => void, setCarregando: (v: boolean) => void) {
    setCidades([]);
    if (!uf) return;
    setCarregando(true);
    try {
      const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = await resp.json();
      setCidades(data.map((m: { nome: string }) => m.nome));
    } catch {
      setCidades([]);
    } finally {
      setCarregando(false);
    }
  }

  function selecionarEstadoPassaporte(uf: string) {
    setEstadoPassaporte(uf);
    setCidadePassaporte("");
    carregarMunicipios(uf, setCidadesPassaporte, setCarregandoCidadesPassaporte);
  }

  function selecionarEstadoDocumento(uf: string) {
    setEstadoDocumento(uf);
    setCidadeDocumento("");
    carregarMunicipios(uf, setCidadesDocumento, setCarregandoCidadesDocumento);
  }

  async function buscarCep(cepDigitado: string) {
    const cep = cepDigitado.replace(/\D/g, "");
    setEndereco((e) => ({ ...e, cep: cepDigitado }));
    if (cep.length !== 8) return;

    setBuscandoCep(true);
    setCepErro(false);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (data.erro) {
        setCepErro(true);
      } else {
        setEndereco((e) => ({
          ...e,
          cep: cepDigitado,
          logradouro: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
        }));
      }
    } catch {
      setCepErro(true);
    } finally {
      setBuscandoCep(false);
    }
  }

  function statusVisto(validade: string) {
    if (!validade) return "válido";
    return new Date(validade) < new Date() ? "vencido" : "válido";
  }

  return (
    <>
      <div className="topbar-crumbs">Passageiros / Novo Cadastro</div>
      <div className="page-head">
        <div>
          <h1>Cadastro do Passageiro</h1>
          <div className="subtitle">Tela 1 — CPF é a chave de busca; dispara a busca automática da reserva no SPax</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost">Cancelar</button>
          <button className="btn primary">Salvar passageiro</button>
        </div>
      </div>

      <div className="tabs">
        {(["titular", "familia", "passaporte", "visto"] as Aba[]).map((a) => (
          <button key={a} className={aba === a ? "active" : ""} onClick={() => setAba(a)}>
            {a === "titular" && "Titular"}
            {a === "familia" && "Família"}
            {a === "passaporte" && "Passaporte"}
            {a === "visto" && "Visto"}
          </button>
        ))}
      </div>

      {aba === "titular" && (
        <div className="section">
          <h2>Dados pessoais</h2>
          <div className="form-grid">
            <div className="field span-2">
              <label>Nome completo</label>
              <input placeholder="Nome do passageiro" />
            </div>
            <div className="field">
              <label>CPF</label>
              <input className="mono" placeholder="000.000.000-00" />
            </div>
            <div className="field">
              <label>Data de nascimento</label>
              <input type="date" />
            </div>
            <div className="field span-2">
              <label>Telefone / WhatsApp</label>
              <input placeholder="+55 (11) 90000-0000" />
            </div>
            <div className="field">
              <label>Cliente (conta)</label>
              <select defaultValue="">
                <option value="" disabled>Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nomeRazaoSocial}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Grupo / Excursão</label>
              <select defaultValue="">
                <option value="">Nenhum</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="autolookup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.3-4.3" />
            </svg>
            Nenhuma reserva vinculada ainda — o PWD consulta o SPax assim que o CPF é salvo.
          </div>

          <h2 style={{ marginTop: 22 }}>Endereço</h2>
          <div className="form-grid">
            <div className="field">
              <label>CEP</label>
              <input
                value={endereco.cep}
                onChange={(e) => buscarCep(e.target.value)}
                placeholder="00000-000"
              />
              <span className="hint">
                {buscandoCep && "Consultando ViaCEP..."}
                {!buscandoCep && cepErro && "CEP não encontrado — preencha manualmente abaixo."}
                {!buscandoCep && !cepErro && "Preenche logradouro, bairro, cidade e estado automaticamente — edição manual sempre liberada."}
              </span>
            </div>
            <div className="field span-2">
              <label>Logradouro</label>
              <input
                value={endereco.logradouro}
                onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Bairro</label>
              <input
                value={endereco.bairro}
                onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Cidade</label>
              <input
                value={endereco.cidade}
                onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Estado</label>
              <input
                value={endereco.estado}
                onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
              />
            </div>
            <div className="field">
              <label>País</label>
              <input
                value={endereco.paisResidencia}
                onChange={(e) => setEndereco({ ...endereco, paisResidencia: e.target.value })}
              />
            </div>
          </div>

          <h2 style={{ marginTop: 22 }}>Documento nacional</h2>
          <div className="form-grid">
            <div className="field">
              <label>Tipo</label>
              <div className="seg">
                <button className={tipoDocumento === "RG" ? "on" : ""} onClick={() => setTipoDocumento("RG")} type="button">RG</button>
                <button className={tipoDocumento === "CNH" ? "on" : ""} onClick={() => setTipoDocumento("CNH")} type="button">CNH</button>
              </div>
            </div>
            <div className="field">
              <label>Número</label>
              <input className="mono" />
            </div>
            <div className="field">
              <label>Órgão emissor</label>
              <input placeholder="SSP" />
            </div>
            <div className="field">
              <label>Estado emissor</label>
              <select value={estadoDocumento} onChange={(e) => selecionarEstadoDocumento(e.target.value)}>
                <option value="">Selecione...</option>
                {UFS.map(([sigla, nome]) => (
                  <option key={sigla} value={sigla}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Cidade emissora</label>
              <select
                value={cidadeDocumento}
                onChange={(e) => setCidadeDocumento(e.target.value)}
                disabled={!estadoDocumento || carregandoCidadesDocumento}
              >
                <option value="">
                  {!estadoDocumento ? "Selecione o estado primeiro" : carregandoCidadesDocumento ? "Carregando..." : "Selecione..."}
                </option>
                {cidadesDocumento.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Categoria (CNH)</label>
              <input placeholder="—" disabled={tipoDocumento !== "CNH"} />
            </div>
          </div>
        </div>
      )}

      {aba === "familia" && (
        <div className="section">
          <h2>Dependentes</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>
            Cada dependente é um passageiro completo (mesmos campos de um titular, inclusive
            endereço, documento, passaporte e visto próprios), vinculado a este titular.
          </p>

          {dependentes.map((d) => (
            <div className="depend-row" key={d.id}>
              <div>
                <div className="who">{d.nome || "Dependente sem nome"}</div>
                <div className="meta">
                  {d.parentesco || "parentesco não informado"} · nascido em {d.nascimento || "—"} · mesmo endereço do titular
                </div>
              </div>
              <button className="btn ghost" onClick={() => setDependentes((list) => list.filter((x) => x.id !== d.id))}>
                Remover
              </button>
            </div>
          ))}

          {novoDependente ? (
            <div className="inline-form">
              <div className="field">
                <label>Nome completo</label>
                <input value={novoDependente.nome} onChange={(e) => setNovoDependente({ ...novoDependente, nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Parentesco</label>
                <select value={novoDependente.parentesco} onChange={(e) => setNovoDependente({ ...novoDependente, parentesco: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="filho">Filho(a)</option>
                  <option value="cônjuge">Cônjuge</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field">
                <label>Data de nascimento</label>
                <input type="date" value={novoDependente.nascimento} onChange={(e) => setNovoDependente({ ...novoDependente, nascimento: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    if (!novoDependente.nome.trim()) return;
                    setDependentes((list) => [...list, { id: `d-${Date.now()}`, ...novoDependente }]);
                    setNovoDependente(null);
                  }}
                >
                  Salvar dependente
                </button>
                <button className="btn ghost" onClick={() => setNovoDependente(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <span className="add-link" onClick={() => setNovoDependente({ nome: "", parentesco: "", nascimento: "" })}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Adicionar dependente
            </span>
          )}
        </div>
      )}

      {aba === "passaporte" && (
        <div className="section">
          <h2>Passaporte</h2>
          <div className="form-grid">
            <div className="field">
              <label>Tipo</label>
              <select value={tipoPassaporte} onChange={(e) => setTipoPassaporte(e.target.value as TipoPassaporte)}>
                <option value="regular">Regular</option>
                <option value="diplomatico">Diplomático</option>
                <option value="oficial">Oficial</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="field">
              <label>Número</label>
              <input className="mono" />
            </div>
            <div className="field">
              <label>Número de controle</label>
              <input className="mono" />
            </div>
            <div className="field">
              <label>País emissor</label>
              <input />
            </div>
            <div className="field">
              <label>Estado de emissão</label>
              <select value={estadoPassaporte} onChange={(e) => selecionarEstadoPassaporte(e.target.value)}>
                <option value="">Selecione...</option>
                {UFS.map(([sigla, nome]) => (
                  <option key={sigla} value={sigla}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Cidade de emissão</label>
              <select
                value={cidadePassaporte}
                onChange={(e) => setCidadePassaporte(e.target.value)}
                disabled={!estadoPassaporte || carregandoCidadesPassaporte}
              >
                <option value="">
                  {!estadoPassaporte ? "Selecione o estado primeiro" : carregandoCidadesPassaporte ? "Carregando..." : "Selecione..."}
                </option>
                {cidadesPassaporte.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Validade</label>
              <input type="date" />
            </div>
            <div className="field">
              <label>Foto do passaporte — frente</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFotoFrente(e.target.files?.[0]?.name ?? null)}
              />
              {fotoFrente && <span className="hint">{fotoFrente}</span>}
            </div>
            <div className="field">
              <label>Foto do passaporte — verso</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFotoVerso(e.target.files?.[0]?.name ?? null)}
              />
              {fotoVerso && <span className="hint">{fotoVerso}</span>}
            </div>
          </div>
        </div>
      )}

      {aba === "visto" && (
        <div className="section">
          <h2>Vistos</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>
            Lista por país — um passageiro pode ter vistos de vários países.
          </p>

          {vistos.map((v) => (
            <div className="visa-card" key={v.id}>
              <div className="top">
                <div className="who">{v.pais || "País não informado"} — {v.tipo || "tipo não informado"}</div>
                <span className={`pill ${statusVisto(v.validade) === "válido" ? "on" : "warn"}`}>{statusVisto(v.validade)}</span>
              </div>
              <div className="meta">
                nº {v.numero || "—"} · emitido {v.dataEmissao || "—"} · válido até {v.validade || "—"}
              </div>
            </div>
          ))}

          {novoVisto ? (
            <div className="inline-form">
              <div className="field">
                <label>País</label>
                <input value={novoVisto.pais} onChange={(e) => setNovoVisto({ ...novoVisto, pais: e.target.value })} />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select value={novoVisto.tipo} onChange={(e) => setNovoVisto({ ...novoVisto, tipo: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="turismo">Turismo</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="transito">Trânsito</option>
                  <option value="estudante">Estudante</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field">
                <label>Número</label>
                <input className="mono" value={novoVisto.numero} onChange={(e) => setNovoVisto({ ...novoVisto, numero: e.target.value })} />
              </div>
              <div className="field">
                <label>Data de emissão</label>
                <input type="date" value={novoVisto.dataEmissao} onChange={(e) => setNovoVisto({ ...novoVisto, dataEmissao: e.target.value })} />
              </div>
              <div className="field">
                <label>Validade</label>
                <input type="date" value={novoVisto.validade} onChange={(e) => setNovoVisto({ ...novoVisto, validade: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    if (!novoVisto.pais.trim()) return;
                    setVistos((list) => [...list, { id: `v-${Date.now()}`, ...novoVisto }]);
                    setNovoVisto(null);
                  }}
                >
                  Salvar visto
                </button>
                <button className="btn ghost" onClick={() => setNovoVisto(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <span className="add-link" onClick={() => setNovoVisto({ pais: "", tipo: "", numero: "", dataEmissao: "", validade: "" })}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Adicionar visto
            </span>
          )}
        </div>
      )}
    </>
  );
}
