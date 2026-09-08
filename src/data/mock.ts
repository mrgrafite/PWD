import type {
  Passageiro,
  NegocioFunil,
  EventoEmbarque,
  EventoIntegracaoSuri,
  MensagemChat,
  Cliente,
  GrupoExcursao,
} from "../types";

// Dados fixos em memória — reaproveita os mesmos nomes/casos do mockup
// "PWD Passageiro" para manter a demonstração consistente entre o
// protótipo visual e este template de código.

export const clientes: Cliente[] = [
  { id: "c1", nomeRazaoSocial: "Turismo Horizonte Ltda", tipoPessoa: "PJ", status: "ativo" },
  { id: "c2", nomeRazaoSocial: "Marina Salgado Rocha", tipoPessoa: "PF", status: "ativo" },
  { id: "c3", nomeRazaoSocial: "Juliana Prado", tipoPessoa: "PF", status: "ativo" },
];

export const grupos: GrupoExcursao[] = [
  { id: "g1", nome: "Excursão Lisboa", destino: "Lisboa", dataViagem: "2026-11-02", responsavel: "Marcelo Santos" },
];

export const passageiros: Passageiro[] = [
  {
    id: "p1",
    cpf: "123.456.789-00",
    nomeCompleto: "Marina Salgado Rocha",
    dataNascimento: "1988-04-12",
    telefoneWhatsapp: "+55 11 98888-1122",
    endereco: {
      cep: "01311-000",
      logradouro: "Av. Paulista",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      paisResidencia: "Brasil",
    },
    documento: { tipo: "RG", numero: "44.556.667-8", orgaoEmissor: "SSP", ufEmissor: "SP", cidadeEmissora: "São Paulo" },
    reserva: {
      status: "vinculada",
      localizador: "PJZHQE",
      tarifaReservada: 1240.5,
      tarifaAtual: 1180.0,
      alertaTarifaAtivo: true,
      dataEmissao: undefined,
      prazoEmissao: "2026-09-15",
      ultimaReconsultaEm: "08/09/2026 09:12",
      proximaReconsultaEm: "08/09/2026 10:12",
    },
    reconsultas: [
      { consultadoEm: "08/09/2026 09:12", resultado: "ok", tarifaConsultada: 1180.0 },
      { consultadoEm: "08/09/2026 08:12", resultado: "ok", tarifaConsultada: 1210.0 },
      { consultadoEm: "08/09/2026 07:12", resultado: "ok", tarifaConsultada: 1240.5 },
    ],
  },
  {
    id: "p2",
    cpf: "987.654.321-00",
    nomeCompleto: "Juliana Prado",
    dataNascimento: "1994-11-02",
    telefoneWhatsapp: "+55 21 97777-4433",
    reserva: {
      status: "aguardando",
      alertaTarifaAtivo: false,
      ultimaReconsultaEm: "08/09/2026 09:00",
      proximaReconsultaEm: "08/09/2026 10:00",
    },
    reconsultas: [{ consultadoEm: "08/09/2026 09:00", resultado: "sem_reserva" }],
  },
];

export const funil: NegocioFunil[] = [
  {
    id: "f1",
    clienteId: "c1",
    clienteNome: "Ricardo Alves Pereira",
    telefone: "+55 11 98765-2231",
    estagio: "lead",
    interesse: "Cancún, pacote tudo incluso",
    valorEstimado: 8200,
    responsavel: "Marcelo Santos",
    origemSuri: true,
  },
  {
    id: "f2",
    clienteId: "c2",
    clienteNome: "Marina Salgado Rocha",
    telefone: "+55 11 98888-1122",
    estagio: "negociacao",
    interesse: "Excursão em grupo — Lisboa",
    valorEstimado: 4300,
    responsavel: "Marcelo Santos",
    origemSuri: false,
  },
  {
    id: "f3",
    clienteId: "c3",
    clienteNome: "Juliana Prado",
    telefone: "+55 21 97777-4433",
    estagio: "orcamento",
    interesse: "GRU ↔ RIO, a negócio",
    valorEstimado: 1180,
    responsavel: "Marcelo Santos",
    origemSuri: false,
  },
  {
    id: "f4",
    clienteId: "c4",
    clienteNome: "Grupo Excursão Lisboa",
    telefone: "+55 11 99222-6610",
    estagio: "ganho",
    interesse: "Excursão em grupo — Lisboa, 2 nov.",
    valorEstimado: 32000,
    responsavel: "Marcelo Santos",
    origemSuri: false,
  },
];

export const eventosEmbarque: EventoEmbarque[] = [
  { id: "e1", passageiroNome: "Marina Salgado Rocha", data: "2026-09-12", hora: "08:40", destino: "GRU → LIS" },
  { id: "e2", passageiroNome: "Juliana Prado", data: "2026-09-18", hora: "14:15", destino: "GRU ↔ RIO" },
  { id: "e3", passageiroNome: "Excursão Lisboa (18 pax)", data: "2026-11-02", hora: "22:10", destino: "GRU → LIS" },
];

export const eventosSuri: EventoIntegracaoSuri[] = [
  { id: "s1", tipo: "novo_contato", recebidoEm: "08/09/2026 09:05", contato: "+55 11 98765-2231", resultado: "Lead criado", resultadoTipo: "ok" },
  { id: "s2", tipo: "finalizacao_atendimento", recebidoEm: "07/09/2026 18:40", contato: "Ricardo Alves Pereira", resultado: "Nota registrada", resultadoTipo: "flat" },
  { id: "s3", tipo: "novo_contato", recebidoEm: "07/09/2026 14:07", contato: "+55 11 98888-1122", resultado: "Lead criado", resultadoTipo: "ok" },
];

// Status estático do card da Suri na Tela 5 — quando houver persistência
// real isso vem do próprio registro de conexão, não de dados fixos.
export const suriStatus = {
  conectadoDesde: "03/09/2026",
  ultimoEventoEm: "hoje, 09:12",
};

export const chatRicardo: MensagemChat[] = [
  { id: "m1", direcao: "in", texto: "Oi! Vi o pacote de Cancún de vocês, ainda tem vaga pra outubro?", horario: "14:02", data: "sexta-feira, 5 de setembro de 2026" },
  { id: "m2", direcao: "out", texto: "Oi Ricardo! Temos sim :) Vai ser só pra você ou mais alguém?", horario: "14:05", data: "sexta-feira, 5 de setembro de 2026" },
  { id: "m3", direcao: "in", texto: "2 adultos", horario: "14:07", data: "sexta-feira, 5 de setembro de 2026" },
  { id: "m4", direcao: "in", texto: "Bom dia! Podemos fechar o pacote que você me passou?", horario: "09:05", data: "hoje, 8 de setembro de 2026" },
  { id: "m5", direcao: "out", texto: "Bom dia, Ricardo! Combinado, vou preparar o orçamento final e te mando por aqui mesmo.", horario: "09:12", data: "hoje, 8 de setembro de 2026" },
];

// Thread de chat por negócio do funil — hoje só "f1" (Ricardo) tem conversa
// mockada; os demais negócios abrem sem histórico (chat vazio) em vez de
// reaproveitar a conversa de outro cliente.
export const chatsPorNegocio: Record<string, MensagemChat[]> = {
  f1: chatRicardo,
};
