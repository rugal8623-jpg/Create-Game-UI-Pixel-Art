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