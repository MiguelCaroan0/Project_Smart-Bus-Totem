// ===== 1. Estado Global =====
const telas = document.querySelectorAll('.tela');
const barraNav = document.getElementById('barra-nav');
const botaoVoltar = document.getElementById('botao-voltar');
const botaoCancelar = document.getElementById('botao-cancelar');
const confirmacao = document.getElementById('confirmacao');
const botaoSim = document.getElementById('botao-sim');
const botaoNao = document.getElementById('botao-nao');
const telaInicial = document.getElementById('tela-inicial');

let mapaInstancia = null;
let marcadoresGrupo = null;
let marcadorUsuario = null;

// Centro de Londrina (Ponto Padrão)
const CENTRO_LONDRINA = [-23.3106, -51.1628];
let usuarioCoordenadas = [...CENTRO_LONDRINA];

// Bounding Box Estrita (Londrina, Cambé e Ibiporã)
const LIMITES_REGIAO = [
  [-23.4200, -51.3200], // Sudoeste
  [-23.1800, -50.9800]  // Nordeste
];

function estaDentroDosLimites(lat, lng) {
  const [sw, ne] = LIMITES_REGIAO;
  return lat >= sw[0] && lat <= ne[0] && lng >= sw[1] && lng <= ne[1];
}

// Cálculo de distância Haversine em KM
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

// ===== 2. Dados de Locais =====
const LOCAIS_REGIAO = [
  // LONDRINA
  {
    id: 1,
    nome: "UPA 24h Sabará (Londrina)",
    categoria: "saude",
    lat: -23.3091,
    lng: -51.1896,
    endereco: "Av. Arthur Thomas, 2390 - Jd. Sabará",
    horario: "Atendimento 24 Horas",
    fone: "(43) 3375-0014",
    status: "Pronto Atendimento 24h"
  },
  {
    id: 2,
    nome: "UPA 24h Jardim Sol (Londrina)",
    categoria: "saude",
    lat: -23.3031,
    lng: -51.1712,
    endereco: "Av. Abélio Benatti, 3500 - Jd. Sol",
    horario: "Atendimento 24 Horas",
    fone: "(43) 3375-0200",
    status: "Pronto Atendimento 24h"
  },
  {
    id: 3,
    nome: "Hospital Universitário (HU / UEL)",
    categoria: "saude",
    lat: -23.3283,
    lng: -51.1343,
    endereco: "Av. Robert Koch, 60 - Vila Operária",
    horario: "Pronto-Socorro 24 Horas",
    fone: "(43) 3371-2000",
    status: "Hospital de Referência"
  },
  {
    id: 4,
    nome: "Terminal Central de Londrina",
    categoria: "transporte",
    lat: -23.3082,
    lng: -51.1610,
    endereco: "Rua Leste-Oeste, s/n - Centro",
    horario: "05h00 às 00h30",
    fone: "(43) 3378-2000",
    status: "Integração Urbana Londrina"
  },
  {
    id: 5,
    nome: "Prefeitura Municipal de Londrina",
    categoria: "servicos",
    lat: -23.3228,
    lng: -51.1685,
    endereco: "Av. Duque de Caxias, 635 - Jd. Mazzei",
    horario: "Segunda a Sexta: 12h às 18h",
    fone: "(43) 3372-4000",
    status: "Atendimento ao Cidadão"
  },

  // CAMBÉ
  {
    id: 6,
    nome: "UPA 24h 28 de Outubro (Cambé)",
    categoria: "saude",
    lat: -23.2798,
    lng: -51.2785,
    endereco: "Av. Canadá, 1280 - Jd. Central",
    horario: "Atendimento 24 Horas",
    fone: "(43) 3174-0200",
    status: "Pronto Atendimento 24h"
  },
  {
    id: 7,
    nome: "Terminal Urbano de Cambé",
    categoria: "transporte",
    lat: -23.2755,
    lng: -51.2770,
    endereco: "Rua Pará, 120 - Centro",
    horario: "05h30 às 23h30",
    fone: "(43) 3174-0280",
    status: "Terminal Metropolitano"
  },

  // IBIPORÃ
  {
    id: 8,
    nome: "UPA 24h de Ibiporã",
    categoria: "saude",
    lat: -23.2690,
    lng: -51.0510,
    endereco: "Av. Souza Naves, 1245 - Centro",
    horario: "Atendimento 24 Horas",
    fone: "(43) 3178-0250",
    status: "Pronto Atendimento 24h"
  },
  {
    id: 9,
    nome: "Terminal Urbano de Ibiporã",
    categoria: "transporte",
    lat: -23.2680,
    lng: -51.0475,
    endereco: "Rua Vicente Machado, 100 - Centro",
    horario: "05h30 às 23h00",
    fone: "(43) 3178-0200",
    status: "Terminal Urbano / Metropolitano"
  }
];

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

