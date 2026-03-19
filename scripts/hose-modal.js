import { showToast, nowTimestamp } from './utils.js';
import { state, saveHoseToStorage } from './state.js';
import { render } from './render.js';
import { renderHoseNoteList } from './hose-note.js';
import { returnPartieItemTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   MODAL – OPEN / CLOSE
═══════════════════════════════════════════════ */

/**
 * Closes the hose modal.
 */
export function closeHoseModal() {
    document.getElementById('schlauch-overlay').classList.remove('open');
}

/**
 * Populates all modal fields from an existing hose data object,
 * or resets them to an empty state for a new entry.
 * @param {object|null} hose - Existing hose data or null for a new entry.
 */
function loadHoseModalContent(hose) {
    if (hose) {
        document.getElementById('sc-modal-title').textContent = `Schlauch ${hose.slotNumber}`;
        document.getElementById('sc-f-frucht').value          = hose.fruchtart || '';
        if (hose.parties) {
            state.hoseEditingParties = hose.parties.map(party => ({ ...party }));
        } else {
            state.hoseEditingParties = [];
        }
        if (hose.notizen) {
            state.hoseNoteEntries = [...hose.notizen];
        } else {
            state.hoseNoteEntries = [];
        }
        setHoseLocationValue(hose.standort || 'wiese');
        document.getElementById('sc-f-date').value          = hose.updated;
        document.getElementById('sc-del-btn').style.display = 'inline-block';
    } else {
        document.getElementById('sc-modal-title').innerHTML =
            'Schlauch <input id="sc-f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
        document.getElementById('sc-f-frucht').value         = '';
        state.hoseEditingParties                             = [];
        state.hoseNoteEntries                                = [];
        setHoseLocationValue('wiese');
        document.getElementById('sc-f-date').value           = nowTimestamp();
        document.getElementById('sc-del-btn').style.display  = 'none';
    }
    renderHosePartyDropdownLabel();
    renderHoseNoteList();
    document.getElementById('sc-pn-new-row').style.display = 'none';
}

/**
 * Opens the modal to add a new hose entry.
 */
export function openHoseAdd() {
    state.editingHoseId = null;
    loadHoseModalContent(null);
    document.getElementById('schlauch-overlay').classList.add('open');
    document.getElementById('sc-f-num')?.focus();
}

/**
 * Opens the modal to edit an existing hose entry.
 * @param {number} id - The ID of the hose to edit.
 */
export function openHoseEdit(id) {
    const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === id);
    if (!hose) return;
    state.editingHoseId = id;
    loadHoseModalContent(hose);
    document.getElementById('schlauch-overlay').classList.add('open');
}

/* ═══════════════════════════════════════════════
   SAVE / DELETE
═══════════════════════════════════════════════ */

/**
 * Resolves the hose number – from the existing data when editing,
 * or from the input field when creating a new entry.
 * @returns {number} The hose slot number.
 */
function resolveHoseNumber() {
    if (state.editingHoseId !== null) {
        return state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId)?.slotNumber;
    }
    return parseInt(document.getElementById('sc-f-num')?.value, 10) || state.hoseNextId;
}

/**
 * Saves the current hose entry (new or edited) to the state and storage.
 */
export function saveHose() {
    if (state.hoseEditingParties.length === 0) {
        showToast('Bitte mindestens eine Partie-Nummer hinzufügen.');
        return;
    }

    const slotNumber = resolveHoseNumber();
    const fruchtart  = document.getElementById('sc-f-frucht').value.trim();
    const standort   = document.getElementById('sc-f-standort').value;
    const updated    = nowTimestamp();
    const isNew      = state.editingHoseId === null;

    if (isNew) {
        state.hoseSlots.push({
            id:        state.hoseNextId++,
            slotNumber,
            fruchtart,
            parties:   state.hoseEditingParties,
            standort,
            notizen:   state.hoseNoteEntries,
            updated,
        });
    } else {
        const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId);
        if (hose) {
            hose.fruchtart = fruchtart;
            hose.parties   = state.hoseEditingParties;
            hose.standort  = standort;
            hose.notizen   = state.hoseNoteEntries;
            hose.updated   = updated;
        }
    }

    saveHoseToStorage();
    closeHoseModal();
    render();

    if (isNew) {
        showToast('✓ Schlauch hinzugefügt');
    } else {
        showToast('✓ Schlauch gespeichert');
    }
}

