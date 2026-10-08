// ===== 0. Verificação: o arquivo de dados foi carregado? =====
// Se data/mockData.js não for encontrado, mostra um erro claro em vez de falhar em silêncio.
if (typeof DADOS_MOCK === 'undefined') {
  const aviso = document.createElement('div');
  aviso.setAttribute('role', 'alert');
  aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:30;padding:16px;text-align:center;font-size:1.3rem;font-weight:700;background:#d64545;color:#fff;';
  aviso.textContent = 'Erro: o arquivo data/mockData.js não foi encontrado. A pasta "data" precisa ficar ao lado do index.html.';
  document.body.prepend(aviso);
  window.DADOS_MOCK = {
    cartao: {}, extrato: [], quantidadesPasses: [], formasPagamento: [], cenarios: [],
    estados: { 'erro-comunicacao': { icone: '!', tipo: 'erro', permiteRepetir: false,
      titulo: 'Dados não encontrados',
      mensagem: 'O arquivo data/mockData.js não foi carregado. Confira se a pasta "data" está ao lado do index.html.' } }
  };
}

// ===== 1. Referências aos elementos da página =====
const telas = document.querySelectorAll('.tela');
const barraNav = document.getElementById('barra-nav');
const botaoVoltar = document.getElementById('botao-voltar');
const botaoCancelar = document.getElementById('botao-cancelar');
const confirmacao = document.getElementById('confirmacao');
const botaoSim = document.getElementById('botao-sim');
const botaoNao = document.getElementById('botao-nao');
const telaInicial = document.getElementById('tela-inicial');
const avisoInatividade = document.getElementById('aviso-inatividade');
const botaoContinuar = document.getElementById('botao-continuar');
const contagemRegressiva = document.getElementById('contagem-regressiva');

// ===== 2. Estruturas Globais de Controle (Histórico de Navegação e Estado) =====
let historicoTelas = [];
let telaAtual = 'tela-inicial';

