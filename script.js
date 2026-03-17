/* ═══════════════════════════════════════════════
   KONSTANTEN & STATE
═══════════════════════════════════════════════ */
if (localStorage.getItem('lager_auth') !== 'true') {
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('lager_auth');
    localStorage.removeItem('lager_user');
    window.location.href = 'index.html';
}
/** @type {string} localStorage-Schlüssel für die Fächer-Daten */
const STORAGE_KEY = 'lager_slots';

/** @type {string} localStorage-Schlüssel für den Spalten-Index */
const COL_KEY = 'lager_col_idx';

/** @type {number[]} Verfügbare Spaltenanzahlen für das Raster */
const COL_OPTIONS = [2, 3, 4, 5, 6];

/**
 * @typedef {Object} Slot
 * @property {number}  id      - Eindeutige ID
 * @property {string}  name    - Bezeichnung des Fachs
 * @property {string}  note    - Freitext / Inhaltsbeschreibung
 * @property {string}  updated - Zeitstempel der letzten Änderung
 */

/** @type {Slot[]} Alle Fächer im aktuellen Zustand */
let slots = [];

/** @type {number} Nächste zu verwendende ID */
let nextId = 1;

/** @type {number|null} ID des gerade bearbeiteten Fachs (null = neues Fach) */
let editingId = null;

/** @type {Object[]} Temperatureinträge des aktuell geöffneten Fachs (Arbeitskopie) */
let tempEntries = [];

/** @type {number} Aktueller Index in COL_OPTIONS */
let colIdx = 2;

/** @type {Object<string,string>} Anzeigetexte für Status-Werte */
const STATUS_LABELS = {
    leer: 'Ungereinigt',
    voll: 'Voll',
    gereinigt: 'Gereinigt',
    reserviert: 'Reserviert',
};

/* ═══════════════════════════════════════════════
   PERSISTENZ
═══════════════════════════════════════════════ */

/**
 * Lädt Fächer und Raster-Einstellung aus dem localStorage.
 * Sind keine Daten vorhanden, werden Beispiel-Fächer erzeugt.
 * @returns {void}
 */
function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            slots = JSON.parse(raw);
            slots.forEach(s => { if (!s.temperatures) s.temperatures = []; });
            nextId = slots.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        } else {
            slots = defaultSlots();
            nextId = slots.length + 1;
        }
    } catch (e) {
        console.warn('localStorage lesen fehlgeschlagen:', e);
        slots = defaultSlots();
        nextId = slots.length + 1;
    }

    try {
        const ci = localStorage.getItem(COL_KEY);
        if (ci !== null) colIdx = parseInt(ci, 10);
    } catch (_) { }
}

/**
 * Speichert den aktuellen Zustand (Fächer + Spaltenindex) in den localStorage.
 * @returns {void}
 */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
        localStorage.setItem(COL_KEY, String(colIdx));
    } catch (e) {
        console.warn('localStorage schreiben fehlgeschlagen:', e);
        showToast('⚠ Speichern fehlgeschlagen – localStorage voll?');
    }
}

/**
 * Gibt die Standard-Beispieldaten zurück, die beim ersten Start geladen werden.
 * @returns {Slot[]}
 */
function defaultSlots() {
    const t = nowTimestamp();
    return [
        { id: 1, name: 'Regal A1', status: 'leer', temperatures: [], updated: t },
        { id: 2, name: 'Regal A2', status: 'voll', temperatures: [], updated: t },
        { id: 3, name: 'Regal A3', status: 'gereinigt', temperatures: [], updated: t },
        { id: 4, name: 'Regal B1', status: 'gereinigt', temperatures: [], updated: t },
        { id: 5, name: 'Regal B2', status: 'reserviert', temperatures: [], updated: t },
        { id: 6, name: 'Regal B3', status: 'leer', temperatures: [], updated: t },
        { id: 7, name: 'Kühlzone 1', status: 'voll', temperatures: [], updated: t },
        { id: 8, name: 'Kühlzone 2', status: 'leer', temperatures: [], updated: t },
        { id: 9, name: 'Außenlager 1', status: 'gereinigt', temperatures: [], updated: t },
    ];
}

/* ═══════════════════════════════════════════════
   HILFSFUNKTIONEN
═══════════════════════════════════════════════ */

/**
 * Gibt den aktuellen Zeitstempel als lesbaren deutschen String zurück.
 * @returns {string} z.B. "16.03.2026 14:35"
 */