let telaAtual = 'tela-inicial';

// ===== 3. Navegação =====
function mostrarTela(idDaTela) {
  telaAtual = idDaTela;

  telas.forEach(t => t.classList.toggle('ativa', t.id === idDaTela));
  atualizarBarra(idDaTela);

  if (idDaTela === 'tela-mapas') {
    setTimeout(() => {
      if (!mapaInstancia) {
        inicializarMapa();
      } else {
        mapaInstancia.invalidateSize(true);
      }
      obterGeolocalizacao();
    }, 200);
  }
}

// ===== 4. Geolocalização =====
function obterGeolocalizacao() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;

        if (estaDentroDosLimites(lat, lng)) {
          usuarioCoordenadas = [lat, lng];
          atualizarMarcadorUsuario("📍 VOCÊ ESTÁ AQUI");
          if (mapaInstancia) mapaInstancia.setView(usuarioCoordenadas, 14);
        } else {
          usuarioCoordenadas = [...CENTRO_LONDRINA];
          atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
          if (mapaInstancia) mapaInstancia.setView(usuarioCoordenadas, 13);
        }
      },
      () => {
        usuarioCoordenadas = [...CENTRO_LONDRINA];
        atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else {
    atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
  }
}

function atualizarMarcadorUsuario(texto) {
  if (!mapaInstancia) return;

  const userIcon = L.divIcon({
    className: '',
    html: `<div class="user-pin">${texto}</div>`,
    iconSize: [140, 30],
    iconAnchor: [70, 15]
  });

  if (marcadorUsuario) {
    marcadorUsuario.setLatLng(usuarioCoordenadas).setIcon(userIcon);
  } else {
    marcadorUsuario = L.marker(usuarioCoordenadas, { icon: userIcon }).addTo(mapaInstancia);
  }
}

// ===== 5. Lógica do Mapa =====
function inicializarMapa() {
  const container = document.getElementById('mapa-canvas');
  if (!container) return;

  if (container._leaflet_id && mapaInstancia) {
    mapaInstancia.invalidateSize(true);
    return;
  }

  mapaInstancia = L.map('mapa-canvas', {
    zoomControl: false,
    maxBounds: LIMITES_REGIAO,
    maxBoundsViscosity: 0.8
  }).setView(usuarioCoordenadas, 13);

  // Tiles Dark CartoDB
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    minZoom: 10,
    subdomains: 'abcd',
    attribution: '© OpenStreetMap © CARTO'
  }).addTo(mapaInstancia);

  marcadoresGrupo = L.layerGroup().addTo(mapaInstancia);

  atualizarMapaELista('tudo', '');

  setTimeout(() => {
    mapaInstancia.invalidateSize(true);
  }, 100);

  // Eventos de Busca e Filtro
  const inputBusca = document.getElementById('busca-local');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const catAtiva = document.querySelector('.btn-filtro.ativo')?.dataset.categoria || 'tudo';
      atualizarMapaELista(catAtiva, termo);
    });
  }

  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      atualizarMapaELista(btn.dataset.categoria, inputBusca ? inputBusca.value.toLowerCase() : '');
    };
  });

  // Controles Touch
  document.getElementById('btn-zoom-in').onclick = () => mapaInstancia.zoomIn();
  document.getElementById('btn-zoom-out').onclick = () => mapaInstancia.zoomOut();
  document.getElementById('btn-recentralizar').onclick = () => {
    mapaInstancia.setView(usuarioCoordenadas, 14);
    mapaInstancia.invalidateSize(true);
  };

  document.getElementById('btn-fechar-detalhes').onclick = () => {
    document.getElementById('mapa-detalhes').classList.add('oculta');
  };
}