/**
 * Deletes the current hose entry after confirmation.
 */
export function deleteHose() {
    if (state.editingHoseId === null) return;
    const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId);
    if (!confirm(`Schlauch ${hose.slotNumber} wirklich löschen?`)) return;
    state.hoseSlots = state.hoseSlots.filter(hoseEntry => hoseEntry.id !== state.editingHoseId);
    saveHoseToStorage();
    closeHoseModal();
    render();
    showToast('Schlauch gelöscht');
}

/* ═══════════════════════════════════════════════
   PARTY DROPDOWN
═══════════════════════════════════════════════ */

/**
 * Updates the label of the party number dropdown.
 */
export function renderHosePartyDropdownLabel() {
    let last = 'Keine vorhanden';
    if (state.hoseEditingParties.length > 0) {
        last = state.hoseEditingParties[state.hoseEditingParties.length - 1].value;
    }
    document.getElementById('sc-pn-label').textContent = last;
}

/**
 * Toggles the party number dropdown open or closed.
 * @param {MouseEvent} event - The click event.
 */
export function toggleHosePartyDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('sc-partie-dropdown');
    const opening  = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open');
    if (opening) {
        populateHosePartyList();
    }
    document.getElementById('sc-pn-new-row').style.display = 'none';
}

/**
 * Fills the party list in the dropdown with current entries.
 */
function populateHosePartyList() {
    const listEl = document.getElementById('sc-pn-list');
    if (state.hoseEditingParties.length === 0) {
        listEl.innerHTML = '<li class="pn-empty">Noch keine Partie-Nummern</li>';
        return;
    }
    const reversed = [...state.hoseEditingParties].reverse();
    listEl.innerHTML = reversed.map(party => returnPartieItemTemplate(party)).join('');
}

/**
 * Shows the input field for a new party number.
 */
export function openHoseNewPartyInput() {
    document.getElementById('sc-partie-dropdown').classList.remove('open');
    const row = document.getElementById('sc-pn-new-row');
    row.style.display = 'flex';
    document.getElementById('sc-pn-new-input').value = '';
    document.getElementById('sc-pn-new-input').focus();
}

/**
 * Confirms and saves a new party number to the state.
 */
export function confirmHoseNewParty() {
    const value = document.getElementById('sc-pn-new-input').value.trim();
    if (!value) {
        showToast('Bitte Partie-Nummer eingeben.');
        return;
    }
    const now = new Date();
    state.hoseEditingParties.push({
        value,
        addedAt:   now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                 + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        addedAtMs: now.getTime(),
    });
    document.getElementById('sc-pn-new-row').style.display = 'none';
    document.getElementById('sc-pn-new-input').value       = '';
    renderHosePartyDropdownLabel();
    showToast('✓ Partie-Nummer hinzugefügt');
}

/* ═══════════════════════════════════════════════
   LOCATION DROPDOWN (WIESE / ACKER)
═══════════════════════════════════════════════ */

/**
 * Toggles the location dropdown open or closed.
 * @param {MouseEvent} event - The click event.
 */
export function toggleHoseLocationDropdown(event) {
    event.stopPropagation();
    document.getElementById('sc-standort-dropdown').classList.toggle('open');
}

/**
 * Sets the location dropdown value and updates the display label.
 * @param {string} value - 'wiese' or 'acker'.
 */
export function setHoseLocationValue(value) {
    let label = 'Wiese';
    if (value === 'acker') {
        label = 'Acker';
    }
    document.getElementById('sc-standort-label').textContent = label;
    document.getElementById('sc-f-standort').value           = value;
    document.querySelectorAll('.sc-standort-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.value === value);
    });
    document.getElementById('sc-standort-dropdown').classList.remove('open');
}