function nowTimestamp() {
    const d = new Date();
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Zeigt eine kurze Toast-Nachricht am unteren Bildschirmrand.
 * @param {string} msg - Die anzuzeigende Nachricht
 * @param {number} [duration=2200] - Anzeigedauer in Millisekunden
 * @returns {void}
 */
function showToast(msg, duration = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════════ */

/**
 * Rendert die Statistik-Karten (Gesamtanzahl + je Status).
 * @returns {void}
 */
function renderStats() {
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    slots.forEach(s => counts[s.status]++);

    document.getElementById('stats').innerHTML = `
      <div class="stat">
        <div class="stat-val">${slots.length}</div>
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

/**
 * Rendert das Fächer-Raster inklusive "+ Fach hinzufügen"-Kachel.
 * Die Spaltenanzahl wird aus COL_OPTIONS[colIdx] gelesen.
 * @returns {void}
 */
function renderGrid() {
    const cols = COL_OPTIONS[colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    slots.forEach((sl, i) => {
        const card = document.createElement('div');
        card.className = `slot ${sl.status}`;
        card.innerHTML = `
        <div class="slot-num">Fach ${i + 5}</div>
        <div class="slot-name">${escHtml(sl.name || '(ohne Name)')}</div>
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

/**
 * Kombinierter Render-Aufruf für Stats + Grid.
 * @returns {void}
 */
function render() {
    renderStats();
    renderGrid();
}

/**
 * Escaped HTML-Sonderzeichen, um XSS zu verhindern.
 * @param {string} str - Rohtext
 * @returns {string} Sicherer HTML-String
 */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════
   LAYOUT
═══════════════════════════════════════════════ */

/**
 * Schaltet die Raster-Spaltenanzahl zyklisch weiter (2 → 3 → 4 → 5 → 6 → 2 …).
 * Speichert die Auswahl in localStorage.
 * @returns {void}
 */
function cycleLayout() {
    colIdx = (colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

/**
 * Öffnet das Modal für ein neues Fach (leere Felder).
 * @returns {void}
 */
function openAdd() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Neues Fach';
    document.getElementById('f-name').value = '';
    setDropdownValue('leer');
    tempEntries = [];
    renderTempList();
    document.getElementById('f-date').value = nowTimestamp();
    document.getElementById('del-btn').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-name').focus();
}

/**
 * Öffnet das Modal im Bearbeitungsmodus für ein bestehendes Fach.
 * @param {number} id - ID des zu bearbeitenden Fachs
 * @returns {void}
 */
function openEdit(id) {
    const sl = slots.find(s => s.id === id);
    if (!sl) return;
    editingId = id;
    document.getElementById('modal-title').textContent = `Fach ${id + 4} bearbeiten`;
    document.getElementById('f-name').value = sl.name;
    setDropdownValue(sl.status);
    tempEntries = sl.temperatures ? [...sl.temperatures] : [];
    renderTempList();
    document.getElementById('f-date').value = sl.updated;
    document.getElementById('del-btn').style.display = 'inline-block';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-name').focus();
}

/**
 * Schließt das Modal ohne Änderungen zu speichern.
 * @returns {void}
 */
function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

/**
 * Schließt das Modal wenn der Klick auf den Overlay-Hintergrund (nicht den Inhalt) trifft.
 * @param {MouseEvent} event - Das Klick-Event
 * @returns {void}
 */
function onOverlayClick(event) {
    if (event.target.id === 'overlay') closeModal();
}

/**
 * Speichert das aktuelle Modal-Formular als neues oder bearbeitetes Fach.
 * Validiert den Namen, aktualisiert localStorage und re-rendert die Ansicht.
 * @returns {void}
 */
function saveSlot() {
    const name = document.getElementById('f-name').value.trim() || 'Neues Fach';
    const status = document.getElementById('f-status').value;
    const updated = nowTimestamp();

    if (editingId !== null) {
        const sl = slots.find(s => s.id === editingId);
        if (sl) { sl.name = name; sl.status = status; sl.temperatures = tempEntries; sl.updated = updated; }
    } else {
        slots.push({ id: nextId++, name, status, temperatures: tempEntries, updated });
    }

    saveToStorage();
    closeModal();
    render();
    showToast(editingId !== null ? '✓ Fach gespeichert' : '✓ Fach hinzugefügt');
}

/**
 * Löscht das aktuell im Modal geöffnete Fach nach Bestätigung.
 * Aktualisiert localStorage und re-rendert die Ansicht.
 * @returns {void}
 */
function deleteSlot() {
    if (editingId === null) return;
    const sl = slots.find(s => s.id === editingId);
    const name = sl ? sl.name : 'Fach';
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    slots = slots.filter(s => s.id !== editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Fach gelöscht');
}

/* ═══════════════════════════════════════════════
   KEYBOARD
═══════════════════════════════════════════════ */

/**
 * Globaler Keyboard-Handler:
 * - Escape schließt das Modal
 * - Enter im Modal speichert (außer in textarea)
 * @param {KeyboardEvent} e
 * @returns {void}
 */
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('overlay').classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        saveSlot();
    }
});

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */

/**
 * Einstiegspunkt: Daten laden und erste Darstellung aufbauen.
 * @returns {void}
 */
(function init() {
    loadFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${slots.length} Fächer geladen · Klicke auf ein Fach zum Bearbeiten`;
})();

/**
* Öffnet oder schließt das custom Dropdown.
* @param {MouseEvent} e
*/
function toggleDropdown(e) {
    e.stopPropagation();
    document.getElementById('status-dropdown').classList.toggle('open');
}

/**
 * Wählt einen Status-Eintrag aus der Liste aus.
 * Setzt hidden input, Label-Text und markiert die aktive li.
 * @param {HTMLElement} li - Das geklickte <li>-Element
 */
function selectStatus(li) {
    const value = li.dataset.value;
    document.getElementById('f-status').value = value;
    document.getElementById('cs-label').textContent = li.querySelector('.badge').textContent;
    document.querySelectorAll('.cs-item').forEach(i => i.classList.remove('selected'));
    li.classList.add('selected');
    document.getElementById('status-dropdown').classList.remove('open');
}

/**
 * Setzt das custom Dropdown auf einen bestimmten Wert.
 * Wird beim Öffnen des Modals aufgerufen statt .value = ...
 * @param {string} value - z.B. "leer" | "voll" | ...
 */
function setDropdownValue(value) {
    const li = document.querySelector(`.cs-item[data-value="${value}"]`);
    if (li) selectStatus(li);
}

// Dropdown schließen wenn irgendwo anders hingeklickt wird
document.addEventListener('click', () => {
    document.getElementById('status-dropdown')?.classList.remove('open');
});

/* ═══════════════════════════════════════════════
   TEMPERATUR-EINTRÄGE
═══════════════════════════════════════════════ */

const SICHT_LABELS = { ok: 'OK', schaedling: 'Schädlingsbefall', schimmel: 'Schimmel' };

function toggleTempEntry(el) {
    el.classList.toggle('open');
}

function isTempLocked(entry) {
    return Date.now() - entry.savedAtMs > 60000;
}

function renderTempList() {
    const list = document.getElementById('temp-list');
    if (!list) return;
    if (tempEntries.length === 0) {
        list.innerHTML = '<div class="temp-empty">Noch keine Einträge</div>';
        return;
    }
    list.innerHTML = tempEntries.map((e) => {
        const locked = isTempLocked(e);
        return `
          <div class="temp-entry${locked ? ' temp-locked' : ''}" onclick="toggleTempEntry(this)">
            <div class="temp-entry-preview">
              <span class="temp-preview-range">${e.von}°C – ${e.bis}°C</span>
              <span class="temp-preview-date">${escHtml(e.savedAtDisplay)}</span>
            </div>
            <div class="temp-entry-details">
              <div class="temp-detail-row"><span class="temp-detail-lbl">Sichtkontrolle</span><span>${escHtml(e.sicht)}</span></div>
              <div class="temp-detail-row"><span class="temp-detail-lbl">Maßnahmen</span><span>${escHtml(e.massnahmen)}</span></div>
              <div class="temp-entry-meta">
                <span>${escHtml(e.savedAtDisplay)}</span>
                <span>${escHtml(e.savedBy)}</span>
              </div>
            </div>
          </div>`;
    }).join('');
}

function openTempForm() {
    document.getElementById('t-von').value = '';
    document.getElementById('t-bis').value = '';
    document.getElementById('t-sicht').value = '';
    document.getElementById('t-massnahmen').value = '';
    document.getElementById('temp-overlay').classList.add('open');
    document.getElementById('t-von').focus();
}

function closeTempForm() {
    document.getElementById('temp-overlay').classList.remove('open');
}

function onTempOverlayClick(event) {
    if (event.target.id === 'temp-overlay') closeTempForm();
}

function saveTempEntry() {
    const von = parseFloat(document.getElementById('t-von').value);
    const bis = parseFloat(document.getElementById('t-bis').value);
    const sicht = document.getElementById('t-sicht').value.trim();
    const massnahmen = document.getElementById('t-massnahmen').value.trim();
    if (isNaN(von) || document.getElementById('t-von').value === '') {
        showToast('Bitte Temperatur "von" eingeben.');
        return;
    }
    if (isNaN(bis) || document.getElementById('t-bis').value === '') {
        showToast('Bitte Temperatur "bis" eingeben.');
        return;
    }
    if (!sicht) {
        showToast('Bitte Sichtkontrolle eingeben.');
        return;
    }
    if (!massnahmen) {
        showToast('Bitte durchgeführte Maßnahmen eingeben.');
        return;
    }
    const now = new Date();
    tempEntries.push({
        von,
        bis,
        sicht,
        massnahmen,
        savedBy: localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs: now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    });
    closeTempForm();
    renderTempList();
}