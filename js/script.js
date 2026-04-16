// ── State ──
const state = {
  transactions: [],
  customCategories: [], // persisted list of user-defined category names
  sortMode: 'default',
  theme: 'light'
};

// ── Currency Formatter (Indonesian Rupiah) ──
function formatCurrency(amount) {
  // Format as "Rp 1.234.567" using dot as thousands separator, no decimals
  return 'Rp\u00a0' + Math.round(Number(amount)).toLocaleString('id-ID');
}

// ── Amount input: raw numeric value stored separately ──
// The #amount input is a text field displaying "Rp 1.234.567".
// We store the raw number in a data attribute and read it on submit.

function formatAmountInput(raw) {
  // raw: string of digits only
  if (!raw) return '';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

function wireUpAmountInput() {
  wireUpAmountInputEl(document.getElementById('amount'));
}

// ── Sort Transactions ──
function sortTransactions(transactions, mode) {
  const copy = transactions.slice();
  if (mode === 'amount') {
    copy.sort((a, b) => b.amount - a.amount);
  } else if (mode === 'category') {
    copy.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // 'default': reverse insertion order (newest first)
    copy.reverse();
  }
  return copy;
}

// ── Category Badge ──
// Built-in categories use CSS classes; custom categories get an inline background color.
const customCategoryMap = new Map();

function getCategoryBadgeClass(category) {
  if (category === 'Food') return 'badge-food';
  if (category === 'Transport') return 'badge-transport';
  if (category === 'Fun') return 'badge-fun';
  return 'badge-custom'; // generic class — color applied inline
}

function getCategoryBadgeStyle(category) {
  if (['Food', 'Transport', 'Fun'].includes(category)) return '';
  return 'background:' + getChartColor(category) + ';color:#fff;';
}

// ── Render Transaction List ──
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';
  const sorted = sortTransactions(state.transactions, state.sortMode);

  sorted.forEach(function (t) {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = t.id;

    // ── View row ──
    const viewRow = document.createElement('div');
    viewRow.className = 'tx-view-row';

    const info = document.createElement('div');
    info.className = 'transaction-info';

    const name = document.createElement('span');
    name.className = 'transaction-name';
    name.textContent = t.name;

    const meta = document.createElement('div');
    meta.className = 'transaction-meta';

    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = formatCurrency(t.amount);

    const badge = document.createElement('span');
    badge.className = 'category-badge ' + getCategoryBadgeClass(t.category);
    const badgeStyle = getCategoryBadgeStyle(t.category);
    if (badgeStyle) badge.setAttribute('style', badgeStyle);
    badge.textContent = t.category;

    meta.appendChild(amountSpan);
    meta.appendChild(badge);
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'tx-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit ' + t.name);
    editBtn.addEventListener('click', function () {
      openEditRow(li, t);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete ' + t.name);
    deleteBtn.addEventListener('click', function () {
      deleteTransaction(t.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    viewRow.appendChild(info);
    viewRow.appendChild(actions);
    li.appendChild(viewRow);
    list.appendChild(li);
  });
}

// ── Inline edit row ──
function openEditRow(li, t) {
  // If another row is already in edit mode, close it first
  const existing = document.querySelector('.tx-edit-row');
  if (existing) existing.remove();
  const existingView = document.querySelector('.tx-view-row.hidden');
  if (existingView) existingView.classList.remove('hidden');

  const viewRow = li.querySelector('.tx-view-row');
  viewRow.classList.add('hidden');

  const editRow = document.createElement('div');
  editRow.className = 'tx-edit-row';

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'edit-input';
  nameInput.value = t.name;
  nameInput.setAttribute('aria-label', 'Edit item name');

  // Amount input (formatted)
  const amountWrapper = document.createElement('div');
  amountWrapper.className = 'amount-wrapper edit-amount-wrapper';
  const amountPrefix = document.createElement('span');
  amountPrefix.className = 'amount-prefix';
  amountPrefix.setAttribute('aria-hidden', 'true');
  amountPrefix.textContent = 'Rp';
  const amountInput = document.createElement('input');
  amountInput.type = 'text';
  amountInput.className = 'edit-input';
  amountInput.inputMode = 'numeric';
  amountInput.setAttribute('aria-label', 'Edit amount');
  amountInput.value = formatAmountInput(String(t.amount));
  amountInput.dataset.rawValue = String(t.amount);
  wireUpAmountInputEl(amountInput);
  amountWrapper.appendChild(amountPrefix);
  amountWrapper.appendChild(amountInput);

  // Category select
  const catSelect = document.createElement('select');
  catSelect.className = 'edit-input category-select';
  catSelect.setAttribute('aria-label', 'Edit category');
  renderCategoryOptions(catSelect);
  catSelect.value = t.category;

  // Error span
  const errSpan = document.createElement('span');
  errSpan.className = 'edit-error';

  // Save / Cancel buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'edit-btn-row';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'save-edit-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', function () {
    const newName = nameInput.value.trim();
    const rawDigits = amountInput.dataset.rawValue || amountInput.value.replace(/\D/g, '');
    const newAmount = parseInt(rawDigits, 10);
    const newCategory = catSelect.value;

    const result = validateForm({ name: newName, amount: newAmount, category: newCategory, customCategory: '' });
    if (!result.valid) {
      errSpan.textContent = result.errors.join(' ');
      return;
    }
    updateTransaction(t.id, newName, newAmount, newCategory);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cancel-edit-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function () {
    editRow.remove();
    viewRow.classList.remove('hidden');
  });

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);

  editRow.appendChild(nameInput);
  editRow.appendChild(amountWrapper);
  editRow.appendChild(catSelect);
  editRow.appendChild(errSpan);
  editRow.appendChild(btnRow);

  li.appendChild(editRow);
  nameInput.focus();
}

// Attach amount formatting to any input element (used for edit rows)
function wireUpAmountInputEl(input) {
  input.addEventListener('input', function () {
    const digits = this.value.replace(/\D/g, '');
    this.value = formatAmountInput(digits);
    this.dataset.rawValue = digits;
  });
  input.addEventListener('focus', function () {
    const len = this.value.length;
    this.setSelectionRange(len, len);
  });
  input.addEventListener('keydown', function (e) {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

// ── Render ──
function render() {
  renderTransactionList();
  renderBalance();
  renderChart(document.getElementById('spending-chart'), state.transactions);
  renderCustomCategoryManager();
}

function renderCustomCategoryManager() {
  const container = document.getElementById('custom-category-list');
  if (!container) return;
  container.innerHTML = '';

  if (state.customCategories.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'cat-empty';
    empty.textContent = 'No custom categories yet.';
    container.appendChild(empty);
    return;
  }

  state.customCategories.forEach(function (cat) {
    const row = document.createElement('div');
    row.className = 'cat-row';

    const swatch = document.createElement('span');
    swatch.className = 'cat-swatch';
    swatch.style.background = getChartColor(cat);

    const label = document.createElement('span');
    label.className = 'cat-label';
    label.textContent = cat;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'cat-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', 'Delete category ' + cat);
    delBtn.addEventListener('click', function () {
      deleteCustomCategory(cat);
    });

    row.appendChild(swatch);
    row.appendChild(label);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

function renderBalance() {
  const total = state.transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
  document.getElementById('balance-display').textContent = formatCurrency(total);
}

// ── Aggregate by Category ──
function aggregateByCategory(transactions) {
  const raw = new Map();
  transactions.forEach(function (t) {
    raw.set(t.category, (raw.get(t.category) || 0) + t.amount);
  });

  const ORDERED_KEYS = ['Food', 'Transport', 'Fun'];
  const result = new Map();

  ORDERED_KEYS.forEach(function (key) {
    if (raw.has(key)) result.set(key, raw.get(key));
  });

  Array.from(raw.keys())
    .filter(function (k) { return !ORDERED_KEYS.includes(k); })
    .sort()
    .forEach(function (k) { result.set(k, raw.get(k)); });

  return result;
}

// ── Chart Color Palette ──
const CHART_COLORS = {
  Food:      '#FF6384',
  Transport: '#36A2EB',
  Fun:       '#FFCE56'
};

// Reserved hues (degrees) from the fixed palette — custom colors must stay away from these
const RESERVED_HUES = [
  348, // #FF6384 — Food (red-pink)
  207, // #36A2EB — Transport (blue)
  48,  // #FFCE56 — Fun (yellow)
];

// Cache: category name → generated hex color
const customColorCache = new Map();

/**
 * Deterministically generate a visually distinct HSL color for a custom category.
 * Uses a golden-angle step through hue space, then checks distance from reserved hues.
 */
function generateCustomColor(index) {
  const GOLDEN_ANGLE = 137.508; // degrees
  const SATURATION   = 68;      // %
  const LIGHTNESS    = 52;      // %
  const MIN_DISTANCE = 28;      // minimum hue distance from reserved hues

  let hue;
  let attempt = index;
  // Advance until we land far enough from all reserved hues
  do {
    hue = (attempt * GOLDEN_ANGLE) % 360;
    const tooClose = RESERVED_HUES.some(function (r) {
      const diff = Math.abs(hue - r);
      return Math.min(diff, 360 - diff) < MIN_DISTANCE;
    });
    if (!tooClose) break;
    attempt++;
  } while (attempt < index + 20); // safety cap

  return hslToHex(hue, SATURATION, LIGHTNESS);
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  function f(n) {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  }
  return '#' + f(0) + f(8) + f(4);
}

function getChartColor(category) {
  if (CHART_COLORS[category]) return CHART_COLORS[category];
  if (!customColorCache.has(category)) {
    customColorCache.set(category, generateCustomColor(customColorCache.size));
  }
  return customColorCache.get(category);
}

// ── Chart hit-test data (rebuilt on every render) ──
let chartSlices = []; // [{ startAngle, endAngle, category, amount, color }]
let chartGeom  = { cx: 0, cy: 0, radius: 0 };

function renderChart(canvas, transactions) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(cx, cy) - 4;

  ctx.clearRect(0, 0, W, H);
  chartSlices = [];
  chartGeom = { cx, cy, radius };

  const legend = document.getElementById('chart-legend');

  if (transactions.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data', cx, cy);

    if (legend) legend.innerHTML = '';
    return;
  }

  const categoryMap = aggregateByCategory(transactions);
  const total = Array.from(categoryMap.values()).reduce(function (s, v) { return s + v; }, 0);

  let startAngle = -Math.PI / 2;
  const legendItems = [];

  // First pass: draw segments and collect slice data
  categoryMap.forEach(function (amount, category) {
    const slice = (amount / total) * Math.PI * 2;
    const endAngle = startAngle + slice;
    const color = getChartColor(category);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pct = Math.round((amount / total) * 100);
    legendItems.push({ color, category, pct, amount });
    chartSlices.push({ startAngle, endAngle, category, amount, color });

    startAngle = endAngle;
  });

  // Second pass: draw % labels inside large-enough slices
  chartSlices.forEach(function (s) {
    const slice = s.endAngle - s.startAngle;
    const pct = Math.round((s.amount / total) * 100);
    if (pct >= 8) {
      const midAngle = s.startAngle + slice / 2;
      const lx = cx + Math.cos(midAngle) * radius * 0.6;
      const ly = cy + Math.sin(midAngle) * radius * 0.6;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', lx, ly);
    }
  });

  // Render HTML legend
  if (legend) {
    legend.innerHTML = legendItems.map(function (item) {
      return '<li class="legend-item">' +
        '<span class="legend-swatch" style="background:' + item.color + '"></span>' +
        '<span class="legend-label" title="' + item.category + '">' + item.category + '</span>' +
        '<span class="legend-pct">' + item.pct + '%</span>' +
        '</li>';
    }).join('');
  }
}

// ── Chart Tooltip ──
(function wireUpChartTooltip() {
  const canvas  = document.getElementById('spending-chart');
  const tooltip = document.getElementById('chart-tooltip');
  if (!canvas || !tooltip) return;

  function getHoveredSlice(e) {
    const rect = canvas.getBoundingClientRect();
    // Scale mouse coords to canvas logical pixels
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    const { cx, cy, radius } = chartGeom;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) return null;

    // atan2 returns angle in [-π, π]; normalise to start from -π/2
    let angle = Math.atan2(dy, dx);
    // Wrap so it matches our startAngle = -π/2 convention
    if (angle < -Math.PI / 2) angle += Math.PI * 2;

    return chartSlices.find(function (s) {
      return angle >= s.startAngle && angle < s.endAngle;
    }) || null;
  }

  canvas.addEventListener('mousemove', function (e) {
    const slice = getHoveredSlice(e);
    if (!slice) {
      tooltip.classList.remove('visible');
      canvas.style.cursor = 'default';
      return;
    }

    canvas.style.cursor = 'pointer';
    tooltip.innerHTML =
      '<span class="tt-swatch" style="background:' + slice.color + '"></span>' +
      '<span class="tt-category">' + slice.category + '</span>' +
      '<span class="tt-amount">' + formatCurrency(slice.amount) + '</span>';

    // Position tooltip near cursor, keeping it inside the viewport
    const rect = canvas.getBoundingClientRect();
    const ttW = tooltip.offsetWidth  || 160;
    const ttH = tooltip.offsetHeight || 48;
    let left = e.clientX + 12;
    let top  = e.clientY - ttH / 2;
    if (left + ttW > window.innerWidth  - 8) left = e.clientX - ttW - 12;
    if (top  < 8)                            top  = 8;
    if (top  + ttH > window.innerHeight - 8) top  = window.innerHeight - ttH - 8;

    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
    tooltip.classList.add('visible');
  });

  canvas.addEventListener('mouseleave', function () {
    tooltip.classList.remove('visible');
    canvas.style.cursor = 'default';
  });

  // Touch: tap to show tooltip briefly
  canvas.addEventListener('touchstart', function (e) {
    const touch = e.touches[0];
    const slice = getHoveredSlice(touch);
    if (!slice) return;
    e.preventDefault();

    tooltip.innerHTML =
      '<span class="tt-swatch" style="background:' + slice.color + '"></span>' +
      '<span class="tt-category">' + slice.category + '</span>' +
      '<span class="tt-amount">' + formatCurrency(slice.amount) + '</span>';

    const ttW = tooltip.offsetWidth  || 160;
    const ttH = tooltip.offsetHeight || 48;
    let left = touch.clientX + 12;
    let top  = touch.clientY - ttH / 2;
    if (left + ttW > window.innerWidth  - 8) left = touch.clientX - ttW - 12;
    if (top  < 8)                            top  = 8;

    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
    tooltip.classList.add('visible');
    setTimeout(function () { tooltip.classList.remove('visible'); }, 2500);
  }, { passive: false });
})();

// ── Dialog (confirm / alert) ──
// A lightweight modal that replaces window.confirm() and window.alert().
// type: 'confirm' shows OK + Cancel; 'alert' shows only OK.
function showDialog({ title, message, type = 'confirm', variant = 'default', onConfirm, onCancel }) {
  const overlay = document.getElementById('dialog-overlay');
  const titleEl = document.getElementById('dialog-title');
  const msgEl   = document.getElementById('dialog-message');
  const okBtn   = document.getElementById('dialog-ok');
  const cancelBtn = document.getElementById('dialog-cancel');

  titleEl.textContent  = title;
  msgEl.textContent    = message;

  // Style the OK button by variant
  okBtn.className = 'dialog-btn dialog-btn-ok';
  if (variant === 'danger')  okBtn.classList.add('dialog-btn-danger');
  if (variant === 'warning') okBtn.classList.add('dialog-btn-warning');

  // Show/hide Cancel
  cancelBtn.style.display = type === 'confirm' ? '' : 'none';
  okBtn.textContent = type === 'confirm' ? 'Yes, proceed' : 'OK';

  overlay.classList.add('visible');
  okBtn.focus();

  // Clone buttons to remove any previous listeners
  const newOk     = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  cancelBtn.replaceWith(newCancel);

  function close() {
    overlay.classList.remove('visible');
  }

  newOk.addEventListener('click', function () {
    close();
    if (onConfirm) onConfirm();
  });

  newCancel.addEventListener('click', function () {
    close();
    if (onCancel) onCancel();
  });

  // Close on backdrop click
  overlay.addEventListener('click', function handler(e) {
    if (e.target === overlay) {
      close();
      overlay.removeEventListener('click', handler);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });
}
function showToast(message, type) {
  const toast = document.getElementById('save-toast');
  toast.textContent = message;
  toast.classList.remove('toast-success');
  if (type === 'success') toast.classList.add('toast-success');
  toast.classList.add('visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    toast.classList.remove('visible');
    toast.classList.remove('toast-success');
  }, 3000);
}

// ── Persistence ──
function persist() {
  try {
    localStorage.setItem('ebv_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('ebv_custom_categories', JSON.stringify(state.customCategories));
  } catch (e) {
    showToast('Data tidak dapat disimpan.');
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ebv_transactions');
    if (raw !== null) state.transactions = JSON.parse(raw);
  } catch (e) {
    state.transactions = [];
    const banner = document.getElementById('storage-banner');
    banner.textContent = 'Data tersimpan tidak dapat dimuat.';
    banner.classList.add('visible');
  }

  try {
    const rawCats = localStorage.getItem('ebv_custom_categories');
    if (rawCats !== null) state.customCategories = JSON.parse(rawCats);
  } catch (e) {
    state.customCategories = [];
  }

  // Migration: pull any custom categories found in transactions that aren't in the list yet
  state.transactions.forEach(function (t) {
    const BUILT_IN = ['Food', 'Transport', 'Fun'];
    if (!BUILT_IN.includes(t.category) && !state.customCategories.includes(t.category)) {
      state.customCategories.push(t.category);
    }
  });

  // Rebuild color cache from scratch in insertion order so colors are always stable
  rebuildColorCache();

  try {
    const savedTheme = localStorage.getItem('ebv_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  } catch (e) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }
}

// ── Core Mutation Functions ──
function addTransaction(name, amount, category) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  state.transactions.push({ id, name, amount, category });
  persist();
  render();
  showToast('Transaction "' + name + '" added successfully.', 'success');
}

function deleteTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  showDialog({
    title: 'Delete Transaction',
    message: 'Are you sure you want to delete "' + tx.name + '"? This action cannot be undone.',
    type: 'confirm',
    variant: 'danger',
    onConfirm: function () {
      state.transactions = state.transactions.filter(t => t.id !== id);
      persist();
      render();
      showToast('Transaction "' + tx.name + '" deleted.', 'success');
    }
  });
}

function updateTransaction(id, name, amount, category) {
  const idx = state.transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  state.transactions[idx] = { id, name, amount, category };
  persist();
  render();
}

function addCustomCategory(name) {
  if (!name || state.customCategories.includes(name)) return;
  state.customCategories.push(name);
  // Pre-generate a stable color for this category
  getChartColor(name);
  persist();
  renderCategoryOptions();
  renderCustomCategoryManager();
}

function deleteCustomCategory(name) {
  // Block deletion if any transaction still uses this category
  const usageCount = state.transactions.filter(t => t.category === name).length;
  if (usageCount > 0) {
    showDialog({
      title: 'Cannot Delete Category',
      message: '"' + name + '" is used by ' + usageCount + ' transaction' +
               (usageCount > 1 ? 's' : '') +
               '. Remove or reassign those transactions before deleting this category.',
      type: 'alert',
      variant: 'warning'
    });
    return;
  }

  showDialog({
    title: 'Delete Category',
    message: 'Are you sure you want to delete the category "' + name + '"? This action cannot be undone.',
    type: 'confirm',
    variant: 'danger',
    onConfirm: function () {
      state.customCategories = state.customCategories.filter(c => c !== name);
      customColorCache.delete(name);
      rebuildColorCache();
      persist();
      render();
      renderCategoryOptions();
      showToast('Category "' + name + '" deleted.', 'success');
    }
  });
}

/**
 * Rebuild customColorCache from scratch using the current state.customCategories order.
 * This ensures colors are always assigned by stable insertion order and deleted
 * categories leave no phantom entries in the cache.
 */
function rebuildColorCache() {
  customColorCache.clear();
  state.customCategories.forEach(function (cat) {
    // generateCustomColor uses customColorCache.size as the index,
    // so we must set each entry in order.
    customColorCache.set(cat, generateCustomColor(customColorCache.size));
  });
}

// ── Render Category <select> options ──
// Rebuilds both the add-form select and the edit-row select (if open).
function renderCategoryOptions(selectEl) {
  const BUILT_IN = ['Food', 'Transport', 'Fun'];
  const targets = selectEl
    ? [selectEl]
    : Array.from(document.querySelectorAll('.category-select'));

  targets.forEach(function (sel) {
    const current = sel.value;
    sel.innerHTML = '';

    // Blank placeholder
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Select category';
    sel.appendChild(blank);

    // Built-in options
    BUILT_IN.forEach(function (cat) {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });

    // Custom category options
    state.customCategories.forEach(function (cat) {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });

    // "Custom…" sentinel for adding new ones (only on the main add-form select)
    if (sel.id === 'category') {
      const customOpt = document.createElement('option');
      customOpt.value = 'Custom';
      customOpt.textContent = 'Custom…';
      sel.appendChild(customOpt);
    }

    // Restore previous selection if still valid
    if (current && Array.from(sel.options).some(o => o.value === current)) {
      sel.value = current;
    }
  });
}

function setSortMode(mode) {
  state.sortMode = mode;
  render();
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('ebv_theme', theme);
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
  }
}

// ── Form Validation ──
function validateForm(formData) {
  const errors = [];

  if (!formData.name || formData.name.trim() === '') {
    errors.push('Item name is required.');
  }

  if (isNaN(formData.amount) || formData.amount <= 0) {
    errors.push('The amount must be greater than 0.');
  }

  if (!formData.category) {
    errors.push('Select a category.');
  } else if (formData.category === 'Custom') {
    if (!formData.customCategory || formData.customCategory.trim() === '') {
      errors.push('Custom category name is required.');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Theme Toggle ──
(function wireUpThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', function () {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });
})();

// ── Sort Controls ──
(function wireUpSortControls() {
  const sortControls = document.getElementById('sort-controls');
  sortControls.addEventListener('click', function (e) {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    const mode = btn.dataset.sort;
    setSortMode(mode);
    sortControls.querySelectorAll('.sort-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
  });
})();

// ── Form Event Handlers ──
(function wireUpForm() {
  const categorySelect = document.getElementById('category');
  const customCategoryField = document.getElementById('custom-category-field');
  const form = document.getElementById('input-form');
  const formError = document.getElementById('form-error');

  categorySelect.addEventListener('change', function () {
    if (this.value === 'Custom') {
      customCategoryField.classList.add('visible');
    } else {
      customCategoryField.classList.remove('visible');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('item-name').value;
    const amountInput = document.getElementById('amount');
    const rawDigits = amountInput.dataset.rawValue || amountInput.value.replace(/\D/g, '');
    const amount = parseInt(rawDigits, 10);
    const category = document.getElementById('category').value;
    const customCategory = document.getElementById('custom-category').value;

    const result = validateForm({ name, amount, category, customCategory });

    if (!result.valid) {
      formError.textContent = result.errors.join(' ');
      return;
    }

    const resolvedCategory = category === 'Custom' ? customCategory.trim() : category;

    // Register new custom category if needed
    if (category === 'Custom') {
      addCustomCategory(resolvedCategory);
    }

    addTransaction(name.trim(), amount, resolvedCategory);

    // Reset form fields
    document.getElementById('item-name').value = '';
    amountInput.value = '';
    amountInput.dataset.rawValue = '';
    categorySelect.value = '';
    document.getElementById('custom-category').value = '';
    customCategoryField.classList.remove('visible');
    formError.textContent = '';
  });
})();

// ── Wire up amount input formatting ──
wireUpAmountInput();

// ── Startup ──
loadFromStorage();
render();
