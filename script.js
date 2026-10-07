// ===== 0. Verificação: o arquivo de dados foi carregado? =====
// Se data/mockData.js não for encontrado, mostra um erro claro em vez de falhar em silêncio.
if (typeof DADOS_MOCK === 'undefined') {
  const aviso = document.createElement('div');
  aviso.setAttribute('role', 'alert');
  aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:30;padding:16px;text-align:center;font-size:1.3rem;font-weight:700;background:#d64545;color:#fff;';
  aviso.textContent = 'Erro: o arquivo data/mockData.js não foi encontrado. A pasta "data" precisa ficar ao lado do index.html.';
  document.body.prepend(aviso);
  window.DADOS_MOCK = {
    cartao: {}, extrato: [], quantidadesPasses: [], cenarios: [],
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
  acaoBloqueio: null,       // "Bloquear cartão" ou "Cancelar cartão" (simulado)
  limparSessao() {
    this.modoVozAtivo = false;
    this.usuarioAutenticado = false;
    this.cartaoDetectado = null;
    this.saldoAtual = 0;
    this.cenario = 'normal';
    this.quantidadePasses = null;
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
  'tela-recarga': () => { EstadoTotem.quantidadePasses = null; mostrarEtapa('tela-recarga', 'identificar'); },
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
  async identificarCartao() {                    // futuro: leitura do cartão + GET /cartoes/identificar
    simularCenario('identificacao');
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
  async simularRecarga(quantidade) {             // futuro: POST /recargas (com pagamento real)
    simularCenario('recarga');
    const valorTotal = Math.round(quantidade * DADOS_MOCK.valorPasse * 100) / 100;
    return { status: 'simulado', quantidade, valorTotal };
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

async function identificarEGuardar() {
  const cartao = await ServicoCartoes.identificarCartao();
  EstadoTotem.cartaoDetectado = cartao;
  return cartao;
}

// ===== 10. Seção Cartões: ações dos botões (data-acao="...") =====
const ACOES = {
  'saldo-aproximar': () => executar(async function () {
    const cartao = await identificarEGuardar();
    EstadoTotem.saldoAtual = await ServicoCartoes.consultarSaldo();   // só agora o saldo é lido
    montarPainel(document.getElementById('saldo-resultado'), [
      ['Cartão', cartao.nome],
      ['Titular', cartao.titular],
      ['Tipo', cartao.tipo],
      ['Status', cartao.status],
      ['Saldo', formatarMoeda(EstadoTotem.saldoAtual), true]
    ]);
    mostrarEtapa('tela-saldo', 'resultado');
  }),

  'extrato-aproximar': () => executar(async function () {
    await identificarEGuardar();
    const movimentacoes = await ServicoCartoes.consultarExtrato();
    const lista = document.getElementById('lista-extrato');
    lista.replaceChildren(...movimentacoes.map(function (mov) {
      const item = el('li', 'item-extrato');
      const textos = el('div');
      textos.append(el('strong', null, mov.descricao), el('span', 'data-extrato', mov.rotuloData));
      const direita = el('div', 'valor-extrato');
      const sinal = mov.valor >= 0 ? '+ ' : '- ';
      direita.append(el('span', null, sinal + formatarMoeda(Math.abs(mov.valor))));
      item.append(textos, direita);
      return item;
    }));
    mostrarEtapa('tela-extrato', 'resultado');
  }),

  'recarga-aproximar': () => executar(async function () {
    await identificarEGuardar();
    const opcoes = await ServicoCartoes.listarQuantidadesPasses();
    EstadoTotem.valorPasse = opcoes.valorPasse;
    document.getElementById('lista-valores').replaceChildren(...opcoes.quantidades.map(function (quantidade) {
      const botao = el('button', 'cartao');
      botao.dataset.acao = 'recarga-escolher';
      botao.dataset.quantidade = quantidade;
      botao.append(el('span', 'cartao-name', textoPasses(quantidade)));
      return botao;
    }));
    mostrarEtapa('tela-recarga', 'valor');
  }),

  'recarga-escolher': (botao) => {
    EstadoTotem.quantidadePasses = Number(botao.dataset.quantidade);
    const total = EstadoTotem.quantidadePasses * EstadoTotem.valorPasse;
    montarPainel(document.getElementById('recarga-resumo'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Quantidade', textoPasses(EstadoTotem.quantidadePasses)],
      ['Valor de cada passe', formatarMoeda(EstadoTotem.valorPasse)],
      ['Valor final', formatarMoeda(total), true]
    ]);
    mostrarEtapa('tela-recarga', 'confirmar');
  },

  'recarga-trocar-valor': () => mostrarEtapa('tela-recarga', 'valor'),

  'recarga-confirmar': () => executar(async function () {
    const resultado = await ServicoCartoes.simularRecarga(EstadoTotem.quantidadePasses);
    montarPainel(document.getElementById('recarga-resultado'), [
      ['Cartão', EstadoTotem.cartaoDetectado.nome],
      ['Quantidade', textoPasses(resultado.quantidade)],
      ['Valor final', formatarMoeda(resultado.valorTotal), true]
    ]);
    mostrarEtapa('tela-recarga', 'resultado');
  }),

  'bloqueio-aproximar': () => executar(async function () {
    await identificarEGuardar();
    mostrarEtapa('tela-bloqueio', 'acao');
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
mostrarTela('tela-inicial', false);