import { escHtml, showToast, nowTimestamp, logout } from './utils.js';
import { state, COL_OPTIONS, STATUS_LABELS, loadFromStorage, saveToStorage } from './state.js';
import { renderTempList, openTempForm, closeTempForm, saveTempEntry, toggleTempEntry } from './temperature.js';

/* ═══════════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════════ */

function renderStats() {
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    state.slots.forEach(s => counts[s.status]++);

    document.getElementById('stats').innerHTML = `
      <div class="stat">
        <div class="stat-val">${state.slots.length}</div>
        <div class="stat-lbl">Gesamt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-voll-txt)">${counts.voll}</div>
        <div class="stat-lbl">Voll</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-reserviert-txt)">${counts.reserviert}</div>
        <div class="stat-lbl">Reserviert</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer + counts.gereinigt}</div>
        <div class="stat-lbl">Leer</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-gereinigt-txt)">${counts.gereinigt}</div>
        <div class="stat-lbl">Gereinigt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer}</div>
        <div class="stat-lbl">Ungereinigt</div>
      </div>
    `;
}

function renderGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...state.slots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((sl) => {
        const card = document.createElement('div');
        card.className = `slot ${sl.status}`;
        const lastPartie = sl.parties && sl.parties.length > 0
            ? sl.parties[sl.parties.length - 1].value : '—';
        card.innerHTML = `
          <div class="slot-num">Fach ${sl.slotNumber}</div>
          <div class="slot-name">${escHtml(lastPartie)}</div>
          <div class="badge ${sl.status}">${STATUS_LABELS[sl.status]}</div>
          <div class="slot-info">${escHtml(sl.updated)}</div>
        `;
        card.addEventListener('click', () => openEdit(sl.id));
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-slot';
    addBtn.innerHTML = '<div class="plus">+</div><div>Fach hinzufügen</div>';
    addBtn.addEventListener('click', openAdd);
    grid.appendChild(addBtn);
}

function render() {
    renderStats();
    renderGrid();
}

function cycleLayout() {
    state.colIdx = (state.colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

function openAdd() {
    state.editingId = null;
    document.getElementById('modal-title').innerHTML =
        'Fach <input id="f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
    document.getElementById('f-frucht').value = '';
    state.editingParties = [];
    renderPartieDropdownLabel();
    setDropdownValue('leer');
    state.tempEntries = [];
    renderTempList();
    document.getElementById('f-date').value = nowTimestamp();
    document.getElementById('del-btn').style.display = 'none';
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-num').focus();
}

function openEdit(id) {
    const sl = state.slots.find(s => s.id === id);
    if (!sl) return;
    state.editingId = id;
    document.getElementById('modal-title').textContent = `Fach ${sl.slotNumber}`;
    document.getElementById('f-frucht').value = sl.fruchtart || '';
    state.editingParties = sl.parties ? sl.parties.map(p => ({ ...p })) : [];
    renderPartieDropdownLabel();
    setDropdownValue(sl.status);
    state.tempEntries = sl.temperatures ? [...sl.temperatures] : [];
    renderTempList();
    document.getElementById('f-date').value = sl.updated;
    document.getElementById('del-btn').style.display = 'inline-block';
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

function saveSlot() {
    const numInput   = document.getElementById('f-num');
    const slotNumber = state.editingId !== null
        ? state.slots.find(s => s.id === state.editingId)?.slotNumber
        : (parseInt(numInput?.value, 10) || state.nextId + 4);
    const fruchtart = document.getElementById('f-frucht').value.trim();
    const status    = document.getElementById('f-status').value;
    const updated   = nowTimestamp();

    if (state.editingParties.length === 0) {
        showToast('Bitte mindestens eine Partie-Nummer hinzufügen.');
        return;
    }

    if (state.editingId !== null) {
        const sl = state.slots.find(s => s.id === state.editingId);
        if (sl) {
            sl.parties      = state.editingParties;
            sl.fruchtart    = fruchtart;
            sl.status       = status;
            sl.temperatures = state.tempEntries;
            sl.updated      = updated;
        }
    } else {
        state.slots.push({
            id: state.nextId++, slotNumber, fruchtart,
            parties: state.editingParties, status,
            temperatures: state.tempEntries, updated,
        });
    }

    saveToStorage();
    closeModal();
    render();
    showToast(state.editingId !== null ? '✓ Fach gespeichert' : '✓ Fach hinzugefügt');
}

function deleteSlot() {
    if (state.editingId === null) return;
    const sl       = state.slots.find(s => s.id === state.editingId);
    const lastName = sl && sl.parties && sl.parties.length > 0
        ? sl.parties[sl.parties.length - 1].value : 'Fach';
    if (!confirm(`"${lastName}" wirklich löschen?`)) return;
    state.slots = state.slots.filter(s => s.id !== state.editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Fach gelöscht');
}

/* ═══════════════════════════════════════════════
   STATUS-DROPDOWN
═══════════════════════════════════════════════ */

function toggleDropdown(e) {
    e.stopPropagation();
    document.getElementById('status-dropdown').classList.toggle('open');
}

function selectStatus(li) {
    const value = li.dataset.value;
    document.getElementById('f-status').value = value;
    document.getElementById('cs-label').textContent = li.querySelector('.badge').textContent;
    document.querySelectorAll('.cs-item').forEach(i => i.classList.remove('selected'));
    li.classList.add('selected');
    document.getElementById('status-dropdown').classList.remove('open');
}

function setDropdownValue(value) {
    const li = document.querySelector(`.cs-item[data-value="${value}"]`);
    if (li) selectStatus(li);
}

/* ═══════════════════════════════════════════════
   PARTIE-DROPDOWN
═══════════════════════════════════════════════ */

function renderPartieDropdownLabel() {
    const last = state.editingParties.length > 0
        ? state.editingParties[state.editingParties.length - 1].value
        : 'Keine vorhanden';
    document.getElementById('pn-label').textContent = last;
}

function togglePartieDropdown(e) {
    e.stopPropagation();
    const dd      = document.getElementById('partie-dropdown');
    const opening = !dd.classList.contains('open');
    dd.classList.toggle('open');
    if (opening) populatePartieList();
    document.getElementById('pn-new-row').style.display = 'none';
}

function populatePartieList() {
    const list = document.getElementById('pn-list');
    if (state.editingParties.length === 0) {
        list.innerHTML = '<li class="pn-empty">Noch keine Partie-Nummern</li>';
        return;
    }
    const reversed = [...state.editingParties].reverse();
    list.innerHTML = reversed.map(p =>
        `<li class="pn-item">${escHtml(p.value)}<span class="pn-item-date">${escHtml(p.addedAt)}</span></li>`
    ).join('');
}

function openNewPartieInput() {
    document.getElementById('partie-dropdown').classList.remove('open');
    const row = document.getElementById('pn-new-row');
    row.style.display = 'flex';
    document.getElementById('pn-new-input').value = '';
    document.getElementById('pn-new-input').focus();
}

function confirmNewPartie() {
    const val = document.getElementById('pn-new-input').value.trim();
    if (!val) { showToast('Bitte Partie-Nummer eingeben.'); return; }
    const now = new Date();
    state.editingParties.push({
        value:      val,
        addedAt:    now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        addedAtMs:  now.getTime(),
    });
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('pn-new-input').value = '';
    renderPartieDropdownLabel();
    showToast('✓ Partie-Nummer hinzugefügt');
}

/* ═══════════════════════════════════════════════
   EVENT HANDLER & INIT
═══════════════════════════════════════════════ */

function init() {
    loadFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${state.slots.length} Fächer geladen · Klicke auf ein Fach zum Bearbeiten`;

    // Topbar
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('layout-btn').addEventListener('click', cycleLayout);
    document.getElementById('add-btn').addEventListener('click', openAdd);

    // Haupt-Overlay
    document.getElementById('overlay').addEventListener('click', (e) => {
        if (e.target.id === 'overlay') closeModal();
    });
    document.getElementById('del-btn').addEventListener('click', deleteSlot);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveSlot);

    // Status-Dropdown
    document.getElementById('status-trigger').addEventListener('click', toggleDropdown);
    document.querySelectorAll('.cs-item').forEach(li => {
        li.addEventListener('click', () => selectStatus(li));
    });

    // Partie-Dropdown
    document.getElementById('partie-trigger').addEventListener('click', togglePartieDropdown);
    document.getElementById('partie-add-btn').addEventListener('click', openNewPartieInput);
    document.getElementById('pn-ok-btn').addEventListener('click', confirmNewPartie);
    document.getElementById('pn-new-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmNewPartie(); }
    });

    // Temperatur-Overlay
    document.getElementById('temp-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'temp-overlay') closeTempForm();
    });
    document.getElementById('temp-add-btn').addEventListener('click', openTempForm);
    document.getElementById('temp-cancel-btn').addEventListener('click', closeTempForm);
    document.getElementById('temp-save-btn').addEventListener('click', saveTempEntry);

    // Temperaturliste – Event-Delegation für dynamische Einträge
    document.getElementById('temp-list').addEventListener('click', (e) => {
        const entry = e.target.closest('.temp-entry');
        if (entry) toggleTempEntry(entry);
    });

    // Tastatur
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('overlay').classList.contains('open')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter'
            && e.target.tagName !== 'TEXTAREA'
            && e.target.id !== 'pn-new-input'
            && e.target.id !== 'f-num') {
            e.preventDefault();
            saveSlot();
        }
    });

    // Dropdowns bei Klick außerhalb schließen
    document.addEventListener('click', () => {
        document.getElementById('status-dropdown')?.classList.remove('open');
        document.getElementById('partie-dropdown')?.classList.remove('open');
    });
}

init();
