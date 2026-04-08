/* ============================================================
   THEME ENGINE — SISTEMA MODULAR DE TEMAS
   ============================================================
   
   PARA ADICIONAR UM NOVO TEMA (ex: "Sukuna"):
   1. Crie uma nova entrada no objeto `themes` abaixo.
   2. Use as mesmas chaves de variáveis CSS.
   3. Opcional: se quiser alterar o filtro de imagens, adicione
      a propriedade `imageFilter` (ex: 'sepia(100%) saturate(300%) hue-rotate(-50deg)').
   4. Adicione um <option value="sukuna"> no HTML do #theme-select.
   
   Exemplo de estrutura para o Tema Sukuna:
   
   sukuna: {
     name: "SUkUNA",
     css: {
       '--bg-color':        '#1a0000',
       '--bg-secondary':    '#0d0000',
       '--bg-panel':        '#150000',
       '--text-color':      '#FFFFFF',
       '--text-muted':      '#884444',
       '--accent-color':    '#FF2222',
       '--accent-dim':      '#880000',
       '--border-color':    '#FF4444',
       '--border-width':    '2px',
       '--border-style':    'solid',
       '--canvas-bg':       '#100000',
       '--grid-color':      'rgba(255, 50, 50, 0.06)',
       '--grid-color-snap': 'rgba(255, 34, 34, 0.18)',
       '--selection-outline':'#FF2222',
       '--resize-handle':   '#FF2222',
       '--danger-color':    '#FF6644',
       '--scrollbar-bg':    '#150000',
       '--scrollbar-thumb': '#440000',
       '--hatch-color':     'rgba(255, 50, 50, 0.10)'
     },
     imageFilter: 'sepia(60%) saturate(200%) hue-rotate(-30deg)'
   }
   ============================================================ */

const ThemeEngine = {
  currentTheme: 'gojo',

  themes: {
    gojo: {
      name: 'GOJO SATORU',
      css: {
        '--bg-color':         '#000000',
        '--bg-secondary':     '#0a0a0a',
        '--bg-panel':         '#111111',
        '--text-color':       '#FFFFFF',
        '--text-muted':       '#888888',
        '--accent-color':     '#00E5FF',
        '--accent-dim':       '#007a8a',
        '--border-color':     '#FFFFFF',
        '--border-width':     '2px',
        '--border-style':     'solid',
        '--font-heading':     "'Press Start 2P', monospace",
        '--font-body':        "'VT323', monospace",
        '--canvas-bg':        '#0d0d0d',
        '--grid-color':       'rgba(255, 255, 255, 0.06)',
        '--grid-color-snap':  'rgba(0, 229, 255, 0.18)',
        '--selection-outline':'#00E5FF',
        '--resize-handle':    '#00E5FF',
        '--danger-color':     '#FF3355',
        '--scrollbar-bg':     '#111',
        '--scrollbar-thumb':  '#333',
        '--hatch-color':      'rgba(255, 255, 255, 0.08)',
        // Variáveis para Barras de Status / HUD
        '--health-color':     '#E53935',
        '--cursed-energy-color': '#00E5FF',
        '--bar-bg-color':     '#1A1A1A'
      },
      imageFilter: 'grayscale(100%)'
    }
    // 
    // ██████████████████████████████████████████
    // ADICIONE NOVOS TEMAS AQUI DENTRO!
    // Exemplo: sukuna: { name: 'SUKUNA', css: {...}, imageFilter: '...' }
    // ██████████████████████████████████████████
    //
  },

  /** Aplica o tema ao :root via CSS variables */
  apply(themeKey) {
    const theme = this.themes[themeKey];
    if (!theme) {
      console.warn(`[ThemeEngine] Tema "${themeKey}" não encontrado.`);
      return;
    }
    this.currentTheme = themeKey;
    const root = document.documentElement.style;
    for (const [prop, value] of Object.entries(theme.css)) {
      root.setProperty(prop, value);
    }
    // Atualiza filtro de imagens conforme o tema
    this._updateImageFilters(theme.imageFilter || 'none');
    console.log(`[ThemeEngine] Tema aplicado: ${theme.name}`);
  },

  /** Atualiza o filtro CSS de todas as imagens nos elementos de imagem */
  _updateImageFilters(filterValue) {
    document.querySelectorAll('.el-image img').forEach(img => {
      img.style.filter = filterValue;
    });
  },

  /** Registra um novo tema em tempo de execução */
  register(key, config) {
    this.themes[key] = config;
    // Adiciona <option> ao select se não existir
    const sel = document.getElementById('theme-select');
    if (!sel.querySelector(`option[value="${key}"]`)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `◆ ${config.name}`;
      sel.appendChild(opt);
    }
  }
};

/* ============================================================
   STATE — Estado global do aplicativo
   ============================================================ */
const AppState = {
  elements: [],           // Array de objetos de elementos
  selectedId: null,       // ID do elemento selecionado
  nextId: 1,              // Contador auto-incremento para IDs
  snapEnabled: true,      // Snap to grid ativo?
  zoomLevel: 1.0,         // Zoom atual
  GRID: 16                // Tamanho do grid em px (Minecraft-style)
};

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeEngine.apply('gojo');

  // Evento do dropdown de temas
  document.getElementById('theme-select').addEventListener('change', (e) => {
    ThemeEngine.apply(e.target.value);
  });

  // Click no canvas (fora de elementos) deseleciona
  document.getElementById('canvas').addEventListener('mousedown', (e) => {
    if (e.target.id === 'canvas') {
      deselectAll();
    }
  });

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && AppState.selectedId !== null) {
      deleteSelected();
    }
  });
});

/* ============================================================
   TOAST — Notificação rápida
   ============================================================ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================================================
   ADICIONAR ELEMENTO AO CANVAS
   ============================================================ */
function addElement(type) {
  const id = AppState.nextId++;
  const gridSize = AppState.GRID;

  // Tamanhos e posições padrão (já alinhados ao grid)
  const defaults = {
    panel:  { w: 256, h: 192, label: 'Painel' },
    hatch:  { w: 256, h: 192, label: 'Hachura' },
    text:   { w: 320, h: 48,  label: 'Texto', text: 'Seu Texto Aqui' },
    image:  { w: 256, h: 256, label: 'Imagem' },
    barHealth: { w: 256, h: 32, label: 'Barra de Vida', barType: 'health', fill: 100 },
    barEnergy: { w: 256, h: 32, label: 'Barra de Energia', barType: 'energy', fill: 100 }
  };

  const def = defaults[type] || defaults.panel;
  const el = {
    id,
    type,
    x: Math.round(Math.random() * (1280 - def.w) / gridSize) * gridSize,
    y: Math.round(Math.random() * (720 - def.h) / gridSize) * gridSize,
    w: def.w,
    h: def.h,
    z: AppState.elements.length + 1,
    opacity: 1,
    text: def.text || '',
    imageData: null,  // Base64 para imagens carregadas
    // Propriedades específicas para barras de progresso
    barType: def.barType || null,
    barFill: def.fill !== undefined ? def.fill : 100,
    barDirection: 'horizontal'  // 'horizontal' ou 'vertical'
  };

  AppState.elements.push(el);
  renderElement(el);
  updateEmptyMsg();
  selectElement(id);
  showToast(`${def.label} adicionado`);
}

/* ============================================================
   RENDERIZAR UM ELEMENTO NO DOM DO CANVAS
   ============================================================ */
function renderElement(el) {
  const canvas = document.getElementById('canvas');

  // Se já existe no DOM, remove para recriar
  const existing = document.getElementById(`el-${el.id}`);
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = `el-${el.id}`;
  div.className = `canvas-element el-${el.type}`;
  div.dataset.id = el.id;

  // Estilos posicionais
  Object.assign(div.style, {
    left:   `${el.x}px`,
    top:    `${el.y}px`,
    width:  `${el.w}px`,
    height: `${el.h}px`,
    zIndex: el.z,
    opacity: el.opacity
  });

  // Conteúdo conforme o tipo
  if (el.type === 'text') {
    div.textContent = el.text;
  } else if (el.type === 'image' && el.imageData) {
    const img = document.createElement('img');
    img.src = el.imageData;
    img.draggable = false;
    // Aplica o filtro do tema atual
    const theme = ThemeEngine.themes[ThemeEngine.currentTheme];
    if (theme && theme.imageFilter) {
      img.style.filter = theme.imageFilter;
    }
    div.innerHTML = '';
    div.appendChild(img);
  } else if (el.type === 'image') {
    div.innerHTML = '<span class="placeholder-label">◫ CLIQUE PARA<br/>ADICIONAR IMAGEM</span>';
  } else if (el.type === 'barHealth' || el.type === 'barEnergy') {
    // Estrutura da barra de progresso: container > bg + fill
    const barColorVar = el.barType === 'health' ? '--health-color' : '--cursed-energy-color';
    const barColor = getComputedStyle(document.documentElement).getPropertyValue(barColorVar).trim();
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bar-bg-color').trim();
    
    div.innerHTML = `
      <div class="bar-container" style="width:100%;height:100%;background:${bgColor};position:relative;">
        <div class="bar-fill" style="position:absolute;background:${barColor};"></div>
      </div>
    `;
    // Aplica o preenchimento e direção
    updateBarFill(div, el.barFill, el.barDirection);
  }
  // panel e hatch não precisam de conteúdo interno

  // Resize handles
  ['nw', 'ne', 'sw', 'se'].forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${dir}`;
    handle.dataset.dir = dir;
    handle.dataset.elId = el.id;
    div.appendChild(handle);
  });

  // Eventos de interação
  div.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    selectElement(el.id);
    startDrag(e, el.id);
  });

  // Resize handles events
  div.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      selectElement(el.id);
      startResize(e, el.id, handle.dataset.dir);
    });
  });

  canvas.appendChild(div);
}

/* ============================================================
   SELEÇÃO / DESELEÇÃO
   ============================================================ */
function selectElement(id) {
  AppState.selectedId = id;

  // Remove seleção visual anterior
  document.querySelectorAll('.canvas-element.selected').forEach(d => d.classList.remove('selected'));

  // Adiciona seleção visual
  const div = document.getElementById(`el-${id}`);
  if (div) div.classList.add('selected');

  // Popula painel de propriedades
  showPropsPanel(id);
}

function deselectAll() {
  AppState.selectedId = null;
  document.querySelectorAll('.canvas-element.selected').forEach(d => d.classList.remove('selected'));
  hidePropsPanel();
}

function hidePropsPanel() {
  document.getElementById('no-selection').style.display = 'block';
  document.getElementById('props-panel').classList.add('hidden');
}

function showPropsPanel(id) {
  const el = AppState.elements.find(e => e.id === id);
  if (!el) return;

  document.getElementById('no-selection').style.display = 'none';
  document.getElementById('props-panel').classList.remove('hidden');

  document.getElementById('props-title').textContent = `◆ ${el.type.toUpperCase()} #${el.id}`;
  document.getElementById('prop-x').value = el.x;
  document.getElementById('prop-y').value = el.y;
  document.getElementById('prop-w').value = el.w;
  document.getElementById('prop-h').value = el.h;
  document.getElementById('prop-z').value = el.z;
  document.getElementById('prop-opacity').value = el.opacity;

  // Mostrar/ocultar campos específicos
  const textGroup = document.getElementById('prop-text-group');
  const imageGroup = document.getElementById('prop-image-group');
  const barGroup = document.getElementById('prop-bar-group');

  if (el.type === 'text') {
    textGroup.style.display = 'block';
    document.getElementById('prop-text').value = el.text;
  } else {
    textGroup.style.display = 'none';
  }

  if (el.type === 'image') {
    imageGroup.style.display = 'block';
  } else {
    imageGroup.style.display = 'none';
  }

  // Campos específicos para barras de progresso
  if (el.type === 'barHealth' || el.type === 'barEnergy') {
    barGroup.style.display = 'block';
    document.getElementById('prop-bar-fill').value = el.barFill;
    document.getElementById('prop-bar-fill-label').textContent = `${el.barFill}%`;
    document.getElementById('prop-bar-direction').value = el.barDirection;
  } else {
    barGroup.style.display = 'none';
  }
}

