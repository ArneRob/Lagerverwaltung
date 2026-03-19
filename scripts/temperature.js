import { showToast } from './utils.js';
import { state } from './state.js';
import { returnTempEntryTemplate, returnHoseNoteEntryTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   TEMPERATURE ENTRIES
═══════════════════════════════════════════════ */

/**
 * Returns true if a temperature entry is locked (older than 1 minute).
 * @param {object} entry - The temperature entry.
 * @returns {boolean}
 */
export function isTempLocked(entry) {
    return Date.now() - entry.savedAtMs > 60000;
}

/**
 * Toggles a temperature entry open or closed.
 * @param {HTMLElement} el - The entry element.
 */
export function toggleTempEntry(el) {
    el.classList.toggle('open');
}

/**
 * Renders the temperature list in the warehouse modal.
 */
export function renderTempList() {
    const list = document.getElementById('temp-list');
    if (!list) return;
    if (state.tempEntries.length === 0) {
        list.innerHTML = '<div class="temp-empty">Noch keine Einträge</div>';
        return;
    }
    list.innerHTML = state.tempEntries.map((entry) => {
        const locked = isTempLocked(entry);
        let entryClass = 'temp-entry';
        if (locked) entryClass += ' temp-locked';
        return returnTempEntryTemplate(entry, entryClass);
    }).join('');
}

/**
 * Opens the temperature entry input overlay.
 */
export function openTempForm() {
    document.getElementById('t-von').value        = '';
    document.getElementById('t-bis').value        = '';
    document.getElementById('t-sicht').value      = '';
    document.getElementById('t-massnahmen').value = '';
    document.getElementById('temp-overlay').classList.add('open');
    document.getElementById('t-von').focus();
}

/**
 * Closes the temperature entry input overlay.
 */
export function closeTempForm() {
    document.getElementById('temp-overlay').classList.remove('open');
}

/**
 * Validates and saves a new temperature entry to the state.
 */
export function saveTempEntry() {
    const von        = parseFloat(document.getElementById('t-von').value);
    const bis        = parseFloat(document.getElementById('t-bis').value);
    const sicht      = document.getElementById('t-sicht').value.trim();
    const massnahmen = document.getElementById('t-massnahmen').value.trim();

    if (isNaN(von) || document.getElementById('t-von').value === '') {
        showToast('Bitte Temperatur "von" eingeben.');
        return;
    }
    if (isNaN(bis) || document.getElementById('t-bis').value === '') {
        showToast('Bitte Temperatur "bis" eingeben.');
        return;
    }
    if (!sicht)      { showToast('Bitte Sichtkontrolle eingeben.');           return; }
    if (!massnahmen) { showToast('Bitte durchgeführte Maßnahmen eingeben.');  return; }

    const now = new Date();
    state.tempEntries.push({
        von,
        bis,
        sicht,
        massnahmen,
        savedBy:        localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs:      now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    });
    closeTempForm();
    renderTempList();
}

/* ═══════════════════════════════════════════════
   HOSE NOTES
═══════════════════════════════════════════════ */

/**
 * Returns true if a note entry is locked (older than 1 minute).
 * @param {object} note - The note entry.
 * @returns {boolean}
 */
export function isNoteLocked(note) {
    return Date.now() - note.savedAtMs > 60000;
}

/**
 * Toggles a note entry open or closed.
 * @param {HTMLElement} entryEl - The entry element.
 */
export function toggleNoteEntry(entryEl) {
    entryEl.classList.toggle('open');
}

/**
 * Renders the note list inside the hose modal.
 */
export function renderHoseNoteList() {
    const listEl = document.getElementById('sc-notiz-list');
    if (!listEl) return;
    if (state.hoseNoteEntries.length === 0) {
        listEl.innerHTML = '<div class="temp-empty">Noch keine Notizen</div>';
        return;
    }
    listEl.innerHTML = state.hoseNoteEntries.map((note) => {
        let entryClass = 'temp-entry';
        if (isNoteLocked(note)) {
            entryClass += ' temp-locked';
        }
        return returnHoseNoteEntryTemplate(note, entryClass);
    }).join('');
}

/**
 * Opens the note input overlay.
 */
export function openNoteForm() {
    document.getElementById('sn-text').value = '';
    document.getElementById('schlauch-notiz-overlay').classList.add('open');
    document.getElementById('sn-text').focus();
}

/**
 * Closes the note input overlay.
 */
export function closeNoteForm() {
    document.getElementById('schlauch-notiz-overlay').classList.remove('open');
}

/**
 * Saves a new note entry to the state and re-renders the note list.
 */
export function saveNoteEntry() {
    const text = document.getElementById('sn-text').value.trim();
    if (!text) {
        showToast('Bitte einen Notiztext eingeben.');
        return;
    }
    const now = new Date();
    state.hoseNoteEntries.push({
        text,
        savedBy:        localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs:      now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    });
    closeNoteForm();
    renderHoseNoteList();
}
