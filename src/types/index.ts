// Modelo de dados do módulo de Passageiros do PWD.
// Espelha o que está documentado em "PWD x SPax - Fluxo e Modelo de Dados"
// e no DPS-PWD-Módulo de Passageiros. Aqui é só o shape de dados mockados —
// sem persistência real (ver escopo do template no README).

export type StatusReserva =
  | "aguardando"
  | "vinculada"
  | "emitida"
  | "alterada"
  | "cancelada";

export interface ReservaVinculada {
  status: StatusReserva;
  localizador?: string;
  tarifaReservada?: number;
  tarifaAtual?: number;
  alertaTarifaAtivo: boolean;
  dataEmissao?: string;
  prazoEmissao?: string;
  ultimaReconsultaEm?: string;
  proximaReconsultaEm?: string;
}

export interface ReconsultaLog {
  consultadoEm: string;
  resultado: "ok" | "erro" | "sem_reserva";
  tarifaConsultada?: number;
}

export type TipoDocumentoNacional = "RG" | "CNH";

export interface DocumentoNacional {
  tipo: TipoDocumentoNacional;
  numero: string;
  orgaoEmissor?: string;
  ufEmissor?: string;
  cidadeEmissora?: string;
  categoriaCnh?: string;
  validade?: string;
}

export type TipoPassaporte = "regular" | "diplomatico" | "oficial" | "outro";

export interface Passaporte {
  tipo?: TipoPassaporte;
  numero: string;
  numeroControle?: string;
  paisEmissor?: string;
  cidadeEmissao?: string;
  estadoEmissao?: string;
  validade?: string;
  fotoFrente?: string;
  fotoVerso?: string;
}

export interface Visto {
  pais: string;
  tipo: "turismo" | "trabalho" | "transito" | "estudante" | "outro";
  numero: string;
  dataEmissao?: string;
  validade?: string;
  foto?: string;
}

export interface Endereco {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  paisResidencia?: string;
}

export interface Passageiro {
  id: string;
  cpf: string;
  nomeCompleto: string;
  dataNascimento?: string;
  telefoneWhatsapp?: string;
  grupoId?: string;
  titularId?: string; // presente = é dependente
  clienteId?: string;
  endereco?: Endereco;
  documento?: DocumentoNacional;
  passaporte?: Passaporte;
  vistos?: Visto[];
  reserva?: ReservaVinculada;
  reconsultas?: ReconsultaLog[];
}

export interface GrupoExcursao {
  id: string;
  nome: string;
  destino: string;
  dataViagem: string;
  responsavel?: string;
}

export type EstagioFunil = "lead" | "orcamento" | "negociacao" | "ganho" | "perdido";

export interface Cliente {
  id: string;
  nomeRazaoSocial: string;
  tipoPessoa: "PF" | "PJ";
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  canalAquisicao?: string;
  responsavelComercial?: string;
  status: "ativo" | "inativo";
}

export interface NegocioFunil {
  id: string;
  clienteId: string;
  clienteNome: string;
  telefone?: string;
  estagio: EstagioFunil;
  interesse: string;
  valorEstimado: number;
  responsavel: string;
  origemSuri: boolean;
}

export interface EventoEmbarque {
  id: string;
  passageiroNome: string;
  data: string; // ISO yyyy-mm-dd
  hora: string; // 24h HH:mm
  destino: string;
}

export interface EventoIntegracaoSuri {
  id: string;
  tipo: "novo_contato" | "troca_de_fila" | "finalizacao_atendimento" | "mensagem_recebida";
  recebidoEm: string;
  resumo: string;
}

export interface MensagemChat {
  id: string;
  direcao: "in" | "out";
  texto: string;
  horario: string; // HH:mm, 24h
  data: string; // rótulo do separador de dia
}