/* ============================================================
   ATUALIZAR PROPRIEDADES (via painel direito)
   ============================================================ */
function updateProp(field) {
  const el = AppState.elements.find(e => e.id === AppState.selectedId);
  if (!el) return;

  const grid = AppState.GRID;
  const div = document.getElementById(`el-${el.id}`);

  switch (field) {
    case 'x':
      el.x = snapValue(parseInt(document.getElementById('prop-x').value) || 0);
      if (div) div.style.left = `${el.x}px`;
      break;
    case 'y':
      el.y = snapValue(parseInt(document.getElementById('prop-y').value) || 0);
      if (div) div.style.top = `${el.y}px`;
      break;
    case 'w':
      el.w = snapValue(parseInt(document.getElementById('prop-w').value) || 16);
      if (div) div.style.width = `${el.w}px`;
      break;
    case 'h':
      el.h = snapValue(parseInt(document.getElementById('prop-h').value) || 16);
      if (div) div.style.height = `${el.h}px`;
      break;
    case 'z':
      el.z = parseInt(document.getElementById('prop-z').value) || 1;
      if (div) div.style.zIndex = el.z;
      break;
    case 'opacity':
      el.opacity = Math.min(1, Math.max(0, parseFloat(document.getElementById('prop-opacity').value) || 1));
      if (div) div.style.opacity = el.opacity;
      break;
    case 'text':
      el.text = document.getElementById('prop-text').value;
      if (div && el.type === 'text') div.textContent = el.text;
      break;
    case 'barFill':
      el.barFill = parseInt(document.getElementById('prop-bar-fill').value) || 0;
      document.getElementById('prop-bar-fill-label').textContent = `${el.barFill}%`;
      if (div && (el.type === 'barHealth' || el.type === 'barEnergy')) {
        updateBarFill(div, el.barFill, el.barDirection);
      }
      break;
    case 'barDirection':
      el.barDirection = document.getElementById('prop-bar-direction').value;
      if (div && (el.type === 'barHealth' || el.type === 'barEnergy')) {
        updateBarFill(div, el.barFill, el.barDirection);
      }
      break;
  }
}

/** Aplica snap ao grid de 16px se estiver ativo */
function snapValue(val) {
  if (!AppState.snapEnabled) return val;
  return Math.round(val / AppState.GRID) * AppState.GRID;
}

/* ============================================================
   UPLOAD DE IMAGEM (para elementos do tipo imagem)
   ============================================================ */
function updateImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const el = AppState.elements.find(e => e.id === AppState.selectedId);
  if (!el || el.type !== 'image') return;

  const reader = new FileReader();
  reader.onload = (e) => {
    el.imageData = e.target.result;
    renderElement(el);
    if (AppState.selectedId === el.id) {
      const div = document.getElementById(`el-${el.id}`);
      if (div) div.classList.add('selected');
    }
    showToast('Imagem carregada');
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   UPDATE BAR FILL — Atualiza preenchimento da barra de progresso
   ============================================================ */
function updateBarFill(div, fillPercent, direction) {
  const barFillEl = div.querySelector('.bar-fill');
  if (!barFillEl) return;

  const clampedFill = Math.max(0, Math.min(100, fillPercent));

  if (direction === 'vertical') {
    // Vertical: preenche de baixo para cima usando height
    barFillEl.style.width = '100%';
    barFillEl.style.height = `${clampedFill}%`;
    barFillEl.style.bottom = '0';
    barFillEl.style.left = '0';
    barFillEl.style.right = 'auto';
    barFillEl.style.top = 'auto';
  } else {
    // Horizontal: preenche da esquerda para direita usando width
    barFillEl.style.height = '100%';
    barFillEl.style.width = `${clampedFill}%`;
    barFillEl.style.left = '0';
    barFillEl.style.top = '0';
    barFillEl.style.right = 'auto';
    barFillEl.style.bottom = 'auto';
  }
}


/* ============================================================
   DRAG — Arrastar elementos
   ============================================================ */
let dragState = null;

function startDrag(e, id) {
  const el = AppState.elements.find(x => x.id === id);
  if (!el) return;

  const div = document.getElementById(`el-${id}`);
  if (!div) return;

  const canvasRect = document.getElementById('canvas').getBoundingClientRect();
  const scale = AppState.zoomLevel;

  dragState = {
    type: 'drag',
    id,
    startX: e.clientX,
    startY: e.clientY,
    origX: el.x,
    origY: el.y
  };

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  e.preventDefault();
}

function onDragMove(e) {
  if (!dragState || dragState.type !== 'drag') return;

  const scale = AppState.zoomLevel;
  let dx = (e.clientX - dragState.startX) / scale;
  let dy = (e.clientY - dragState.startY) / scale;

  let newX = dragState.origX + dx;
  let newY = dragState.origY + dy;

  if (AppState.snapEnabled) {
    newX = snapValue(newX);
    newY = snapValue(newY);
  }

  // Clamp dentro do canvas
  const el = AppState.elements.find(x => x.id === dragState.id);
  if (!el) return;

  newX = Math.max(0, Math.min(newX, 1280 - el.w));
  newY = Math.max(0, Math.min(newY, 720 - el.h));

  el.x = newX;
  el.y = newY;

  const div = document.getElementById(`el-${dragState.id}`);
  if (div) {
    div.style.left = `${el.x}px`;
    div.style.top = `${el.y}px`;
  }

  // Atualiza painel de propriedades em tempo real
  if (AppState.selectedId === dragState.id) {
    document.getElementById('prop-x').value = el.x;
    document.getElementById('prop-y').value = el.y;
  }
}

function onDragEnd() {
  dragState = null;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
}

/* ============================================================
   RESIZE — Redimensionar elementos pelos cantos
   ============================================================ */
let resizeState = null;

function startResize(e, id, dir) {
  const el = AppState.elements.find(x => x.id === id);
  if (!el) return;

  const scale = AppState.zoomLevel;

  resizeState = {
    type: 'resize',
    id,
    dir,
    startX: e.clientX,
    startY: e.clientY,
    origX: el.x,
    origY: el.y,
    origW: el.w,
    origH: el.h
  };

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
  e.preventDefault();
}

function onResizeMove(e) {
  if (!resizeState || resizeState.type !== 'resize') return;

  const scale = AppState.zoomLevel;
  let dx = (e.clientX - resizeState.startX) / scale;
  let dy = (e.clientY - resizeState.startY) / scale;

  const el = AppState.elements.find(x => x.id === resizeState.id);
  if (!el) return;

  let newX = resizeState.origX;
  let newY = resizeState.origY;
  let newW = resizeState.origW;
  let newH = resizeState.origH;

  const dir = resizeState.dir;

  // Calcula novas dimensões conforme direção
  if (dir.includes('e')) {
    newW = resizeState.origW + dx;
  }
  if (dir.includes('w')) {
    newW = resizeState.origW - dx;
    newX = resizeState.origX + dx;
  }
  if (dir.includes('s')) {
    newH = resizeState.origH + dy;
  }
  if (dir.includes('n')) {
    newH = resizeState.origH - dy;
    newY = resizeState.origY + dy;
  }

  // Mínimo de 16px
  if (newW < 16) { newW = 16; if (dir.includes('w')) newX = resizeState.origX + resizeState.origW - 16; }
  if (newH < 16) { newH = 16; if (dir.includes('n')) newY = resizeState.origY + resizeState.origH - 16; }

  // Snap
  if (AppState.snapEnabled) {
    newW = snapValue(newW);
    newH = snapValue(newH);
    newX = snapValue(newX);
    newY = snapValue(newY);
  }

  // Clamp
  newX = Math.max(0, Math.min(newX, 1280 - 16));
  newY = Math.max(0, Math.min(newY, 720 - 16));
  newW = Math.max(16, Math.min(newW, 1280 - newX));
  newH = Math.max(16, Math.min(newH, 720 - newY));

  el.x = newX;
  el.y = newY;
  el.w = newW;
  el.h = newH;

  const div = document.getElementById(`el-${resizeState.id}`);
  if (div) {
    div.style.left = `${el.x}px`;
    div.style.top = `${el.y}px`;
    div.style.width = `${el.w}px`;
    div.style.height = `${el.h}px`;
  }

  if (AppState.selectedId === resizeState.id) {
    document.getElementById('prop-x').value = el.x;
    document.getElementById('prop-y').value = el.y;
    document.getElementById('prop-w').value = el.w;
    document.getElementById('prop-h').value = el.h;
  }
}

function onResizeEnd() {
  resizeState = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
}

/* ============================================================
   DELETAR ELEMENTO
   ============================================================ */
function deleteSelected() {
  if (AppState.selectedId === null) return;

  const div = document.getElementById(`el-${AppState.selectedId}`);
  if (div) div.remove();

  AppState.elements = AppState.elements.filter(e => e.id !== AppState.selectedId);
  AppState.selectedId = null;
  hidePropsPanel();
  updateEmptyMsg();
  showToast('Elemento deletado');
}

/* ============================================================
   SNAP TOGGLE
   ============================================================ */
function toggleSnap() {
  AppState.snapEnabled = document.getElementById('snap-toggle').checked;
  const canvas = document.getElementById('canvas');
  if (AppState.snapEnabled) {
    canvas.classList.add('snap-active');
  } else {
    canvas.classList.remove('snap-active');
  }
}

/* ============================================================
   ZOOM
   ============================================================ */
function zoomCanvas(delta, reset = false) {
  if (reset) {
    AppState.zoomLevel = 1.0;
  } else {
    AppState.zoomLevel = Math.max(0.3, Math.min(2.0, AppState.zoomLevel + delta));
  }
  const wrapper = document.getElementById('canvas-wrapper');
  wrapper.style.transform = `scale(${AppState.zoomLevel})`;
  document.getElementById('zoom-label').textContent = `${Math.round(AppState.zoomLevel * 100)}%`;
}

/* ============================================================
   EMPTY MESSAGE
   ============================================================ */
function updateEmptyMsg() {
  const msg = document.getElementById('canvas-empty-msg');
  if (AppState.elements.length === 0) {
    msg.style.display = 'block';
  } else {
    msg.style.display = 'none';
  }
}

/* ============================================================
   SALVAR PROJETO (JSON)
   ============================================================ */
function saveProject() {
  if (AppState.elements.length === 0) {
    showToast('Nenhum elemento para salvar');
    return;
  }

  const data = {
    version: '1.0',
    theme: ThemeEngine.currentTheme,
    elements: AppState.elements.map(el => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      z: el.z,
      opacity: el.opacity,
      text: el.text || '',
      imageData: el.imageData || null
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jjk-gui-project-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Projeto salvo!');
}

/* ============================================================
   CARREGAR PROJETO (JSON)
   ============================================================ */
function triggerLoad() {
  document.getElementById('file-load-json').click();
}

function loadProject(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Limpa canvas atual
      document.querySelectorAll('.canvas-element').forEach(d => d.remove());
      AppState.elements = [];
      AppState.selectedId = null;
      AppState.nextId = 1;

      // Restaura elementos
      if (data.elements && Array.isArray(data.elements)) {
        data.elements.forEach(el => {
          AppState.elements.push(el);
          if (el.id >= AppState.nextId) AppState.nextId = el.id + 1;
          renderElement(el);
        });
      }

      // Restaura tema se disponível
      if (data.theme && ThemeEngine.themes[data.theme]) {
        ThemeEngine.apply(data.theme);
        document.getElementById('theme-select').value = data.theme;
      }

      hidePropsPanel();
      updateEmptyMsg();
      showToast(`Projeto carregado! (${AppState.elements.length} elementos)`);
    } catch (err) {
      console.error('Erro ao carregar JSON:', err);
      showToast('Erro ao carregar arquivo JSON');
    }
  };
  reader.readAsText(file);

  // Reset do input para permitir recarregar o mesmo arquivo
  event.target.value = '';
}

/* ============================================================
   EXPORTAR PNG (html2canvas — pixel perfect)
   ============================================================ */
async function exportPNG() {
  const canvas = document.getElementById('canvas');

  showToast('Gerando PNG...');

  // Remove temporariamente a seleção visual para a exportação
  const wasSelected = AppState.selectedId;
  document.querySelectorAll('.canvas-element.selected').forEach(d => d.classList.remove('selected'));

  try {
    const result = await html2canvas(canvas, {
      backgroundColor: null,
      scale: 1,                    // Escala 1:1 para pixel perfect
      useCORS: true,
      allowTaint: true,
      imageRendering: 'pixelated', // Crucial: sem antialiasing
      logging: false,
      width: 1280,
      height: 720
    });

    // Restaura seleção
    if (wasSelected !== null) {
      const div = document.getElementById(`el-${wasSelected}`);
      if (div) div.classList.add('selected');
    }

    // Download
    const link = document.createElement('a');
    link.download = `jjk-gui-export-${Date.now()}.png`;
    link.href = result.toDataURL('image/png');
    link.click();

    showToast('PNG exportado!');
  } catch (err) {
    console.error('Erro na exportação:', err);
    showToast('Erro ao exportar PNG');
  }
}
// ============================================================================
// 5. DRAG & DROP SYSTEM - SISTEMA DE ARRASTAR ELEMENTOS
// ============================================================================

/**
 * DragSystem - Gerencia o arrastar de elementos no canvas
 */
const DragSystem = {
  isDragging: false,
  dragElement: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  startX: 0,
  startY: 0,
  
  /**
   * Inicializa o sistema de drag
   */
  init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
    // Touch events para mobile
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e));
    
    console.log('[DragSystem] Inicializado');
  },
  
  /**
   * Handler de mouse down
   * @param {MouseEvent} e 
   */
  onMouseDown(e) {
    const target = e.target.closest('.canvas-element');
    if (!target || !target.dataset.elementId) return;
    
    const elementId = target.dataset.elementId;
    const element = AppState.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.isDragging = true;
    this.dragElement = element;
    this.dragElementDom = target;
    
    // Calcula offset do mouse dentro do elemento
    const rect = target.getBoundingClientRect();
    const canvasRect = document.getElementById('canvas').getBoundingClientRect();
    
    this.dragOffsetX = (e.clientX - rect.left) / AppState.zoom;
    this.dragOffsetY = (e.clientY - rect.top) / AppState.zoom;
    
    this.startX = element.x;
    this.startY = element.y;
    
    target.classList.add('dragging');
    
    // Salva estado para undo
    HistorySystem.saveState();
    
    console.log(`[DragSystem] Iniciando drag do elemento ${elementId}`);
  },
  
  /**
   * Handler de mouse move
   * @param {MouseEvent} e 
   */
  onMouseMove(e) {
    if (!this.isDragging || !this.dragElement) return;
    
    e.preventDefault();
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calcula nova posição
    let newX = (e.clientX - canvasRect.left) / AppState.zoom - this.dragOffsetX;
    let newY = (e.clientY - canvasRect.top) / AppState.zoom - this.dragOffsetY;
    
    // Aplica snap to grid se ativado
    if (AppState.snapToGrid) {
      newX = CanvasEngine.applySnap(newX);
      newY = CanvasEngine.applySnap(newY);
    }
    
    // Aplica limites do canvas
    newX = Math.max(0, Math.min(newX, AppState.canvasSize.width - this.dragElement.w));
    newY = Math.max(0, Math.min(newY, AppState.canvasSize.height - this.dragElement.h));
    
    // Atualiza posição do elemento
    this.dragElement.x = newX;
    this.dragElement.y = newY;
    
    // Atualiza DOM
    this.dragElementDom.style.left = `${newX}px`;
    this.dragElementDom.style.top = `${newY}px`;
    
    // Atualiza barra de status com coordenadas
    this.updateCoordinates(newX, newY);
    
    // Atualiza minimapa em tempo real
    if (typeof updateMinimap === 'function') {
      updateMinimap();
    }
  },
  
  /**
   * Handler de mouse up
   * @param {MouseEvent} e 
   */
  onMouseUp(e) {
    if (!this.isDragging) return;
    
    const element = this.dragElement;
    const target = this.dragElementDom;
    
    if (target) {
      target.classList.remove('dragging');
    }
    
    // Verifica se houve movimento real
    if (element && (element.x !== this.startX || element.y !== this.startY)) {
      StateManager.updateElement(element.id, {
        x: element.x,
        y: element.y
      });
      
      // Atualiza painel de propriedades se este for o elemento selecionado
      if (AppState.selectedElement?.id === element.id) {
        updatePropsPanel();
      }
      
      console.log(`[DragSystem] Elemento ${element.id} movido para (${element.x}, ${element.y})`);
    }
    
    this.isDragging = false;
    this.dragElement = null;
    this.dragElementDom = null;
  },
  
  /**
   * Handler de touch start
   * @param {TouchEvent} e 
   */
  onTouchStart(e) {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    this.onMouseDown(mouseEvent);
  },
  
  /**
   * Handler de touch move
   * @param {TouchEvent} e 
   */
  onTouchMove(e) {
    if (e.touches.length !== 1 || !this.isDragging) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    this.onMouseMove(mouseEvent);
  },
  
  /**
   * Handler de touch end
   * @param {TouchEvent} e 
   */
  onTouchEnd(e) {
    const mouseEvent = new MouseEvent('mouseup', {});
    this.onMouseUp(mouseEvent);
  },
  
  /**
   * Atualiza coordenadas na barra de status
   * @param {number} x 
   * @param {number} y 
   */
  updateCoordinates(x, y) {
    const coordsEl = document.getElementById('statusbar-coords');
    if (coordsEl) {
      coordsEl.textContent = `X: ${Math.round(x)} | Y: ${Math.round(y)}`;
    }
  }
};

// ============================================================================
// 6. RESIZE SYSTEM - SISTEMA DE REDIMENSIONAMENTO
// ============================================================================

/**
 * ResizeSystem - Gerencia o redimensionamento de elementos
 */
