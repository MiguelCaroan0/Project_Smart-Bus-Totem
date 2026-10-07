// ===== 1. Referências aos elementos da página =====
const telas = document.querySelectorAll('.tela');
const barraNav = document.getElementById('barra-nav');
const botaoVoltar = document.getElementById('botao-voltar');
const botaoCancelar = document.getElementById('botao-cancelar');
const confirmacao = document.getElementById('confirmacao');
const botaoSim = document.getElementById('botao-sim');
const botaoNao = document.getElementById('botao-nao');
const telaInicial = document.getElementById('tela-inicial');

// ===== 2. Mapa de navegação: para onde o "Voltar" leva em cada tela =====
// Para criar uma tela nova, basta dizer aqui quem é a "tela pai" dela.
const TELA_PAI = {
  'tela-transporte': 'menu-principal',
  'tela-cartoes': 'menu-principal',
  'tela-mapas': 'menu-principal',
  'tela-ajuda': 'menu-principal',
  'tela-saldo': 'tela-cartoes',
  'tela-extrato': 'tela-cartoes',
  'tela-recarga': 'tela-cartoes',
  'tela-bloqueio': 'tela-cartoes',
  'tela-carregamento': 'tela-cartoes',
  'tela-tipos-cartao': 'tela-cartoes'
};

let telaAtual = 'tela-inicial'; // guarda onde o usuário está agora

// ===== 3. Função central: mostra uma tela e esconde as outras =====
function mostrarTela(idDaTela) {
  telaAtual = idDaTela;

  telas.forEach(function (tela) {
    tela.classList.toggle('ativa', tela.id === idDaTela);
  });

  atualizarBarra(idDaTela);

  // Leva o foco ao título da nova tela (ajuda leitores de tela e teclado)
  const titulo = document.querySelector('#' + idDaTela + ' h2');
  if (titulo) titulo.focus();
}

// ===== 4. Decide o que a barra de navegação mostra =====
function atualizarBarra(idDaTela) {
  const naInicial = idDaTela === 'tela-inicial';
  const noMenu = idDaTela === 'menu-principal';

  barraNav.classList.toggle('oculta', naInicial);     // some na tela inicial
  botaoVoltar.classList.toggle('invisivel', noMenu);  // Voltar não faz sentido no menu
}

// ===== 5. Navegação =====
function abrirTela(idDaTela) {
  mostrarTela(idDaTela);
}

function voltarAoMenu() {
  mostrarTela('menu-principal');
}

function abrirTelaCartoes() {
  mostrarTela('tela-cartoes');
}

// Abre uma das seis funcionalidades de Cartões (ex.: 'tela-saldo')
// FUTURO: ao abrir cada funcionalidade, não iniciar nenhuma conexão automática;
// a integração só deve começar por ação explícita do usuário, após homologação.
function abrirFuncionalidadeCartao(idDaFuncionalidade) {
  mostrarTela(idDaFuncionalidade);
}

function voltarParaCartoes() {
  abrirTelaCartoes();
}

// Botão Voltar: retorna à tela anterior (Cartões ou menu principal)
function voltar() {
  const pai = TELA_PAI[telaAtual];
  if (pai === 'tela-cartoes') voltarParaCartoes();
  else if (pai === 'menu-principal') voltarAoMenu();
}

// ===== 6. Cancelamento do atendimento =====
function abrirConfirmacaoCancelamento() {
  confirmacao.classList.remove('oculta');
  botaoNao.focus(); // foco no botão mais seguro ("Não, continuar")
}

function fecharConfirmacaoCancelamento() {
  confirmacao.classList.add('oculta');
}

// Executa o cancelamento (chamada só depois do "Sim, cancelar")
function cancelarAtendimento() {
  fecharConfirmacaoCancelamento();
  mostrarTela('tela-inicial');
  // FUTURO: limpar aqui qualquer dado da sessão (cartão lido, autenticação, etc.)
}

// ===== 7. Ligando os botões às funções =====
document.querySelectorAll('[data-abrir]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    abrirTela(botao.dataset.abrir);
  });
});

// Cards de funcionalidades de Cartões: data-funcionalidade="id-da-tela"
document.querySelectorAll('[data-funcionalidade]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    abrirFuncionalidadeCartao(botao.dataset.funcionalidade);
  });
});

botaoVoltar.addEventListener('click', voltar);
botaoCancelar.addEventListener('click', abrirConfirmacaoCancelamento);
botaoSim.addEventListener('click', cancelarAtendimento);
botaoNao.addEventListener('click', fecharConfirmacaoCancelamento);

// Qualquer toque na tela inicial abre o menu principal
telaInicial.addEventListener('click', function () {
  abrirTela('menu-principal');
});

// Teclado: Enter ou Espaço na tela inicial também inicia
telaInicial.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter' || evento.key === ' ') {
    evento.preventDefault();
    abrirTela('menu-principal');
  }
});

// Tecla Esc fecha a confirmação (equivale a "Não, continuar")
document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') fecharConfirmacaoCancelamento();
});

// ===== 8. Estado inicial =====
mostrarTela('tela-inicial');

/* ===== PONTOS "FUTURO" (integrações ainda não implementadas) =====
   - API oficial do cartão (saldo, extrato, bloqueio): ver telas em index.html
   - Leitor NFC/RFID: tela-saldo e tela-recarga
   - Autenticação: tela-extrato e tela-bloqueio
   - Gateway de pagamento: tela-recarga (somente após homologação)
   - Impressão do comprovante: tela-recarga
   - Links, contatos e regras oficiais: tela-carregamento e tela-tipos-cartao
*/