const EstadoTotem = {
  modoVozAtivo: false,
  usuarioAutenticado: false,
  cartaoDetectado: null,
  saldoAtual: 0,
  cenario: 'normal',        // situação escolhida no simulador (só demonstração)
  quantidadePasses: null,   // passes escolhidos na recarga simulada
  formaPagamento: null,     // Pix, crédito ou débito (simulado)
  numeroDigitado: '',       // número do cartão de transporte digitado no teclado
  acaoBloqueio: null,       // "Bloquear cartão" ou "Cancelar cartão" (simulado)
  limparSessao() {
    this.modoVozAtivo = false;
    this.usuarioAutenticado = false;
    this.cartaoDetectado = null;
    this.saldoAtual = 0;
    this.cenario = 'normal';
    this.quantidadePasses = null;
    this.formaPagamento = null;
    this.numeroDigitado = '';
    this.acaoBloqueio = null;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

// ===== 3. Função central: mostra uma tela e esconde as outras =====
function mostrarTela(idDaTela, salvarNoHistorico = true) {
  if (salvarNoHistorico && telaAtual !== idDaTela) {
    historicoTelas.push(telaAtual);
  }

  telaAtual = idDaTela;

  telas.forEach(function (tela) {
    tela.classList.toggle('ativa', tela.id === idDaTela);
  });

  atualizarBarra(idDaTela);

  // Algumas telas precisam ser "zeradas" toda vez que são abertas
  if (ENTRADAS_DE_TELA[idDaTela]) ENTRADAS_DE_TELA[idDaTela]();

  // Leva o foco ao título da nova tela (ajuda leitores de tela e teclado)
  const titulo = document.querySelector(`#${idDaTela} h2`);
  if (titulo) titulo.focus();

  // Executa rotinas de narração por voz (Acessibilidade)
  if (EstadoTotem.modoVozAtivo || idDaTela === 'tela-ajuda') {
    gerenciarNarracaoPorTela(idDaTela);
  }

  reiniciarTemporizador();
}

// ===== 4. Decide o que a barra de navegação mostra =====
function atualizarBarra(idDaTela) {
  const naInicial = idDaTela === 'tela-inicial';
  const noMenu = idDaTela === 'menu-principal';

  barraNav.classList.toggle('oculta', naInicial);     // some na tela inicial
  botaoVoltar.classList.toggle('invisivel', noMenu);  // Voltar não faz sentido no menu
}

// ===== 5. Navegação Lógica e Histórico =====
function abrirTela(idDaTela) {
  mostrarTela(idDaTela, true);
}

function voltar() {
  if (historicoTelas.length > 0) {
    const telaAnterior = historicoTelas.pop();
    mostrarTela(telaAnterior, false);
  } else {
    mostrarTela('menu-principal', false);
  }
}

function abrirFuncionalidadeCartao(idDaFuncionalidade) {
  mostrarTela(idDaFuncionalidade, true);
}

// Volta ao menu "Cartões" descartando do histórico o que veio depois dele
function irParaMenuCartoes() {
  const posicao = historicoTelas.lastIndexOf('tela-cartoes');
  if (posicao >= 0) historicoTelas.length = posicao;
  mostrarTela('tela-cartoes', false);
}

// ===== 6. Cancelamento do atendimento =====
function abrirConfirmacaoCancelamento() {
  confirmacao.classList.remove('oculta');
  botaoNao.focus();
}

function fecharConfirmacaoCancelamento() {
  confirmacao.classList.add('oculta');
}

function cancelarAtendimento() {
  fecharConfirmacaoCancelamento();
  EstadoTotem.limparSessao();
  historicoTelas = [];
  mostrarTela('tela-inicial', false);
}

// ===== 7. Sistema de Acessibilidade (Áudio e Motores de Voz) =====
const sintetizador = window.speechSynthesis;

function totemFalar(texto) {
  if (!window.speechSynthesis) return;
  sintetizador.cancel();

  const locucao = new SpeechSynthesisUtterance(texto);
  locucao.lang = 'pt-BR';
  locucao.rate = 1.1;

  sintetizador.speak(locucao);
}

function emitirFeedbackSonoro() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const contextoAudio = new AudioContext();
  const oscilador = contextoAudio.createOscillator();
  const ganho = contextoAudio.createGain();

  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(600, contextoAudio.currentTime);
  ganho.gain.setValueAtTime(0.08, contextoAudio.currentTime);

  oscilador.connect(ganho);
  ganho.connect(contextoAudio.destination);

  oscilador.start();
  oscilador.stop(contextoAudio.currentTime + 0.08);
}

function ativarModoAudio(tipoSaida) {
  EstadoTotem.modoVozAtivo = true;
  emitirFeedbackSonoro();

  if (tipoSaida === 'altofalante') {
    totemFalar("Modo Alto-falante ativado. O totem começará a narrar as opções.");
  } else if (tipoSaida === 'p2') {
    totemFalar("Entrada P2 selecionada. Por favor, conecte seu fone na entrada abaixo do teclado de metal.");
  }
}

function gerenciarNarracaoPorTela(idDaTela) {
  if (idDaTela === 'tela-ajuda') {
    totemFalar("Menu de acessibilidade. Selecione: alto-falante, bluetooth ou entrada P2.");
  } else if (idDaTela === 'tela-acessibilidade-bluetooth') {
    totemFalar("Tela de conexão Bluetooth. Toque ou pressione o botão central para buscar o seu fone sem fio.");
  } else if (idDaTela === 'tela-acessibilidade-altofalante') {
    totemFalar("Alto-falante ativo. Pressione voltar para navegar pelo menu.");
  } else if (idDaTela === 'tela-acessibilidade-p2') {
    totemFalar("Entrada de fone ativa. Aguardando conexão do plugue.");
  } else if (idDaTela === 'menu-principal') {
    totemFalar("Menu principal. Opções disponíveis: Transporte, Cartões, Mapas e rotas, Ajuda e acessibilidade.");
  } else if (idDaTela === 'tela-transporte') {
    totemFalar("Menu de transporte. Selecione a opção: Consultar ônibus.");
  } else {
    // Telas da seção Cartões: lê o aviso de demonstração, o título e o texto de apoio
    const tela = document.getElementById(idDaTela);
    const prefixo = tela.classList.contains('secao-cartoes') ? 'Modo demonstração. Informações fictícias. ' : '';
    const titulo = tela.querySelector('h2');
    const apoio = tela.querySelector('.texto-info');
    if (titulo) totemFalar(prefixo + titulo.textContent + '. ' + (apoio ? apoio.textContent : ''));
  }
}

// ===== 8. Seção Cartões: funções de apoio =====
const formatarMoeda = (valor) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// "1 passe" ou "5 passes"
const textoPasses = (n) => `${n} ${n === 1 ? 'passe' : 'passes'}`;

// Cria um elemento HTML com classe e texto (textContent evita injetar HTML)
function el(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Monta um painel com o selo "DADOS FICTÍCIOS" e pares [rótulo, valor, destaque?]
function montarPainel(destino, linhas) {
  const lista = el('dl');
  linhas.forEach(function ([rotulo, valor, destaque]) {
    const linha = el('div', 'linha-painel' + (destaque ? ' destaque' : ''));
    linha.append(el('dt', null, rotulo), el('dd', null, valor));
    lista.append(linha);
  });
  destino.replaceChildren(el('p', 'selo', 'DADOS FICTÍCIOS'), lista);
}

// Preenche uma lista do extrato; "titulo" decide o texto principal de cada linha
function preencherExtrato(idDaLista, itens, titulo) {
  document.getElementById(idDaLista).replaceChildren(...itens.map(function (mov) {
    const item = el('li', 'item-extrato');
    const textos = el('div');
    textos.append(el('strong', null, titulo(mov)), el('span', 'data-extrato', mov.rotuloData));
    const valor = el('div', 'valor-extrato');
    valor.append(el('span', null, (mov.valor >= 0 ? '+ ' : '- ') + formatarMoeda(Math.abs(mov.valor))));
    item.append(textos, valor);
    return item;
  }));
}

// Desenha um QR Code FICTÍCIO (só visual): três quadrados de canto + módulos aleatórios.
// Não contém dados de pagamento e não deve ser lido por aplicativos.
function desenharQrFicticio(destino, semente) {
  const NS = 'http://www.w3.org/2000/svg';
  const N = 25, MARGEM = 2;
  let estado = semente % 2147483646 + 1;                       // gerador pseudoaleatório simples
  const aleatorio = () => (estado = (estado * 16807) % 2147483647) / 2147483647;
  const cantos = [[0, 0], [N - 7, 0], [0, N - 7]];

  function modulo(x, y) {
    for (const [cx, cy] of cantos) {
      const dx = x - cx, dy = y - cy;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {         // área do quadrado de canto + respiro
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
        const borda = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const centro = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return borda || centro;
      }
    }
    return aleatorio() > 0.5;
  }

  const tamanho = N + MARGEM * 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${tamanho} ${tamanho}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR Code fictício de demonstração');
  svg.setAttribute('shape-rendering', 'crispEdges');
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!modulo(x, y)) continue;
      const quadrado = document.createElementNS(NS, 'rect');
      quadrado.setAttribute('x', x + MARGEM);
      quadrado.setAttribute('y', y + MARGEM);
      quadrado.setAttribute('width', 1);
      quadrado.setAttribute('height', 1);
      quadrado.setAttribute('fill', '#14202e');
      svg.append(quadrado);
    }
  }
  destino.replaceChildren(svg);
}

