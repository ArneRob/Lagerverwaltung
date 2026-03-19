import { showToast } from './utils.js';
import { state } from './state.js';
import { returnHoseNoteEntryTemplate } from './template.js';

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
