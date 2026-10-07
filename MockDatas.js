// =====================================================================
// data/mockData.js
// Dados de DEMONSTRAÇÃO. O nome do cartão (TCGL) é só uma referência visual;
// titular, datas, saldo e o valor do passe são inventados e NÃO são os
// oficiais. Troque-os quando houver uma fonte oficial.
//
// Este arquivo é carregado ANTES do script.js (veja o index.html) e
// cria a constante global DADOS_MOCK.
// =====================================================================

const DADOS_MOCK = Object.freeze({

  // ----- Textos fixos da demonstração -----
  avisoDemonstracao: 'MODO DEMONSTRAÇÃO — INFORMAÇÕES FICTÍCIAS',
  avisoSimulacao:
    'Esta é uma simulação de interface. Nenhum pagamento será realizado e nenhum cartão será recarregado.',
  avisoSimulacaoBloqueio:
    'Esta é uma simulação de interface. Nenhum cartão será bloqueado ou cancelado.',

  // ----- Cartão demonstrativo -----
  cartao: {
    nome: 'Cartão TCGL',
    titular: 'Ana Beatriz Moraes',
    tipo: 'Cartão Usuário',
    status: 'Ativo',
    saldo: 42.5
  },

  // ----- Movimentações de exemplo (valor positivo = entrada) -----
  extrato: [
    { descricao: 'Utilização', rotuloData: '06/10/2026', valor: -5.0 },
    { descricao: 'Utilização', rotuloData: '03/10/2026', valor: -5.0 },
    { descricao: 'Recarga',    rotuloData: '30/09/2026', valor: 30.0 },
    { descricao: 'Utilização', rotuloData: '27/09/2026', valor: -5.0 },
    { descricao: 'Recarga',    rotuloData: '19/09/2026', valor: 25.0 }
  ],

  // ----- Recarga por passes: valor PROVISÓRIO de cada passe (trocar pelo oficial) -----
  valorPasse: 5.0,
  quantidadesPasses: [1, 2, 5, 10, 20, 40],

  // ----- Situações que o simulador da tela "Cartões" pode ativar -----
  cenarios: [
    { id: 'normal',            rotulo: 'Funcionamento normal' },
    { id: 'nao-identificado',  rotulo: 'Cartão não identificado' },
    { id: 'bloqueado',         rotulo: 'Cartão bloqueado' }
  ],

  // ----- Estados demonstrativos (título, mensagem e aparência) -----
  estados: {
    'nao-identificado': {
      icone: '?', tipo: 'aviso', permiteRepetir: true,
      titulo: 'Cartão não identificado',
      mensagem: 'Não foi possível identificar o cartão. Aproxime-o novamente. (Estado demonstrativo.)'
    },
    'bloqueado': {
      icone: 'B', tipo: 'erro', permiteRepetir: false,
      titulo: 'Cartão bloqueado',
      mensagem: 'Este cartão de demonstração aparece como bloqueado. O canal de atendimento oficial ainda será definido. (Estado demonstrativo.)'
    },
    'erro-comunicacao': {
      icone: '!', tipo: 'erro', permiteRepetir: true,
      titulo: 'Erro de comunicação',
      mensagem: 'Não foi possível se comunicar com o sistema. Nenhuma operação foi realizada. Tente novamente. (Estado demonstrativo.)'
    },
    'recarga-pendente': {
      icone: 'P', tipo: 'aviso', permiteRepetir: false,
      titulo: 'Recarga pendente',
      mensagem: 'A recarga demonstrativa está pendente. Nenhum valor foi cobrado e nenhum saldo foi alterado. (Estado demonstrativo.)'
    },
    'operacao-cancelada': {
      icone: 'X', tipo: 'aviso', permiteRepetir: false,
      titulo: 'Operação cancelada',
      mensagem: 'A operação foi cancelada. Nenhuma alteração foi feita. (Estado demonstrativo.)'
    }
  }
});