// Mostra uma etapa de uma tela e esconde as demais etapas dessa mesma tela
function mostrarEtapa(idDaTela, nomeDaEtapa) {
  const tela = document.getElementById(idDaTela);
  tela.querySelectorAll('[data-etapa]').forEach(function (etapa) {
    etapa.classList.toggle('oculta', etapa.dataset.etapa !== nomeDaEtapa);
  });
  const titulo = tela.querySelector(`[data-etapa="${nomeDaEtapa}"] h3`);
  if (titulo) titulo.focus();
}

// Preenche o simulador de situações com os botões definidos no mockData.js
function renderizarCenarios() {
  const lista = document.getElementById('lista-cenarios');
  DADOS_MOCK.cenarios.forEach(function (cenario) {
    const botao = el('button', 'chip', cenario.rotulo);
    botao.dataset.cenario = cenario.id;
    lista.append(botao);
  });
  atualizarBotoesCenario();
}

function atualizarBotoesCenario() {
  document.querySelectorAll('[data-cenario]').forEach(function (botao) {
    botao.setAttribute('aria-pressed', String(botao.dataset.cenario === EstadoTotem.cenario));
  });
}

// Tela única que mostra qualquer estado demonstrativo (erro, bloqueio, etc.)
function mostrarEstado(codigo) {
  const estado = DADOS_MOCK.estados[codigo] || DADOS_MOCK.estados['erro-comunicacao'];
  document.getElementById('tela-estado').dataset.tipo = estado.tipo;
  document.getElementById('estado-icone').textContent = estado.icone;
  document.getElementById('estado-titulo').textContent = estado.titulo;
  document.getElementById('estado-mensagem').textContent = estado.mensagem;
  document.getElementById('estado-repetir').classList.toggle('oculta', !estado.permiteRepetir);
  abrirTela('tela-estado');
}

