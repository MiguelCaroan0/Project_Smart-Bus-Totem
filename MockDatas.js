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
  dicaNumeroCartao: 'Demonstração: o número do cartão de exemplo é 123.',
  avisoSimulacaoBloqueio:
    'Esta é uma simulação de interface. Nenhum cartão será bloqueado ou cancelado.',

  // ----- Cartão demonstrativo -----
  cartao: {
    nome: 'Cartão TCGL',
    numero: '123',
    titular: 'Ana Beatriz Moraes',
    tipo: 'Cartão Usuário',
    status: 'Ativo',
    saldo: 42.5
  },

  // ----- Movimentações (valor positivo = entrada). Utilizações trazem o ônibus usado -----
  extrato: [
    { tipo: 'utilizacao', onibus: 'Ônibus 4102', rotuloData: '06/10/2026', valor: -5.0 },
    { tipo: 'utilizacao', onibus: 'Ônibus 3187', rotuloData: '03/10/2026', valor: -5.0 },
    { tipo: 'utilizacao', onibus: 'Ônibus 4102', rotuloData: '27/09/2026', valor: -5.0 },
    { tipo: 'recarga', descricao: 'Recarga de 6 passes', rotuloData: '30/09/2026', valor: 30.0 },
    { tipo: 'recarga', descricao: 'Recarga de 5 passes', rotuloData: '19/09/2026', valor: 25.0 }
  ],

  // ----- Recarga por passes: valor PROVISÓRIO de cada passe (trocar pelo oficial) -----
  valorPasse: 5.0,
  quantidadesPasses: [1, 2, 5, 10, 20, 40],

  // ----- Formas de pagamento da recarga (apenas rótulos; nada é cobrado) -----
  formasPagamento: [
    { id: 'pix',     rotulo: 'Pix' },
    { id: 'credito', rotulo: 'Cartão de crédito' },
    { id: 'debito',  rotulo: 'Cartão de débito' }
  ],

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
      mensagem: 'Não foi possível identificar o cartão. Confira o número digitado ou aproxime o cartão novamente. (Estado demonstrativo.)'
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