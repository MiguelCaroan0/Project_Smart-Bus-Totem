// ===== 1. Referências aos elementos da página =====
const telas = document.querySelectorAll('.tela');
const barraNav = document.getElementById('barra-nav');
const botaoVoltar = document.getElementById('botao-voltar');
const botaoCancelar = document.getElementById('botao-cancelar');
const confirmacao = document.getElementById('confirmacao');
const botaoSim = document.getElementById('botao-sim');
const botaoNao = document.getElementById('botao-nao');

// ===== 2. Função central: mostra uma tela e esconde as outras =====
function mostrarTela(idDaTela) {
  telas.forEach(function (tela) {
    // toggle(classe, condição): adiciona "ativa" só se o id for o escolhido
    tela.classList.toggle('ativa', tela.id === idDaTela);
  });

  atualizarBarra(idDaTela);

  // Leva o foco ao título da nova tela (ajuda leitores de tela e teclado)
  const titulo = document.querySelector('#' + idDaTela + ' h2');
  if (titulo) titulo.focus();
}

// ===== 3. Decide o que a barra de navegação mostra =====
function atualizarBarra(idDaTela) {
  const naInicial = idDaTela === 'tela-inicial';
  const noMenu = idDaTela === 'menu-principal';

  barraNav.classList.toggle('oculta', naInicial);          // some na tela inicial
  botaoVoltar.classList.toggle('invisivel', noMenu);       // Voltar não faz sentido no menu
}

// ===== 4. Ações de navegação =====
function abrirTela(idDaTela) {
  mostrarTela(idDaTela);
}

function voltarAoMenu() {
  mostrarTela('menu-principal');
}

function cancelarAtendimento() {
  confirmacao.classList.remove('oculta');   // abre a pergunta
  botaoNao.focus();                          // foco no botão mais seguro
}

function fecharConfirmacao() {
  confirmacao.classList.add('oculta');
}

function encerrarSessao() {
  fecharConfirmacao();
  mostrarTela('tela-inicial');
}

// ===== 5. Ligando os botões às funções =====
// Todo botão com data-abrir="id" abre a tela indicada
document.querySelectorAll('[data-abrir]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    abrirTela(botao.dataset.abrir);
  });
});

botaoVoltar.addEventListener('click', voltarAoMenu);
botaoCancelar.addEventListener('click', cancelarAtendimento);
botaoSim.addEventListener('click', encerrarSessao);
botaoNao.addEventListener('click', fecharConfirmacao);

// Qualquer toque na tela inicial abre o menu principal
const telaInicial = document.getElementById('tela-inicial');
telaInicial.addEventListener('click', function () {
  abrirTela('menu-principal');
});

// Para quem usa teclado: Enter ou Espaço na tela inicial também inicia
telaInicial.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter' || evento.key === ' ') {
    evento.preventDefault();
    abrirTela('menu-principal');
  }
});

// Tecla Esc fecha a confirmação (equivale a "Não")
document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Escape') fecharConfirmacao();
});

// ===== 6. Estado inicial =====
mostrarTela('tela-inicial');