// O que cada tela precisa fazer ao ser aberta (voltar ao começo do fluxo)
const ENTRADAS_DE_TELA = {
  'tela-cartoes': atualizarBotoesCenario,
  'tela-saldo':   () => mostrarEtapa('tela-saldo', 'aproximar'),
  'tela-extrato': () => mostrarEtapa('tela-extrato', 'aproximar'),
  'tela-recarga': () => { EstadoTotem.quantidadePasses = null; EstadoTotem.formaPagamento = null; mostrarEtapa('tela-recarga', 'identificar'); },
  'tela-bloqueio': () => { EstadoTotem.acaoBloqueio = null; mostrarEtapa('tela-bloqueio', 'identificar'); }
};

// ===== 9. CAMADA DE DADOS DOS CARTÕES =====
// >>> ÚNICO PONTO a trocar quando existir uma API oficial. <<<
// O resto do código só chama ServicoCartoes e não sabe de onde vêm os dados.
// Hoje cada função lê o DADOS_MOCK. No futuro, cada uma fará um fetch().
class ErroCartao extends Error {
  constructor(codigo) { super(codigo); this.codigo = codigo; }
}

// Só demonstração: dispara o erro escolhido no simulador.
// Com uma API real, estes erros viriam da resposta do servidor e esta função some.
function simularCenario(contexto) {
  const cenario = EstadoTotem.cenario;
  const falhasNaIdentificacao = ['nao-identificado', 'bloqueado', 'erro-comunicacao'];
  if (contexto === 'identificacao' && falhasNaIdentificacao.includes(cenario)) throw new ErroCartao(cenario);
  if (contexto === 'recarga' && cenario === 'recarga-pendente') throw new ErroCartao(cenario);
}

const ServicoCartoes = {
  async identificarCartao(numero) {              // futuro: leitura do cartão ou GET /cartoes/{numero}
    simularCenario('identificacao');
    if (numero !== undefined && numero !== DADOS_MOCK.cartao.numero) throw new ErroCartao('nao-identificado');
    const { saldo, ...identificacao } = DADOS_MOCK.cartao;  // identificação SEM o saldo
    return identificacao;
  },
  async consultarSaldo() {                       // futuro: GET /cartoes/{id}/saldo
    return DADOS_MOCK.cartao.saldo;
  },
  async consultarExtrato() {                     // futuro: GET /cartoes/{id}/extrato
    return DADOS_MOCK.extrato;
  },
  async listarQuantidadesPasses() {              // futuro: GET /recargas/opcoes
    return { quantidades: DADOS_MOCK.quantidadesPasses, valorPasse: DADOS_MOCK.valorPasse };
  },
  async listarFormasPagamento() {                // futuro: GET /recargas/formas-pagamento
    return DADOS_MOCK.formasPagamento;
  },
  async simularRecarga(quantidade, formaPagamento) {  // futuro: POST /recargas (com pagamento real)
    simularCenario('recarga');
    const valorTotal = Math.round(quantidade * DADOS_MOCK.valorPasse * 100) / 100;
    return { status: 'simulado', quantidade, formaPagamento, valorTotal };
  },
  async simularBloqueio(tipo) {                  // futuro: POST /cartoes/{id}/bloqueio (autenticado)
    return { status: 'simulado', tipo };
  }
};

// Roda uma tarefa e transforma qualquer erro em uma tela de estado clara
async function executar(tarefa) {
  try {
    await tarefa();
  } catch (erro) {
    if (!(erro instanceof ErroCartao)) console.error(erro);
    mostrarEstado(erro instanceof ErroCartao ? erro.codigo : 'erro-comunicacao');
  }
}

// Sem argumento = cartão aproximado; com argumento = número digitado
async function identificarEGuardar(numero) {
  const cartao = await ServicoCartoes.identificarCartao(numero);
  EstadoTotem.cartaoDetectado = cartao;
  return cartao;
}