function atualizarMapaELista(categoria, termoBusca = '') {
  if (!marcadoresGrupo) return;
  marcadoresGrupo.clearLayers();

  const containerLista = document.getElementById('lista-locais');
  containerLista.innerHTML = '';

  const locaisFiltrados = LOCAIS_REGIAO.filter(local => {
    const bateCategoria = (categoria === 'tudo' || local.categoria === categoria);
    const bateBusca = local.nome.toLowerCase().includes(termoBusca) ||
                      local.endereco.toLowerCase().includes(termoBusca) ||
                      local.status.toLowerCase().includes(termoBusca);
    return bateCategoria && bateBusca;
  });

  locaisFiltrados.forEach(local => {
    const dist = calcularDistanciaKm(usuarioCoordenadas[0], usuarioCoordenadas[1], local.lat, local.lng);

    let iconeEmoji = '📍';
    if (local.categoria === 'saude') iconeEmoji = '🏥';
    if (local.categoria === 'transporte') iconeEmoji = '🚌';
    if (local.categoria === 'servicos') iconeEmoji = '🏛️';

    const pinHTML = `<div class="custom-pin ${local.categoria}"><span>${iconeEmoji}</span></div>`;
    const customIcon = L.divIcon({
      className: '',
      html: pinHTML,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    const m = L.marker([local.lat, local.lng], { icon: customIcon });

    m.bindPopup(`
      <strong style="font-size: 14px; color:#ffc629;">${local.nome}</strong><br>
      <span style="font-size: 12px; color:#ccc;">${local.status} • ${dist} km</span>
    `);

    m.on('click', () => {
      exibirDetalhes(local, dist);
    });

    marcadoresGrupo.addLayer(m);

    // Card na Lista Lateral
    const card = document.createElement('div');
    card.className = `item-local ${local.categoria}`;
    card.innerHTML = `
      <div class="item-header-linha">
        <span class="item-titulo">${local.nome}</span>
        <span class="item-distancia">${dist} km</span>
      </div>
      <div class="item-sub">${local.status}</div>
    `;

    card.onclick = () => {
      mapaInstancia.flyTo([local.lat, local.lng], 16, { duration: 1.2 });
      exibirDetalhes(local, dist);
      m.openPopup();
    };

    containerLista.appendChild(card);
  });
}

function exibirDetalhes(local, distancia) {
  document.getElementById('detalhe-nome').innerText = local.nome;
  document.getElementById('detalhe-badge').innerText = local.status;
  document.getElementById('detalhe-distancia').innerText = `📏 ${distancia} km`;
  document.getElementById('detalhe-endereco').innerText = `📍 ${local.endereco}`;
  document.getElementById('detalhe-horario').innerText = `🕒 ${local.horario}`;
  document.getElementById('detalhe-fone').innerText = `📞 ${local.fone}`;

  const urlRota = `https://www.google.com/maps/dir/?api=1&origin=${usuarioCoordenadas[0]},${usuarioCoordenadas[1]}&destination=${local.lat},${local.lng}`;
  document.getElementById('detalhe-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(urlRota)}`;

  document.getElementById('mapa-detalhes').classList.remove('oculta');
}

// ===== 6. Utilitários Globais =====
function atualizarBarra(idDaTela) {
  barraNav.classList.toggle('oculta', idDaTela === 'tela-inicial');
  botaoVoltar.classList.toggle('invisivel', idDaTela === 'menu-principal');
}

function voltar() {
  const pai = TELA_PAI[telaAtual];
  if (pai) mostrarTela(pai);
}

document.querySelectorAll('[data-abrir]').forEach(b => {
  b.addEventListener('click', () => mostrarTela(b.dataset.abrir));
});

document.querySelectorAll('[data-funcionalidade]').forEach(b => {
  b.addEventListener('click', () => mostrarTela(b.dataset.funcionalidade));
});

botaoVoltar.addEventListener('click', voltar);
botaoCancelar.addEventListener('click', () => confirmacao.classList.remove('oculta'));
botaoSim.addEventListener('click', () => { confirmacao.classList.add('oculta'); mostrarTela('tela-inicial'); });
botaoNao.addEventListener('click', () => confirmacao.classList.add('oculta'));
telaInicial.addEventListener('click', () => mostrarTela('menu-principal'));

mostrarTela('tela-inicial');