const ResizeSystem = {
  isResizing: false,
  resizeElement: null,
  resizeHandle: null,
  startWidth: 0,
  startHeight: 0,
  startX: 0,
  startY: 0,
  startMouseX: 0,
  startMouseY: 0,
  
  /**
   * Inicializa o sistema de resize
   */
  init() {
    console.log('[ResizeSystem] Inicializado');
  },
  
  /**
   * Cria handles de resize para um elemento
   * @param {HTMLElement} elementDiv 
   * @param {Object} elementData 
   */
  createHandles(elementDiv, elementData) {
    // Remove handles existentes
    const existingHandles = elementDiv.querySelectorAll('.resize-handle');
    existingHandles.forEach(h => h.remove());
    
    // Cria novos handles
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${pos}`;
      handle.dataset.handle = pos;
      
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.onResizeStart(e, elementDiv, elementData, pos);
      });
      
      elementDiv.appendChild(handle);
    });
  },
  
  /**
   * Handler de início de resize
   * @param {MouseEvent} e 
   * @param {HTMLElement} elementDiv 
   * @param {Object} elementData 
   * @param {string} handlePos 
   */
  onResizeStart(e, elementDiv, elementData, handlePos) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isResizing = true;
    this.resizeElement = elementData;
    this.resizeElementDom = elementDiv;
    this.resizeHandle = handlePos;
    
    this.startWidth = elementData.w;
    this.startHeight = elementData.h;
    this.startX = elementData.x;
    this.startY = elementData.y;
    this.startMouseX = e.clientX;
    this.startMouseY = e.clientY;
    
    elementDiv.classList.add('resizing');
    
    // Adiciona listeners globais
    document.addEventListener('mousemove', this.boundOnResizeMove || (this.boundOnResizeMove = this.onResizeMove.bind(this)));
    document.addEventListener('mouseup', this.boundOnResizeEnd || (this.boundOnResizeEnd = this.onResizeEnd.bind(this)));
    
    // Salva estado para undo
    HistorySystem.saveState();
    
    console.log(`[ResizeSystem] Iniciando resize do elemento ${elementData.id}`);
  },
  
  /**
   * Handler de movimento durante resize
   * @param {MouseEvent} e 
   */
  onResizeMove(e) {
    if (!this.isResizing || !this.resizeElement) return;
    
    e.preventDefault();
    
    const deltaX = (e.clientX - this.startMouseX) / AppState.zoom;
    const deltaY = (e.clientY - this.startMouseY) / AppState.zoom;
    
    const element = this.resizeElement;
    const handle = this.resizeHandle;
    
    let newX = element.x;
    let newY = element.y;
    let newW = element.w;
    let newH = element.h;
    
    // Calcula novas dimensões baseado no handle
    if (handle.includes('e')) {
      newW = Math.max(20, this.startWidth + deltaX);
    }
    if (handle.includes('s')) {
      newH = Math.max(20, this.startHeight + deltaY);
    }
    if (handle.includes('w')) {
      newW = Math.max(20, this.startWidth - deltaX);
      newX = this.startX + deltaX;
    }
    if (handle.includes('n')) {
      newH = Math.max(20, this.startHeight - deltaY);
      newY = this.startY + deltaY;
    }
    
    // Aplica snap to grid se ativado
    if (AppState.snapToGrid) {
      newW = CanvasEngine.applySnap(newW);
      newH = CanvasEngine.applySnap(newH);
      newX = CanvasEngine.applySnap(newX);
      newY = CanvasEngine.applySnap(newY);
    }
    
    // Aplica limites
    newW = Math.min(newW, AppState.canvasSize.width - newX);
    newH = Math.min(newH, AppState.canvasSize.height - newY);
    newX = Math.max(0, Math.min(newX, AppState.canvasSize.width - newW));
    newY = Math.max(0, Math.min(newY, AppState.canvasSize.height - newH));
    
    // Atualiza elemento
    element.x = newX;
    element.y = newY;
    element.w = newW;
    element.h = newH;
    
    // Atualiza DOM
    this.resizeElementDom.style.left = `${newX}px`;
    this.resizeElementDom.style.top = `${newY}px`;
    this.resizeElementDom.style.width = `${newW}px`;
    this.resizeElementDom.style.height = `${newH}px`;
    
    // Atualiza minimapa
    if (typeof updateMinimap === 'function') {
      updateMinimap();
    }
  },
  
  /**
   * Handler de fim de resize
   * @param {MouseEvent} e 
   */
  onResizeEnd(e) {
    if (!this.isResizing) return;
    
    const element = this.resizeElement;
    const target = this.resizeElementDom;
    
    if (target) {
      target.classList.remove('resizing');
    }
    
    // Remove listeners globais
    document.removeEventListener('mousemove', this.boundOnResizeMove);
    document.removeEventListener('mouseup', this.boundOnResizeEnd);
    
    // Verifica se houve mudança real
    if (element && (
      element.w !== this.startWidth || 
      element.h !== this.startHeight ||
      element.x !== this.startX ||
      element.y !== this.startY
    )) {
      StateManager.updateElement(element.id, {
        x: element.x,
        y: element.y,
        w: element.w,
        h: element.h
      });
      
      // Atualiza painel de propriedades
      if (AppState.selectedElement?.id === element.id) {
        updatePropsPanel();
      }
      
      console.log(`[ResizeSystem] Elemento ${element.id} redimensionado para ${element.w}x${element.h}`);
    }
    
    this.isResizing = false;
    this.resizeElement = null;
    this.resizeElementDom = null;
    this.resizeHandle = null;
  }
};

console.log('[JJK GUI Builder] Drag & Resize Systems carregados');

// ============================================================================
// 7. PROPERTIES PANEL - PAINEL DE PROPRIEDADES
// ============================================================================

/**
 * PropertiesPanel - Gerencia o painel de propriedades do elemento selecionado
 */
const PropertiesPanel = {
  /**
   * Atualiza o painel de propriedades com os dados do elemento selecionado
   */
  update() {
    const noSelection = document.getElementById('no-selection');
    const propsPanel = document.getElementById('props-panel');
    
    if (!AppState.selectedElement) {
      if (noSelection) noSelection.style.display = 'block';
      if (propsPanel) propsPanel.style.display = 'none';
      return;
    }
    
    if (noSelection) noSelection.style.display = 'none';
    if (propsPanel) propsPanel.style.display = 'block';
    
    const el = AppState.selectedElement;
    
    // Propriedades básicas
    this.setInputValue('prop-x', el.x);
    this.setInputValue('prop-y', el.y);
    this.setInputValue('prop-w', el.w);
    this.setInputValue('prop-h', el.h);
    this.setInputValue('prop-z', el.z);
    this.setInputValue('prop-opacity', el.opacity);
    
    // Mostra/esconde grupos de propriedades específicas
    this.showPropGroup('prop-text-group', el.type === 'text');
    this.showPropGroup('prop-bar-group', ['barHealth', 'barEnergy'].includes(el.type));
    this.showPropGroup('prop-image-group', el.type === 'image');
    this.showPropGroup('prop-skill-group', el.type === 'skillSlot');
    this.showPropGroup('prop-buff-group', ['buff', 'debuff'].includes(el.type));
    
    // Propriedades específicas de texto
    if (el.type === 'text') {
      this.setInputValue('prop-text-content', el.text);
      this.setInputValue('prop-font-size', el.fontSize);
      this.setInputValue('prop-text-color', el.textColor);
      this.setColorPreview('prop-text-color-preview', el.textColor);
    }
    
    // Propriedades específicas de barras
    if (['barHealth', 'barEnergy'].includes(el.type)) {
      this.setInputValue('prop-bar-fill', el.value);
      document.getElementById('prop-bar-fill-value').textContent = el.value;
      this.setInputValue('prop-bar-direction', el.direction);
      this.setInputValue('prop-bar-show-text', el.showText ? 'true' : 'false');
    }
    
    // Propriedades específicas de imagem
    if (el.type === 'image') {
      this.setInputValue('prop-image-grayscale', el.grayscale);
    }
    
    // Propriedades específicas de skill slot
    if (el.type === 'skillSlot') {
      this.setInputValue('prop-skill-key', el.skillKey);
      this.setInputValue('prop-skill-cooldown', el.cooldown);
      this.setInputValue('prop-skill-active', el.active ? 'true' : 'false');
    }
    
    // Propriedades específicas de buff/debuff
    if (['buff', 'debuff'].includes(el.type)) {
      this.setInputValue('prop-buff-duration', el.duration);
      this.setInputValue('prop-buff-timer', Math.round((el.remainingTime / el.duration) * 100));
    }
    
    console.log('[PropertiesPanel] Painel atualizado');
  },
  
  /**
   * Define valor de um input
   * @param {string} id 
   * @param {*} value 
   */
  setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input && value !== undefined) {
      input.value = value;
    }
  },
  
  /**
   * Mostra ou esconde um grupo de propriedades
   * @param {string} groupId 
   * @param {boolean} show 
   */
  showPropGroup(groupId, show) {
    const group = document.getElementById(groupId);
    if (group) {
      group.style.display = show ? 'block' : 'none';
    }
  },
  
  /**
   * Atualiza preview de cor
   * @param {string} id 
   * @param {string} color 
   */
  setColorPreview(id, color) {
    const preview = document.getElementById(id);
    if (preview) {
      preview.style.backgroundColor = color;
    }
  }
};

/**
 * Atualiza propriedade do elemento selecionado
 * @param {string} prop - Nome da propriedade
 * @param {*} value - Novo valor
 * @param {string} elementId - ID do elemento (opcional, usa selectedElement se não fornecido)
 */
function updateProp(prop, value, elementId) {
  const element = elementId 
    ? AppState.elements.find(el => el.id === elementId)
    : AppState.selectedElement;
  
  if (!element) return;
  
  // Converte tipos conforme necessário
  switch (prop) {
    case 'x':
    case 'y':
    case 'w':
    case 'h':
    case 'z':
    case 'fontSize':
    case 'borderWidth':
    case 'opacity':
    case 'grayscale':
    case 'cooldown':
    case 'duration':
      value = parseFloat(value) || 0;
      break;
    
    case 'value':
    case 'barFill':
      value = parseFloat(value) || 0;
      if (element.type === 'barHealth' || element.type === 'barEnergy') {
        element.value = value;
        updateBarDOM(element);
        return;
      }
      break;
    
    case 'showText':
    case 'active':
    case 'glow':
      value = value === 'true' || value === true;
      break;
    
    case 'text':
      element.text = value;
      const textEl = document.querySelector(`#${element.id}.el-text`);
      if (textEl) textEl.textContent = value;
      return;
    
    case 'textColor':
      element.textColor = value;
      const textColorEl = document.querySelector(`#${element.id}.el-text`);
      if (textColorEl) textColorEl.style.color = value;
      return;
    
    case 'direction':
      element.direction = value;
      updateBarDOM(element);
      return;
    
    case 'skillKey':
      element.skillKey = value.toUpperCase().substring(0, 3);
      const keyEl = document.querySelector(`#${element.id} .skill-key`);
      if (keyEl) keyEl.textContent = element.skillKey;
      return;
  }
  
  // Salva estado para undo
  HistorySystem.saveState();
  
  // Atualiza elemento
  StateManager.updateElement(element.id, { [prop]: value });
  
  // Atualiza DOM se elemento estiver selecionado
  if (AppState.selectedElement?.id === element.id) {
    updateElementDOM(element);
  }
  
  // Atualiza minimapa
  if (typeof updateMinimap === 'function') {
    updateMinimap();
  }
  
  console.log(`[updateProp] ${prop} = ${value}`);
}

/**
 * Atualiza barra de progresso no DOM
 * @param {Object} element 
 */