// ===== 10a. O que acontece DEPOIS de identificar o cartão (aproximado ou digitado) =====
async function continuarSaldo() {
  const cartao = EstadoTotem.cartaoDetectado;
  EstadoTotem.saldoAtual = await ServicoCartoes.consultarSaldo();   // só agora o saldo é lido
  montarPainel(document.getElementById('saldo-resultado'), [
    ['Cartão', cartao.nome],
    ['Número do cartão', cartao.numero],
    ['Titular', cartao.titular],
    ['Tipo', cartao.tipo],
    ['Status', cartao.status],
    ['Saldo', formatarMoeda(EstadoTotem.saldoAtual), true]
  ]);
  mostrarEtapa('tela-saldo', 'resultado');
}

async function continuarExtrato() {
  const movimentacoes = await ServicoCartoes.consultarExtrato();
  preencherExtrato('lista-utilizacoes', movimentacoes.filter((m) => m.tipo === 'utilizacao'),
    (m) => m.onibus);                       // utilizações mostram o ônibus usado
  preencherExtrato('lista-recargas', movimentacoes.filter((m) => m.tipo === 'recarga'),
    (m) => m.descricao);
  mostrarEtapa('tela-extrato', 'resultado');
}

async function continuarRecarga() {
  const opcoes = await ServicoCartoes.listarQuantidadesPasses();
  const formas = await ServicoCartoes.listarFormasPagamento();
  EstadoTotem.valorPasse = opcoes.valorPasse;
  EstadoTotem.formas = formas;
  document.getElementById('lista-valores').replaceChildren(...opcoes.quantidades.map(function (quantidade) {
    const botao = el('button', 'cartao');
    botao.dataset.acao = 'recarga-escolher';
    botao.dataset.quantidade = quantidade;
    botao.append(el('span', 'cartao-name', textoPasses(quantidade)));
    return botao;
  }));
  document.getElementById('lista-pagamento').replaceChildren(...formas.map(function (forma) {
    const botao = el('button', 'cartao');
    botao.dataset.acao = 'recarga-pagamento';
    botao.dataset.forma = forma.id;
    botao.append(el('span', 'cartao-name', forma.rotulo));
    return botao;
  }));
  mostrarEtapa('tela-recarga', 'valor');
}

function continuarBloqueio() {
  mostrarEtapa('tela-bloqueio', 'acao');
}

// Para cada tela com identificação: etapa inicial e o que fazer depois de identificar
const IDENTIFICACAO = {
  'tela-saldo':    { etapaInicial: 'aproximar',  continuar: continuarSaldo },
  'tela-extrato':  { etapaInicial: 'aproximar',  continuar: continuarExtrato },
  'tela-recarga':  { etapaInicial: 'identificar', continuar: continuarRecarga },
  'tela-bloqueio': { etapaInicial: 'identificar', continuar: continuarBloqueio }
};

// Teclado numérico na tela: monta os botões dentro de cada [data-teclado]
function montarTeclados() {
  function tecla(rotulo, acao, classeExtra, valor) {
    const botao = el('button', 'tecla' + (classeExtra ? ' ' + classeExtra : ''), rotulo);
    botao.dataset.acao = acao;
    if (valor !== undefined) botao.dataset.tecla = valor;
    return botao;
  }
  document.querySelectorAll('[data-teclado]').forEach(function (area) {
    const visor = el('output', 'visor-numero');
    visor.dataset.placeholder = 'Número do cartão';
    visor.setAttribute('aria-label', 'Número do cartão digitado');
    const erro = el('p', 'erro-campo');
    erro.setAttribute('role', 'alert');
    const grade = el('div', 'teclado-numerico');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((n) => grade.append(tecla(n, 'tecla', '', n)));
    grade.append(tecla('Apagar', 'tecla-apagar', 'tecla-apagar'), tecla('0', 'tecla', '', '0'),
                 tecla('Confirmar', 'tecla-confirmar', 'tecla-confirmar'));
    area.replaceChildren(visor, erro, grade);
  });
}

function atualizarVisor() {
  document.querySelector(`#${telaAtual} .visor-numero`).textContent = EstadoTotem.numeroDigitado;
  document.querySelector(`#${telaAtual} .erro-campo`).textContent = '';
}

// ===== 10. Seção Cartões: ações dos botões (data-acao="...") =====
const ACOES = {
  'saldo-aproximar':   () => executar(async () => { await identificarEGuardar(); await continuarSaldo(); }),
  'extrato-aproximar': () => executar(async () => { await identificarEGuardar(); await continuarExtrato(); }),
  'recarga-aproximar': () => executar(async () => { await identificarEGuardar(); await continuarRecarga(); }),
  'bloqueio-aproximar': () => executar(async () => { await identificarEGuardar(); continuarBloqueio(); }),

  // --- Digitar o número do cartão (alternativa a "Aproximar cartão") ---
  'identificar-digitando': () => {
    EstadoTotem.numeroDigitado = '';
    atualizarVisor();
    mostrarEtapa(telaAtual, 'digitar');
  },
  'voltar-identificacao': () => mostrarEtapa(telaAtual, IDENTIFICACAO[telaAtual].etapaInicial),
  'tecla': (botao) => {
    if (EstadoTotem.numeroDigitado.length < 16) EstadoTotem.numeroDigitado += botao.dataset.tecla;
    atualizarVisor();
  },
  'tecla-apagar': () => {
    EstadoTotem.numeroDigitado = EstadoTotem.numeroDigitado.slice(0, -1);
    atualizarVisor();
  },
  'tecla-confirmar': () => {
    if (!EstadoTotem.numeroDigitado) {
      document.querySelector(`#${telaAtual} .erro-campo`).textContent = 'Digite o número do cartão.';
      return;
    }
    const continuar = IDENTIFICACAO[telaAtual].continuar;
    executar(async () => {
      await identificarEGuardar(EstadoTotem.numeroDigitado);
      await continuar();
    });
  },

  'recarga-escolher': (botao) => {
    EstadoTotem.quantidadePasses = Number(botao.dataset.quantidade);
    mostrarEtapa('tela-recarga', 'pagamento');
  },

  'recarga-pagamento': (botao) => {
    EstadoTotem.formaPagamento = EstadoTotem.formas.find((f) => f.id === botao.dataset.forma);
    const total = EstadoTotem.quantidadePasses * EstadoTotem.valorPasse;
    montarPainel(document.getElementById('recarga-resumo'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Quantidade', textoPasses(EstadoTotem.quantidadePasses)],
      ['Forma de pagamento', EstadoTotem.formaPagamento.rotulo],
      ['Valor final', formatarMoeda(total), true]
    ]);
    mostrarEtapa('tela-recarga', 'confirmar');
  },

  'recarga-trocar-pagamento': () => mostrarEtapa('tela-recarga', 'pagamento'),

  // Depois de confirmar, o caminho depende da forma de pagamento
  'recarga-confirmar': () => {
    const total = EstadoTotem.quantidadePasses * EstadoTotem.valorPasse;
    const forma = EstadoTotem.formaPagamento;
    if (forma.id === 'pix') {
      desenharQrFicticio(document.getElementById('qr-ficticio'), Math.round(total * 100) + 1);
      document.getElementById('pix-valor').textContent = 'Valor a pagar: ' + formatarMoeda(total);
      mostrarEtapa('tela-recarga', 'pix');
    } else {
      document.getElementById('cartao-instrucao').textContent =
        `Aproxime o seu ${forma.rotulo.toLowerCase()} da leitora do totem para pagar ${formatarMoeda(total)}.`;
      mostrarEtapa('tela-recarga', 'cartao');
    }
  },

  'recarga-finalizar': () => executar(async function () {
    const resultado = await ServicoCartoes.simularRecarga(EstadoTotem.quantidadePasses, EstadoTotem.formaPagamento.rotulo);
    montarPainel(document.getElementById('recarga-resultado'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Quantidade', textoPasses(resultado.quantidade)],
      ['Forma de pagamento', resultado.formaPagamento],
      ['Valor final', formatarMoeda(resultado.valorTotal), true]
    ]);
    mostrarEtapa('tela-recarga', 'resultado');
  }),

  'bloqueio-escolher': (botao) => {
    EstadoTotem.acaoBloqueio = botao.dataset.tipo;
    montarPainel(document.getElementById('bloqueio-resumo'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Ação de exemplo', EstadoTotem.acaoBloqueio, true]
    ]);
    mostrarEtapa('tela-bloqueio', 'confirmar');
  },

  'bloqueio-confirmar': () => executar(async function () {
    const resultado = await ServicoCartoes.simularBloqueio(EstadoTotem.acaoBloqueio);
    montarPainel(document.getElementById('bloqueio-resultado'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Ação simulada', resultado.tipo],
      ['Status do cartão', 'Inalterado (exemplo de interface)', true]
    ]);
    mostrarEtapa('tela-bloqueio', 'resultado');
  }),

  'cancelar-operacao': () => mostrarEstado('operacao-cancelada'),
  'estado-repetir': () => voltar(),
  'estado-menu': () => irParaMenuCartoes()
};