function updateBarDOM(element) {
  const barEl = document.querySelector(`#${element.id}.el-barHealth, #${element.id}.el-barEnergy`);
  if (!barEl) return;
  
  const fill = barEl.querySelector('.bar-fill');
  const text = barEl.querySelector('.bar-text');
  
  if (fill) {
    const percent = ((element.value - element.minValue) / (element.maxValue - element.minValue)) * 100;
    
    if (element.direction === 'horizontal') {
      fill.style.width = `${percent}%`;
      fill.style.height = '100%';
    } else {
      fill.style.height = `${percent}%`;
      fill.style.width = '100%';
      fill.style.bottom = '0';
    }
  }
  
  if (text && element.showText) {
    text.textContent = element.textFormat
      .replace('{value}', element.value)
      .replace('{percent}', Math.round(percent));
  }
}

/**
 * Atualiza elemento DOM com novas propriedades
 * @param {Object} element 
 */
function updateElementDOM(element) {
  const elDiv = document.getElementById(element.id);
  if (!elDiv) return;
  
  elDiv.style.left = `${element.x}px`;
  elDiv.style.top = `${element.y}px`;
  elDiv.style.width = `${element.w}px`;
  elDiv.style.height = `${element.h}px`;
  elDiv.style.zIndex = element.z;
  elDiv.style.opacity = element.opacity / 100;
}

/**
 * Atualiza preenchimento da barra via slider
 * @param {string} value 
 */
function updateBarFill(value) {
  document.getElementById('prop-bar-fill-value').textContent = value;
  updateProp('value', value);
}

/**
 * Seleciona um elemento
 * @param {string} elementId 
 */
function selectElement(elementId) {
  // Desseleciona anterior
  deselectAll();
  
  const element = AppState.elements.find(el => el.id === elementId);
  if (!element) return;
  
  AppState.selectedElement = element;
  
  // Adiciona classe selected
  const elDiv = document.getElementById(elementId);
  if (elDiv) {
    elDiv.classList.add('selected');
    
    // Cria handles de resize
    ResizeSystem.createHandles(elDiv, element);
  }
  
  // Atualiza painel de propriedades
  PropertiesPanel.update();
  
  // Atualiza toolbar flutuante
  updateFloatingToolbar();
  
  console.log(`[selectElement] Elemento ${elementId} selecionado`);
}

/**
 * Desseleciona todos os elementos
 */
function deselectAll() {
  AppState.selectedElement = null;
  
  // Remove classe selected de todos
  document.querySelectorAll('.canvas-element.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Esconde painel de propriedades
  PropertiesPanel.update();
  
  // Esconde toolbar flutuante
  const toolbar = document.getElementById('floating-toolbar');
  if (toolbar) toolbar.style.display = 'none';
}

/**
 * Atualiza toolbar flutuante
 */
function updateFloatingToolbar() {
  const toolbar = document.getElementById('floating-toolbar');
  if (toolbar && AppState.selectedElement) {
    toolbar.style.display = 'flex';
  }
}

console.log('[JJK GUI Builder] Properties Panel carregado');

// ============================================================================
// 8. SAVE/LOAD SYSTEM - SISTEMA DE SALVAMENTO E CARREGAMENTO
// ============================================================================

/**
 * SaveLoadSystem - Gerencia salvamento e carregamento de projetos
 */
const SaveLoadSystem = {
  /**
   * Salva projeto atual como JSON
   * @returns {string} - JSON string do projeto
   */
  save() {
    const projectData = {
      version: '2.0.0',
      name: AppState.projectName,
      timestamp: new Date().toISOString(),
      theme: ThemeEngine.currentTheme,
      canvasSize: AppState.canvasSize,
      elements: AppState.elements.map(el => ({...el})),
      groups: AppState.groups,
      settings: AppState.settings,
      metadata: {
        totalElements: AppState.elements.length,
        lastModified: AppState.lastModified?.toISOString() || new Date().toISOString()
      }
    };
    
    return JSON.stringify(projectData, null, 2);
  },
  
  /**
   * Carrega projeto de JSON string
   * @param {string} jsonString - JSON do projeto
   * @returns {boolean} - true se sucesso
   */
  load(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Formato de projeto inválido');
      }
      
      // Limpa estado atual
      this.clearCanvas();
      
      // Restaura tema se especificado
      if (data.theme && ThemeEngine.hasTheme(data.theme)) {
        ThemeEngine.apply(data.theme);
        document.getElementById('theme-select').value = data.theme;
      }
      
      // Restaura nome do projeto
      if (data.name) {
        AppState.projectName = data.name;
      }
      
      // Restaura elementos
      data.elements.forEach(elData => {
        AppState.elements.push(elData);
        ElementFactory.renderElement(elData);
      });
      
      // Atualiza próximo ID
      AppState.nextElementId = AppState.elements.length + 1;
      
      // Atualiza UI
      StateManager.updateStatusBar();
      updateMinimap();
      CanvasEngine.updateEmptyState();
      
      showToast(`Projeto "${data.name || 'Sem nome'}" carregado!`, 'success');
      console.log('[SaveLoadSystem] Projeto carregado com sucesso');
      
      return true;
    } catch (error) {
      console.error('[SaveLoadSystem] Erro ao carregar:', error);
      showToast('Erro ao carregar projeto: ' + error.message, 'error');
      return false;
    }
  },
  
  /**
   * Baixa arquivo JSON para o usuário
   */
  downloadJSON() {
    const json = this.save();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeFilename(AppState.projectName)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Projeto salvo!', 'success');
  },
  
  /**
   * Trigger para upload de arquivo JSON
   */
  triggerUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.load(event.target.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  },
  
  /**
   * Limpa todos os elementos do canvas
   */
  clearCanvas() {
    AppState.elements.forEach(el => {
      const elDiv = document.getElementById(el.id);
      if (elDiv) elDiv.remove();
    });
    
    AppState.elements = [];
    AppState.selectedElement = null;
    AppState.groups = [];
    AppState.nextElementId = 1;
    
    StateManager.updateStatusBar();
    CanvasEngine.updateEmptyState();
    updateMinimap();
  },
  
  /**
   * Sanitiza nome de arquivo
   * @param {string} name 
   * @returns {string}
   */
  sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
  }
};

/**
 * Funções globais para botões do HTML
 */
function saveProject() {
  SaveLoadSystem.downloadJSON();
}

function triggerLoad() {
  SaveLoadSystem.triggerUpload();
}

function loadProject(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      SaveLoadSystem.load(e.target.result);
    };
    reader.readAsText(file);
  }
  event.target.value = '';
}

// ============================================================================
// 9. EXPORT SYSTEM - SISTEMA DE EXPORTAÇÃO
// ============================================================================

/**
 * ExportSystem - Exporta canvas como PNG ou SVG
 */
const ExportSystem = {
  /**
   * Exporta canvas como PNG usando html2canvas
   */
  async exportPNG() {
    try {
      const canvas = document.getElementById('canvas');
      if (!canvas) throw new Error('Canvas não encontrado');
      
      showToast('Exportando PNG...', 'info');
      
      // Deseleciona elementos antes de exportar
      deselectAll();
      
      // Usa html2canvas para capturar o canvas
      const result = await html2canvas(canvas, {
        backgroundColor: getComputedStyle(canvas).backgroundColor,
        scale: 2, // Alta resolução
        useCORS: true,
        logging: false,
        width: AppState.canvasSize.width,
        height: AppState.canvasSize.height,
        windowWidth: AppState.canvasSize.width,
        windowHeight: AppState.canvasSize.height
      });
      
      // Converte para blob e baixa
      result.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${SaveLoadSystem.sanitizeFilename(AppState.projectName)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('PNG exportado com sucesso!', 'success');
      }, 'image/png');
      
    } catch (error) {
      console.error('[ExportSystem] Erro ao exportar PNG:', error);
      showToast('Erro ao exportar PNG: ' + error.message, 'error');
    }
  },
  
  /**
   * Exporta canvas como SVG
   */
  exportSVG() {
    try {
      const svgContent = this.generateSVG();
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${SaveLoadSystem.sanitizeFilename(AppState.projectName)}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('SVG exportado com sucesso!', 'success');
    } catch (error) {
      console.error('[ExportSystem] Erro ao exportar SVG:', error);
      showToast('Erro ao exportar SVG: ' + error.message, 'error');
    }
  },
  
  /**
   * Gera conteúdo SVG do canvas
   * @returns {string}
   */
  generateSVG() {
    const width = AppState.canvasSize.width;
    const height = AppState.canvasSize.height;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // Fundo
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
    svg += `<rect width="${width}" height="${height}" fill="${bgColor}"/>`;
    
    // Elementos ordenados por z-index
    const sortedElements = [...AppState.elements].sort((a, b) => a.z - b.z);
    
    sortedElements.forEach(el => {
      svg += this.elementToSVG(el);
    });
    
    svg += '</svg>';
    return svg;
  },
  
  /**
   * Converte elemento para SVG
   * @param {Object} el 
   * @returns {string}
   */
  elementToSVG(el) {
    let svg = '';
    const opacity = el.opacity / 100;
    
    switch (el.type) {
      case 'panel':
        svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" 
          fill="${el.backgroundColor}" stroke="${el.borderColor}" 
          stroke-width="${el.borderWidth}" opacity="${opacity}"/>`;
        break;
      
      case 'text':
        svg += `<text x="${el.x + 4}" y="${el.y + el.fontSize}" 
          font-family="${el.fontFamily}" font-size="${el.fontSize}" 
          fill="${el.textColor}" opacity="${opacity}">${this.escapeXML(el.text)}</text>`;
        break;
      
      case 'barHealth':
      case 'barEnergy':
        const percent = ((el.value - el.minValue) / (el.maxValue - el.minValue)) * 100;
        const fillWidth = (el.w * percent) / 100;
        svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" 
          fill="${el.backgroundColor}" stroke="${el.borderColor}" 
          stroke-width="${el.borderWidth}" opacity="${opacity}"/>`;
        svg += `<rect x="${el.x}" y="${el.y}" width="${fillWidth}" height="${el.h}" 
          fill="${el.fillColor}" opacity="${opacity}"/>`;
        break;
    }
    
    return svg;
  },
  
  /**
   * Escapa caracteres XML
   * @param {string} str 
   * @returns {string}
   */
  escapeXML(str) {
    return str.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
      }
    });
  }
};

/**
 * Funções globais para botões do HTML
 */
function exportPNG() {
  ExportSystem.exportPNG();
}

function exportSVG() {
  ExportSystem.exportSVG();
}

console.log('[JJK GUI Builder] Save/Load & Export Systems carregados');

// ============================================================================
// 10. HISTORY SYSTEM - SISTEMA DE UNDO/REDO
// ============================================================================

/**
 * HistorySystem - Gerencia histórico de ações para undo/redo
 */