// ===== 11. Delegação de Eventos Otimizada (Cliques Globais e Interceptações) =====
document.addEventListener('click', function (evento) {
  if (EstadoTotem.modoVozAtivo) {
    emitirFeedbackSonoro();
  }

  const botaoAbrir = evento.target.closest('[data-abrir]');
  if (botaoAbrir) {
    const proximaTela = botaoAbrir.dataset.abrir;

    if (proximaTela === 'tela-acessibilidade-altofalante') {
      ativarModoAudio('altofalante');
    } else if (proximaTela === 'tela-acessibilidade-p2') {
      ativarModoAudio('p2');
    }

    abrirTela(proximaTela);

    if (EstadoTotem.modoVozAtivo) {
      const nomeBotao = botaoAbrir.querySelector('.cartao-name')?.textContent || botaoAbrir.textContent;
      totemFalar(`Abrindo: ${nomeBotao}`);
    }
    return;
  }

  const botaoFunc = evento.target.closest('[data-funcionalidade]');
  if (botaoFunc) {
    abrirFuncionalidadeCartao(botaoFunc.dataset.funcionalidade);
    if (EstadoTotem.modoVozAtivo) {
      const nomeFunc = botaoFunc.querySelector('.cartao-name')?.textContent || botaoFunc.textContent;
      totemFalar(`Funcionalidade: ${nomeFunc}`);
    }
    return;
  }

  const botaoAcao = evento.target.closest('[data-acao]');
  if (botaoAcao) {
    const acao = ACOES[botaoAcao.dataset.acao];
    if (acao) acao(botaoAcao);
    return;
  }

  const botaoCenario = evento.target.closest('[data-cenario]');
  if (botaoCenario) {
    EstadoTotem.cenario = botaoCenario.dataset.cenario;
    atualizarBotoesCenario();
    return;
  }
});

botaoVoltar.addEventListener('click', voltar);
botaoCancelar.addEventListener('click', abrirConfirmacaoCancelamento);
botaoSim.addEventListener('click', cancelarAtendimento);
botaoNao.addEventListener('click', fecharConfirmacaoCancelamento);

telaInicial.addEventListener('click', function () {
  abrirTela('menu-principal');
});

// ===== 12. Suporte a Botões Físicos / Teclado Metálico e Braille =====
document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') {
    fecharConfirmacaoCancelamento();
  }
  // Teclado físico: digita o número do cartão quando o teclado da tela está aberto
  if (document.querySelector(`#${telaAtual} [data-etapa="digitar"]:not(.oculta)`)) {
    if (/^\d$/.test(evento.key)) ACOES['tecla']({ dataset: { tecla: evento.key } });
    else if (evento.key === 'Backspace') ACOES['tecla-apagar']();
    else if (evento.key === 'Enter' && !(evento.target.closest && evento.target.closest('button'))) ACOES['tecla-confirmar']();
  }
  if (telaAtual === 'tela-inicial' && (evento.key === 'Enter' || evento.key === ' ')) {
    evento.preventDefault();
    abrirTela('menu-principal');
  }
});

// ===== 13. Temporizador de inatividade =====
// Após 60 s sem toque ou tecla, mostra um aviso. Se ninguém responder em 15 s,
// o atendimento é cancelado e o totem volta à tela inicial.
const TEMPO_INATIVIDADE_MS = 60000;
const TEMPO_AVISO_S = 15;
let temporizadorInatividade = null;
let intervaloContagem = null;

function pararTemporizadores() {
  clearTimeout(temporizadorInatividade);
  clearInterval(intervaloContagem);
}

function reiniciarTemporizador() {
  pararTemporizadores();
  avisoInatividade.classList.add('oculta');
  if (telaAtual === 'tela-inicial') return;   // na tela inicial não há atendimento a encerrar
  temporizadorInatividade = setTimeout(mostrarAvisoInatividade, TEMPO_INATIVIDADE_MS);
}

function mostrarAvisoInatividade() {
  let restante = TEMPO_AVISO_S;
  contagemRegressiva.textContent = restante;
  avisoInatividade.classList.remove('oculta');
  botaoContinuar.focus();
  if (EstadoTotem.modoVozAtivo) totemFalar('Você ainda está aí? Toque em continuar atendimento.');

  intervaloContagem = setInterval(function () {
    restante--;
    contagemRegressiva.textContent = restante;
    if (restante <= 0) cancelarAtendimento();   // cancelarAtendimento já reinicia/zera os temporizadores
  }, 1000);
}

// Qualquer toque ou tecla reinicia a contagem, exceto enquanto o aviso está aberto
['pointerdown', 'keydown'].forEach(function (tipo) {
  document.addEventListener(tipo, function () {
    if (avisoInatividade.classList.contains('oculta')) reiniciarTemporizador();
  }, true);
});
botaoContinuar.addEventListener('click', reiniciarTemporizador);

// ===== 14. Mapeamento da API Web Bluetooth =====
const btnBluetooth = document.getElementById('btn-conectar-bluetooth');
const statusBluetooth = document.getElementById('status-bluetooth');

if (btnBluetooth) {
  btnBluetooth.addEventListener('click', async function () {
    if (!navigator.bluetooth) {
      statusBluetooth.classList.remove('oculta');
      statusBluetooth.textContent = "Bluetooth indisponível no navegador.";
      totemFalar("A API de Bluetooth não é suportada ou está desativada neste totem.");
      return;
    }

    statusBluetooth.classList.remove('oculta');
    statusBluetooth.textContent = "Buscando dispositivos...";
    totemFalar("Conectar fone. Buscando dispositivos disponíveis.");

    try {
      const dispositivo = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000110b-0000-1000-8000-00805f9b34fb']
      });

      statusBluetooth.textContent = `Conectado a: ${dispositivo.name}`;
      statusBluetooth.style.borderColor = "#45d645";
      EstadoTotem.modoVozAtivo = true;
      totemFalar(`Fone ${dispositivo.name} conectado com sucesso. Transmitindo instruções de voz para o fone.`);
    } catch (erro) {
      statusBluetooth.textContent = "Falha ao parear dispositivo.";
      totemFalar("Falha ou cancelamento do pareamento bluetooth.");
      console.error(erro);
    }
  });
}

// ===== 15. Simulação Completa do Fluxo de Consulta de Ônibus =====
const btnConsultarOnibus = document.getElementById('btn-consultar-onibus');
const containerConsultaOnibus = document.getElementById('container-consulta-onibus');
const feedbackVoz = document.getElementById('feedback-voz');

if (btnConsultarOnibus) {
  btnConsultarOnibus.addEventListener('click', function () {
    containerConsultaOnibus.classList.remove('oculta');
    feedbackVoz.textContent = "Totem: 'Escolha o número ou nome da linha.'";
    totemFalar("Escolha o número ou nome da linha.");

    setTimeout(() => {
      if (telaAtual === 'tela-transporte') {
        feedbackVoz.innerHTML = "Usuário selecionou: <strong>Linha 305</strong><br><br>Totem: 'Linha 305. Próximo ônibus previsto para chegar em aproximadamente 8 minutos.'";
        totemFalar("Linha 3 0 5. Próximo ônibus previsto para chegar em aproximadamente 8 minutos.");
      }
    }, 4500);
  });
}

// ===== 16. Inicialização do Sistema =====
// Preenche os textos que vêm do mockData.js (elementos com data-texto)
document.querySelectorAll('[data-texto]').forEach(function (elemento) {
  elemento.textContent = DADOS_MOCK[elemento.dataset.texto];
});

// Títulos precisam de tabindex="-1" para poderem receber foco por código
document.querySelectorAll('.tela h2, .tela h3, .modal h2').forEach(function (titulo) {
  titulo.setAttribute('tabindex', '-1');
});

renderizarCenarios();
montarTeclados();
mostrarTela('tela-inicial', false);