const HistorySystem = {
  /**
   * Pilha de estados para undo
   * @type {Array<Object>}
   */
  undoStack: [],
  
  /**
   * Pilha de estados para redo
   * @type {Array<Object>}
   */
  redoStack: [],
  
  /**
   * Máximo de estados no histórico
   * @type {number}
   */
  maxHistory: 50,
  
  /**
   * Indica se estamos em meio a uma operação em lote
   * @type {boolean}
   */
  batchMode: false,
  
  /**
   * Salva estado atual no histórico
   * @param {boolean} force - Força salvar mesmo em batch mode
   */
  saveState(force = false) {
    if (this.batchMode && !force) return;
    
    const state = this.serializeState();
    this.undoStack.push(state);
    
    // Limita tamanho da pilha
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    // Limpa redo stack quando nova ação é feita
    this.redoStack = [];
    
    console.log(`[HistorySystem] Estado salvo. Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);
  },
  
  /**
   * Serializa estado atual para armazenamento
   * @returns {Object}
   */
  serializeState() {
    return {
      elements: AppState.elements.map(el => ({...el})),
      selectedElementId: AppState.selectedElement?.id || null,
      nextElementId: AppState.nextElementId,
      groups: [...AppState.groups],
      timestamp: Date.now()
    };
  },
  
  /**
   * Restaura estado da pilha
   * @param {Object} state 
   */
  restoreState(state) {
    // Remove elementos do DOM
    AppState.elements.forEach(el => {
      const elDiv = document.getElementById(el.id);
      if (elDiv) elDiv.remove();
    });
    
    // Restaura elementos
    AppState.elements = state.elements.map(el => ({...el}));
    AppState.nextElementId = state.nextElementId;
    AppState.groups = state.groups;
    
    // Re-renderiza todos os elementos
    AppState.elements.forEach(el => {
      ElementFactory.renderElement(el);
    });
    
    // Restaura seleção
    if (state.selectedElementId) {
      selectElement(state.selectedElementId);
    } else {
      deselectAll();
    }
    
    // Atualiza UI
    StateManager.updateStatusBar();
    updateMinimap();
    CanvasEngine.updateEmptyState();
  },
  
  /**
   * Executa undo
   * @returns {boolean}
   */
  undo() {
    if (this.undoStack.length === 0) {
      showToast('Nada para desfazer', 'warning');
      return false;
    }
    
    // Salva estado atual na pilha de redo
    this.redoStack.push(this.serializeState());
    
    // Restaura estado anterior
    const previousState = this.undoStack.pop();
    this.restoreState(previousState);
    
    showToast('Desfeito', 'info');
    console.log('[HistorySystem] Undo executado');
    
    return true;
  },
  
  /**
   * Executa redo
   * @returns {boolean}
   */
  redo() {
    if (this.redoStack.length === 0) {
      showToast('Nada para refazer', 'warning');
      return false;
    }
    
    // Salva estado atual na pilha de undo
    this.undoStack.push(this.serializeState());
    
    // Restaura estado da pilha de redo
    const nextState = this.redoStack.pop();
    this.restoreState(nextState);
    
    showToast('Refeito', 'info');
    console.log('[HistorySystem] Redo executado');
    
    return true;
  },
  
  /**
   * Inicia modo batch (múltiplas operações como uma)
   */
  beginBatch() {
    this.batchMode = true;
  },
  
  /**
   * Finaliza modo batch e salva estado
   */
  endBatch() {
    this.batchMode = false;
    this.saveState(true);
  },
  
  /**
   * Limpa todo o histórico
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    console.log('[HistorySystem] Histórico limpo');
  },
  
  /**
   * Obtém estatísticas do histórico
   * @returns {Object}
   */
  getStats() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      total: this.undoStack.length + this.redoStack.length
    };
  }
};

/**
 * Funções globais para botões do HTML
 */
function undo() {
  HistorySystem.undo();
}

function redo() {
  HistorySystem.redo();
}

// ============================================================================
// 11. KEYBOARD SHORTCUTS - ATALHOS DE TECLADO
// ============================================================================

/**
 * KeyboardShortcuts - Gerencia atalhos de teclado
 */
const KeyboardShortcuts = {
  /**
   * Mapeamento de atalhos
   */
  shortcuts: {
    'ctrl+z': () => HistorySystem.undo(),
    'ctrl+y': () => HistorySystem.redo(),
    'ctrl+d': () => duplicateSelected(),
    'delete': () => deleteSelected(),
    'backspace': () => deleteSelected(),
    'ctrl+s': () => saveProject(),
    'ctrl+e': () => exportPNG(),
    'ctrl++': () => zoomIn(),
    'ctrl+-': () => zoomOut(),
    'ctrl+0': () => zoomReset(),
    'escape': () => deselectAll(),
    'arrowup': (shift) => moveSelection(0, shift ? -16 : -1),
    'arrowdown': (shift) => moveSelection(0, shift ? 16 : 1),
    'arrowleft': (shift) => moveSelection(shift ? -16 : -1, 0),
    'arrowright': (shift) => moveSelection(shift ? 16 : 1, 0)
  },
  
  /**
   * Inicializa listeners de teclado
   */
  init() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    console.log('[KeyboardShortcuts] Inicializado');
  },
  
  /**
   * Handler de keydown
   * @param {KeyboardEvent} e 
   */
  onKeyDown(e) {
    // Ignora se estiver em input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const key = this.normalizeKey(e);
    const shortcut = this.shortcuts[key];
    
    if (shortcut) {
      e.preventDefault();
      const shiftPressed = e.shiftKey;
      shortcut(shiftPressed);
    }
  },
  
  /**
   * Normaliza tecla para formato do mapeamento
   * @param {KeyboardEvent} e 
   * @returns {string}
   */
  normalizeKey(e) {
    let key = e.key.toLowerCase();
    
    // Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      key = 'ctrl+' + key;
    }
    
    // Shift
    if (e.shiftKey && !key.includes('ctrl+')) {
      key = 'shift+' + key;
    }
    
    return key;
  }
};

/**
 * Move elemento selecionado
 * @param {number} dx 
 * @param {number} dy 
 */
function moveSelection(dx, dy) {
  if (!AppState.selectedElement) return;
  
  const el = AppState.selectedElement;
  const elDiv = document.getElementById(el.id);
  
  HistorySystem.saveState();
  
  let newX = el.x + dx;
  let newY = el.y + dy;
  
  // Aplica limites
  newX = Math.max(0, Math.min(newX, AppState.canvasSize.width - el.w));
  newY = Math.max(0, Math.min(newY, AppState.canvasSize.height - el.h));
  
  // Aplica snap se ativado
  if (AppState.snapToGrid) {
    newX = CanvasEngine.applySnap(newX);
    newY = CanvasEngine.applySnap(newY);
  }
  
  el.x = newX;
  el.y = newY;
  
  if (elDiv) {
    elDiv.style.left = `${newX}px`;
    elDiv.style.top = `${newY}px`;
  }
  
  PropertiesPanel.update();
  updateMinimap();
}

// ============================================================================
// 12. MINIMAP SYSTEM - MINI-MAPA
// ============================================================================

/**
 * MinimapSystem - Renderiza mini-mapa do canvas
 */
const MinimapSystem = {
  /**
   * Escala do minimapa
   */
  scale: 200 / 1280,
  
  /**
   * Inicializa minimapa
   */
  init() {
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas?.getContext('2d');
    this.viewport = document.getElementById('minimap-viewport');
  },
  
  /**
   * Atualiza renderização do minimapa
   */
  update() {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Limpa canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fundo
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Desenha elementos
    const sortedElements = [...AppState.elements].sort((a, b) => a.z - b.z);
    
    sortedElements.forEach(el => {
      ctx.fillStyle = this.getElementColor(el.type);
      ctx.fillRect(
        el.x * this.scale,
        el.y * this.scale,
        el.w * this.scale,
        el.h * this.scale
      );
    });
    
    // Atualiza viewport
    this.updateViewport();
  },
  
  /**
   * Obtém cor para tipo de elemento
   * @param {string} type 
   * @returns {string}
   */
  getElementColor(type) {
    const colors = {
      panel: '#444444',
      hatch: '#666666',
      text: '#FFFFFF',
      image: '#888888',
      barHealth: '#E53935',
      barEnergy: '#00E5FF',
      skillSlot: '#FFAA00',
      buff: '#00FF88',
      debuff: '#FF3355',
      curseMark: '#8B0000',
      technique: '#00E5FF',
      domain: '#FF00FF',
      manaCrystal: '#9D4EDD'
    };
    return colors[type] || '#888888';
  },
  
  /**
   * Atualiza indicador de viewport
   */
  updateViewport() {
    if (!this.viewport) return;
    
    const panel = document.getElementById('panel-center');
    if (!panel) return;
    
    const scrollX = panel.scrollLeft / AppState.zoom;
    const scrollY = panel.scrollTop / AppState.zoom;
    const viewWidth = panel.clientWidth / AppState.zoom;
    const viewHeight = panel.clientHeight / AppState.zoom;
    
    this.viewport.style.left = `${scrollX * this.scale}px`;
    this.viewport.style.top = `${scrollY * this.scale}px`;
    this.viewport.style.width = `${viewWidth * this.scale}px`;
    this.viewport.style.height = `${viewHeight * this.scale}px`;
  }
};

/**
 * Função global para update do minimapa
 */
function updateMinimap() {
  MinimapSystem.update();
}

console.log('[JJK GUI Builder] History, Shortcuts & Minimap carregados');

// ============================================================================
// 13. ALIGNMENT TOOLS - FERRAMENTAS DE ALINHAMENTO
// ============================================================================

/**
 * AlignmentTools - Ferramentas de alinhamento de elementos
 */
const AlignmentTools = {
  /**
   * Alinha múltiplos elementos selecionados
   * @param {string} alignment - Tipo de alinhamento
   */
  align(alignment) {
    if (!AppState.selectedElement) {
      showToast('Selecione um elemento para alinhar', 'warning');
      return;
    }
    
    // Para simplificação, alinha apenas o elemento selecionado ao canvas
    const el = AppState.selectedElement;
    const elDiv = document.getElementById(el.id);
    
    HistorySystem.saveState();
    
    let newX = el.x;
    let newY = el.y;
    
    switch (alignment) {
      case 'left':
        newX = 0;
        break;
      case 'center':
        newX = (AppState.canvasSize.width - el.w) / 2;
        break;
      case 'right':
        newX = AppState.canvasSize.width - el.w;
        break;
      case 'top':
        newY = 0;
        break;
      case 'middle':
        newY = (AppState.canvasSize.height - el.h) / 2;
        break;
      case 'bottom':
        newY = AppState.canvasSize.height - el.h;
        break;
    }
    
    // Aplica snap se ativado
    if (AppState.snapToGrid) {
      newX = CanvasEngine.applySnap(newX);
      newY = CanvasEngine.applySnap(newY);
    }
    
    el.x = newX;
    el.y = newY;
    
    if (elDiv) {
      elDiv.style.left = `${newX}px`;
      elDiv.style.top = `${newY}px`;
    }
    
    PropertiesPanel.update();
    updateMinimap();
    
    showToast(`Alinhado ao ${this.getAlignmentName(alignment)}`, 'success');
  },
  
  /**
   * Obtém nome legível do alinhamento
   * @param {string} alignment 
   * @returns {string}
   */
  getAlignmentName(alignment) {
    const names = {
      left: 'esquerda',
      center: 'centro horizontal',
      right: 'direita',
      top: 'topo',
      middle: 'centro vertical',
      bottom: 'base'
    };
    return names[alignment] || alignment;
  }
};

/**
 * Função global para alinhamento
 * @param {string} alignment 
 */
function alignElements(alignment) {
  AlignmentTools.align(alignment);
}

// ============================================================================
// 14. LAYER MANAGEMENT - GERENCIAMENTO DE CAMADAS
// ============================================================================

/**
 * LayerManager - Gerencia camadas (z-index) dos elementos
 */
const LayerManager = {
  /**
   * Traz elemento para frente
   */
  bringToFront() {
    if (!AppState.selectedElement) {
      showToast('Selecione um elemento', 'warning');
      return;
    }
    
    const el = AppState.selectedElement;
    const maxZ = Math.max(...AppState.elements.map(e => e.z), 0);
    
    HistorySystem.saveState();
    
    StateManager.updateElement(el.id, { z: maxZ + 1 });
    
    const elDiv = document.getElementById(el.id);
    if (elDiv) elDiv.style.zIndex = maxZ + 1;
    
    this.updateLayersList();
    console.log(`[LayerManager] Elemento ${el.id} trazido para frente (z=${maxZ + 1})`);
  },
  
  /**
   * Envia elemento para trás
   */
  sendToBack() {
    if (!AppState.selectedElement) {
      showToast('Selecione um elemento', 'warning');
      return;
    }
    
    const el = AppState.selectedElement;
    const minZ = Math.min(...AppState.elements.map(e => e.z), 1);
    
    HistorySystem.saveState();
    
    StateManager.updateElement(el.id, { z: minZ - 1 });
    
    const elDiv = document.getElementById(el.id);
    if (elDiv) elDiv.style.zIndex = minZ - 1;
    
    this.updateLayersList();
    console.log(`[LayerManager] Elemento ${el.id} enviado para trás (z=${minZ - 1})`);
  },
  
  /**
   * Atualiza lista de camadas no painel
   */
  updateLayersList() {
    const listEl = document.getElementById('layers-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    const sortedElements = [...AppState.elements].sort((a, b) => b.z - a.z);
    
    sortedElements.forEach((el, index) => {
      const item = document.createElement('div');
      item.className = 'layer-item';
      if (AppState.selectedElement?.id === el.id) {
        item.classList.add('active');
      }
      
      item.innerHTML = `
        <span style="color: ${this.getElementColor(el.type)}">●</span>
        <span class="layer-name">${el.name || el.type}</span>
        <span class="layer-zindex">Z: ${el.z}</span>
      `;
      
      item.onclick = () => selectElement(el.id);
      
      listEl.appendChild(item);
    });
  },
  
  /**
   * Obtém cor para tipo de elemento
   * @param {string} type 
   * @returns {string}
   */
  getElementColor(type) {
    const colors = {
      panel: '#888888',
      hatch: '#AAAAAA',
      text: '#FFFFFF',
      image: '#CCCCCC',
      barHealth: '#E53935',
      barEnergy: '#00E5FF',
      skillSlot: '#FFAA00',
      buff: '#00FF88',
      debuff: '#FF3355',
      curseMark: '#8B0000',
      technique: '#00E5FF',
      domain: '#FF00FF',
      manaCrystal: '#9D4EDD'
    };
    return colors[type] || '#888888';
  }
};

/**
 * Funções globais para botões do HTML
 */
function bringToFront() {
  LayerManager.bringToFront();
}

function sendToBack() {
  LayerManager.sendToBack();
}

// ============================================================================
// 15. UTILITY FUNCTIONS - FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Mostra modal de atalhos
 */
function showShortcuts() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.classList.add('active');
}

/**
 * Fecha modal de atalhos
 */
function closeShortcuts() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.classList.remove('active');
}

/**
 * Zoom in
 */
function zoomIn() {
  CanvasEngine.setZoom(AppState.zoom + 0.1);
}

/**
 * Zoom out
 */
function zoomOut() {
  CanvasEngine.setZoom(AppState.zoom - 0.1);
}

/**
 * Reset zoom
 */
function zoomReset() {
  CanvasEngine.setZoom(1.0);
}

/**
 * Toggle snap to grid
 */
function toggleSnap() {
  CanvasEngine.toggleSnap();
}

/**
 * Toggle visibilidade do grid
 */
function toggleGridVisibility() {
  CanvasEngine.toggleGridVisibility();
}

/**
 * Toggle snap magnético
 */
function toggleMagneticSnap() {
  CanvasEngine.toggleMagneticSnap();
}

/**
 * Duplica elemento selecionado
 */
function duplicateSelected() {
  if (!AppState.selectedElement) {
    showToast('Selecione um elemento para duplicar', 'warning');
    return;
  }
  
  const original = AppState.selectedElement;
  const copy = { ...original };
  
  copy.id = StateManager.generateId();
  copy.x = original.x + 20;
  copy.y = original.y + 20;
  copy.name = `${original.name} (Cópia)`;
  
  StateManager.addElement(copy);
  ElementFactory.renderElement(copy);
  selectElement(copy.id);
  
  HistorySystem.saveState();
  showToast('Elemento duplicado!', 'success');
}

/**
 * Deleta elemento selecionado
 */
function deleteSelected() {
  if (!AppState.selectedElement) {
    showToast('Selecione um elemento para deletar', 'warning');
    return;
  }
  
  const el = AppState.selectedElement;
  const elDiv = document.getElementById(el.id);
  
  HistorySystem.saveState();
  
  // Remove do DOM
  if (elDiv) elDiv.remove();
  
  // Remove do estado
  StateManager.removeElement(el.id);
  
  // Atualiza UI
  deselectAll();
  StateManager.updateStatusBar();
  updateMinimap();
  CanvasEngine.updateEmptyState();
  LayerManager.updateLayersList();
  
  showToast('Elemento deletado', 'info');
}

/**
 * Adiciona elemento ao canvas
 * @param {string} type - Tipo do elemento
 */
function addElement(type) {
  const element = ElementFactory.create(type);
  
  if (element) {
    HistorySystem.saveState();
    LayerManager.updateLayersList();
    showToast(`${element.name} adicionado!`, 'success');
  }
}

/**
 * Upload de imagem para elemento
 * @param {HTMLInputElement} input 
 */
function uploadImage(input) {
  if (!AppState.selectedElement || AppState.selectedElement.type !== 'image') {
    showToast('Selecione um elemento de imagem', 'warning');
    return;
  }
  
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    updateProp('src', e.target.result);
    showToast('Imagem carregada!', 'success');
  };
  reader.readAsDataURL(file);
  
  input.value = '';
}

console.log('[JJK GUI Builder] Utility functions carregadas');

// ============================================================================
// 16. INITIALIZATION - INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================================

/**
 * Inicialização completa da aplicação
 */
function initializeApp() {
  console.group('🎨 JJK GUI Builder - Inicialização');
  console.log('Versão: 2.0.0');
  console.log('Tema inicial:', ThemeEngine.currentTheme);
  
  // Inicializa sistemas
  CanvasEngine.init();
  DragSystem.init();
  ResizeSystem.init();
  MinimapSystem.init();
  KeyboardShortcuts.init();
  
  // Aplica tema inicial
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      ThemeEngine.apply(e.target.value);
    });
  }
  
  // Event listener para fechar modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeShortcuts();
    }
  });
  
  // Click fora do modal fecha
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // Atualiza UI inicial
  StateManager.updateStatusBar();
  CanvasEngine.updateZoomUI();
  CanvasEngine.centerCanvas();
  
  // Salva estado inicial para undo
  HistorySystem.saveState(true);
  
  console.log('✅ Aplicação inicializada com sucesso!');
  console.groupEnd();
}

// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Exporta funções globais para window (para acesso do HTML)
window.JJKGUI = {
  ThemeEngine,
  AppState,
  StateManager,
  CanvasEngine,
  ElementFactory,
  DragSystem,
  ResizeSystem,
  PropertiesPanel,
  SaveLoadSystem,
  ExportSystem,
  HistorySystem,
  KeyboardShortcuts,
  MinimapSystem,
  AlignmentTools,
  LayerManager,
  initializeApp
};

console.log('🎨 JJK GUI Builder Professional v2.0.0 - Pronto para uso!');
console.log('💡 Dica: Pressione ⌨️ Atalhos no topo para ver todos os atalhos de teclado');

// ============================================================================
// 17. ADVANCED FEATURES - RECURSOS AVANÇADOS
// ============================================================================

/**
 * AdvancedFeatures - Recursos avançados da aplicação
 */
const AdvancedFeatures = {
  /**
   * Modo de preview (simula como ficaria no jogo)
   */
  previewMode: false,
  
  /**
   * Grade de alinhamento inteligente
   */
  smartGrid: {
    enabled: true,
    sensitivity: 10,
    showGuides: true
  },
  
  /**
   * Sistema de grupos de elementos
   */
  groups: [],
  
  /**
   * Animações e efeitos
   */
  animations: {
    enabled: true,
    speed: 1.0,
    quality: 'high'
  },
  
  /**
   * Ativa/desativa modo preview
   */
  togglePreview() {
    this.previewMode = !this.previewMode;
    
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.toggle('preview-mode', this.previewMode);
    }
    
    // Esconde elementos de UI no preview
    document.querySelectorAll('.resize-handle').forEach(h => {
      h.style.display = this.previewMode ? 'none' : 'block';
    });
    
    showToast(this.previewMode ? 'Modo Preview ATIVADO' : 'Modo Preview DESATIVADO', 'info');
  },
  
  /**
   * Cria guia de alinhamento temporária
   * @param {number} x 
   * @param {number} y 
   */
  createGuide(x, y) {
    if (!this.smartGrid.showGuides) return;
    
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Guia vertical
    if (x !== undefined) {
      const guideV = document.createElement('div');
      guideV.className = 'alignment-guide guide-vertical';
      guideV.style.left = `${x}px`;
      guideV.style.top = '0';
      guideV.style.width = '1px';
      guideV.style.height = '100%';
      guideV.style.position = 'absolute';
      guideV.style.background = '#00E5FF';
      guideV.style.opacity = '0.5';
      guideV.style.pointerEvents = 'none';
      guideV.style.zIndex = '9999';
      canvas.appendChild(guideV);
      
      setTimeout(() => guideV.remove(), 500);
    }
    
    // Guia horizontal
    if (y !== undefined) {
      const guideH = document.createElement('div');
      guideH.className = 'alignment-guide guide-horizontal';
      guideH.style.left = '0';
      guideH.style.top = `${y}px`;
      guideH.style.width = '100%';
      guideH.style.height = '1px';
      guideH.style.position = 'absolute';
      guideH.style.background = '#00E5FF';
      guideH.style.opacity = '0.5';
      guideH.style.pointerEvents = 'none';
      guideH.style.zIndex = '9999';
      canvas.appendChild(guideH);
      
      setTimeout(() => guideH.remove(), 500);
    }
  },
  
  /**
   * Detecta alinhamentos próximos para snap inteligente
   * @param {Object} element 
   * @returns {Object} - { x: number|null, y: number|null }
   */
  detectSmartSnap(element) {
    const result = { x: null, y: null };
    const sensitivity = this.smartGrid.sensitivity;
    
    AppState.elements.forEach(other => {
      if (other.id === element.id) return;
      
      // Verifica alinhamento com bordas do outro elemento
      const edges = {
        left: other.x,
        right: other.x + other.w,
        center: other.x + other.w / 2,
        top: other.y,
        bottom: other.y + other.h,
        middle: other.y + other.h / 2
      };
      
      const currentEdges = {
        left: element.x,
        right: element.x + element.w,
        center: element.x + element.w / 2,
        top: element.y,
        bottom: element.y + element.h,
        middle: element.y + element.h / 2
      };
      
      // Verifica proximidade em X
      for (const [edgeName, edgeValue] of Object.entries(edges)) {
        if (Math.abs(currentEdges.left - edgeValue) < sensitivity) {
          result.x = edgeValue;
          break;
        }
        if (Math.abs(currentEdges.right - edgeValue) < sensitivity) {
          result.x = edgeValue - element.w;
          break;
        }
        if (Math.abs(currentEdges.center - edgeValue) < sensitivity) {
          result.x = edgeValue - element.w / 2;
          break;
        }
      }
      
      // Verifica proximidade em Y
      for (const [edgeName, edgeValue] of Object.entries(edges)) {
        if (edgeName === 'left' || edgeName === 'right' || edgeName === 'center') continue;
        
        if (Math.abs(currentEdges.top - edgeValue) < sensitivity) {
          result.y = edgeValue;
          break;
        }
        if (Math.abs(currentEdges.bottom - edgeValue) < sensitivity) {
          result.y = edgeValue - element.h;
          break;
        }
        if (Math.abs(currentEdges.middle - edgeValue) < sensitivity) {
          result.y = edgeValue - element.h / 2;
          break;
        }
      }
    });
    
    return result;
  },
  
  /**
   * Agrupa elementos selecionados
   */
  groupSelected() {
    if (!AppState.selectedElement) {
      showToast('Selecione pelo menos um elemento', 'warning');
      return;
    }
    
    const groupId = `group_${Date.now()}`;
    const group = {
      id: groupId,
      name: `Grupo ${this.groups.length + 1}`,
      elements: [AppState.selectedElement.id],
      created: Date.now()
    };
    
    this.groups.push(group);
    showToast(`Grupo "${group.name}" criado!`, 'success');
  },
  
  /**
   * Desagrupa elemento
   */
  ungroupSelected() {
    if (!AppState.selectedElement) return;
    
    const groupIndex = this.groups.findIndex(g => 
      g.elements.includes(AppState.selectedElement.id)
    );
    
    if (groupIndex > -1) {
      this.groups.splice(groupIndex, 1);
      showToast('Elemento desagrupado', 'info');
    }
  },
  
  /**
   * Exporta estatísticas do projeto
   * @returns {Object}
   */
  getProjectStats() {
    const elements = AppState.elements;
    
    return {
      totalElements: elements.length,
      byType: StateManager.countElementsByType(),
      canvasSize: AppState.canvasSize,
      totalArea: elements.reduce((acc, el) => acc + (el.w * el.h), 0),
      averageSize: elements.length > 0 
        ? elements.reduce((acc, el) => acc + (el.w * el.h), 0) / elements.length 
        : 0,
      theme: ThemeEngine.currentTheme,
      lastModified: AppState.lastModified,
      groups: this.groups.length
    };
  },
  
  /**
   * Limpa cache e otimiza performance
   */
  optimize() {
    console.group('🚀 Otimização');
    
    // Remove guias de alinhamento órfãs
    document.querySelectorAll('.alignment-guide').forEach(g => g.remove());
    
    // Força garbage collection de elementos removidos
    AppState.elements.forEach(el => {
      const elDiv = document.getElementById(el.id);
      if (!elDiv && el.visible) {
        console.warn(`Elemento ${el.id} sem DOM correspondente`);
      }
    });
    
    console.log('✅ Otimização concluída');
    console.groupEnd();
  }
};

/**
 * Funções globais para recursos avançados
 */
function togglePreview() {
  AdvancedFeatures.togglePreview();
}

function groupSelected() {
  AdvancedFeatures.groupSelected();
}

function ungroupSelected() {
  AdvancedFeatures.ungroupSelected();
}

// ============================================================================
// 18. ANIMATION SYSTEM - SISTEMA DE ANIMAÇÕES CSS
// ============================================================================

/**
 * AnimationSystem - Gerencia animações e keyframes dinâmicos
 */
const AnimationSystem = {
  /**
   * Keyframes predefinidos
   */
  keyframes: {
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
    `,
    float: `
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
    `,
    glow: `
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 10px currentColor; }
        50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
      }
    `,
    expand: `
      @keyframes expand {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `,
    shake: `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }
    `,
    spin: `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  },
  
  /**
   * Injeta keyframes no documento
   */
  init() {
    const styleId = 'dynamic-keyframes';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    let css = '';
    for (const [name, keyframe] of Object.entries(this.keyframes)) {
      css += keyframe;
    }
    
    styleEl.textContent = css;
    console.log('[AnimationSystem] Keyframes injetados');
  },
  
  /**
   * Aplica animação a um elemento
   * @param {string} elementId 
   * @param {string} animationName 
   * @param {number} duration 
   * @param {boolean} infinite 
   */
  apply(elementId, animationName, duration = 1, infinite = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.style.animation = `${animationName} ${duration}s ease ${infinite ? 'infinite' : 'once'}`;
  },
  
  /**
   * Remove animação de um elemento
   * @param {string} elementId 
   */
  remove(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.style.animation = '';
  }
};

// ============================================================================
// 19. ACCESSIBILITY - ACESSIBILIDADE
// ============================================================================

/**
 * Accessibility - Recursos de acessibilidade
 */
const Accessibility = {
  /**
   * Alto contraste ativado
   */
  highContrast: false,
  
  /**
   * Tamanho da fonte aumentado
   */
  largeText: false,
  
  /**
   * Toggle alto contraste
   */
  toggleHighContrast() {
    this.highContrast = !this.highContrast;
    document.body.classList.toggle('high-contrast', this.highContrast);
    
    if (this.highContrast) {
      document.documentElement.style.setProperty('--text-color', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-color', '#000000');
      document.documentElement.style.setProperty('--border-color', '#FFFFFF');
    } else {
      ThemeEngine.apply(ThemeEngine.currentTheme);
    }
    
    showToast(this.highContrast ? 'Alto contraste ATIVADO' : 'Alto contraste DESATIVADO', 'info');
  },
  
  /**
   * Toggle texto grande
   */
  toggleLargeText() {
    this.largeText = !this.largeText;
    document.body.classList.toggle('large-text', this.largeText);
    
    if (this.largeText) {
      document.body.style.fontSize = '20px';
    } else {
      document.body.style.fontSize = '18px';
    }
    
    showToast(this.largeText ? 'Texto grande ATIVADO' : 'Texto grande DESATIVADO', 'info');
  },
  
  /**
   * Lê nome do elemento selecionado (para screen readers)
   */
  announceSelection() {
    if (!AppState.selectedElement) return;
    
    const announcement = `Elemento selecionado: ${AppState.selectedElement.name || AppState.selectedElement.type}`;
    console.log(`📢 ${announcement}`);
    
    // Poderia usar Web Speech API aqui
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = 'pt-BR';
      speechSynthesis.speak(utterance);
    }
  }
};

/**
 * Funções globais de acessibilidade
 */
function toggleHighContrast() {
  Accessibility.toggleHighContrast();
}

function toggleLargeText() {
  Accessibility.toggleLargeText();
}

// ============================================================================
// 20. PERFORMANCE MONITOR - MONITOR DE PERFORMANCE
// ============================================================================

/**
 * PerformanceMonitor - Monitora performance da aplicação
 */
const PerformanceMonitor = {
  /**
   * Frame count para FPS
   */
  frameCount: 0,
  
  /**
   * Último tempo de medição
   */
  lastTime: performance.now(),
  
  /**
   * FPS atual
   */
  fps: 0,
  
  /**
   * Inicia monitoramento
   */
  start() {
    const measure = () => {
      this.frameCount++;
      
      const now = performance.now();
      const delta = now - this.lastTime;
      
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = now;
        
        // Atualiza UI se existir
        const fpsEl = document.getElementById('statusbar-fps');
        if (fpsEl) {
          fpsEl.textContent = `${this.fps} FPS`;
          fpsEl.style.color = this.fps >= 50 ? '#00FF88' : this.fps >= 30 ? '#FFAA00' : '#FF3355';
        }
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
    console.log('[PerformanceMonitor] Iniciado');
  },
  
  /**
   * Obtém relatório de performance
   * @returns {Object}
   */
  getReport() {
    return {
      fps: this.fps,
      elementCount: AppState.elements.length,
      memoryUsage: performance.memory 
        ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` 
        : 'N/A',
      theme: ThemeEngine.currentTheme
    };
  }
};

console.log('[JJK GUI Builder] Advanced Features, Animations, Accessibility & Performance carregados');
