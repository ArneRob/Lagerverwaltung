import { showToast, nowTimestamp } from '../utils.js';
import { state, saveHoseToStorage } from '../state.js';
import { render } from '../render.js';
import { returnPartieItemTemplate, returnWeightNoteEntryTemplate } from '../template.js';

/* ═══════════════════════════════════════════════
   HOSE MODAL – OPEN / CLOSE
═══════════════════════════════════════════════ */

/**
 * Closes the hose modal.
 */
export function closeHoseModal() {
    document.getElementById('schlauch-overlay').classList.remove('open');
}

/**
 * Populates modal fields for an existing hose entry.
 * @param {object} hose - The existing hose data object.
 */
function loadExistingHoseData(hose) {
    document.getElementById('sc-modal-title').textContent = `Schlauch ${hose.slotNumber}`;
    document.getElementById('sc-f-frucht').value          = hose.fruchtart || '';
    setHoseLocationValue(hose.standort || 'wiese');
    document.getElementById('sc-f-date').value          = hose.updated;
    document.getElementById('sc-del-btn').style.display = 'inline-block';
}

/**
 * Resets modal fields to defaults for a new hose entry.
 */
function loadNewHoseDefaults() {
    document.getElementById('sc-modal-title').innerHTML =
        'Schlauch <input id="sc-f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
    document.getElementById('sc-f-frucht').value        = '';
    setHoseLocationValue('wiese');
    document.getElementById('sc-f-date').value          = nowTimestamp();
    document.getElementById('sc-del-btn').style.display = 'none';
}

/**
 * Loads hose parties and weight notes into state.
 * @param {object|null} hose - The existing hose data or null for a new entry.
 */
function loadHoseStateEntries(hose) {
    if (hose && hose.parties) {
        state.hoseEditingParties = hose.parties.map(party => ({ ...party }));
    } else {
        state.hoseEditingParties = [];
    }
    if (hose && hose.notizen) {
        state.weightNoteEntries = [...hose.notizen];
    } else {
        state.weightNoteEntries = [];
    }
}

/**
 * Renders the party dropdown label, weight note list and hides the new-party row.
 */
function finalizeHoseModal() {
    renderHosePartyDropdownLabel();
    renderWeightNoteList();
    document.getElementById('sc-pn-new-row').style.display = 'none';
}

/**
 * Populates all modal fields from an existing hose data object,
 * or resets them to an empty state for a new entry.
 * @param {object|null} hose - Existing hose data or null for a new entry.
 */
function loadHoseModalContent(hose) {
    if (hose) {
        loadExistingHoseData(hose);
    } else {
        loadNewHoseDefaults();
    }
    loadHoseStateEntries(hose);
    finalizeHoseModal();
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
   HOSE MODAL – SAVE / DELETE
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
 * Validates that at least one party number has been added before saving.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateHoseSave() {
    if (state.hoseEditingParties.length === 0) {
        showToast('Bitte mindestens eine Partie-Nummer hinzufügen.');
        return false;
    }
    return true;
}

/**
 * Reads all relevant form field values from the hose modal.
 * @returns {{ slotNumber: number, fruchtart: string, standort: string, updated: string }}
 */
function readHoseFormData() {
    return {
        slotNumber: resolveHoseNumber(),
        fruchtart:  document.getElementById('sc-f-frucht').value.trim(),
        standort:   document.getElementById('sc-f-standort').value,
        updated:    nowTimestamp(),
    };
}

/**
 * Pushes a new hose entry into the state.
 * @param {{ slotNumber: number, fruchtart: string, standort: string, updated: string }} formData
 */
function createNewHose(formData) {
    state.hoseSlots.push({
        id:        state.hoseNextId++,
        slotNumber: formData.slotNumber,
        fruchtart:  formData.fruchtart,
        parties:    state.hoseEditingParties,
        standort:   formData.standort,
        notizen:    state.weightNoteEntries,
        updated:    formData.updated,
    });
}

/**
 * Updates an existing hose entry in the state with the given form data.
 * @param {{ fruchtart: string, standort: string, updated: string }} formData
 */
function updateExistingHose(formData) {
    const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId);
    if (hose) {
        hose.fruchtart = formData.fruchtart;
        hose.parties   = state.hoseEditingParties;
        hose.standort  = formData.standort;
        hose.notizen   = state.weightNoteEntries;
        hose.updated   = formData.updated;
    }
}

/**
 * Persists the state, closes the modal, re-renders, and notifies the user.
 * @param {boolean} isNew - Whether a new hose entry was created.
 */
function finalizeHoseSave(isNew) {
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
 * Saves the current hose entry (new or edited) to the state and storage.
 */
export function saveHose() {
    if (!validateHoseSave()) return;

    const formData = readHoseFormData();
    const isNew    = state.editingHoseId === null;

    if (isNew) {
        createNewHose(formData);
    } else {
        updateExistingHose(formData);
    }

    finalizeHoseSave(isNew);
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
   HOSE MODAL – PARTY DROPDOWN
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
   HOSE MODAL – LOCATION DROPDOWN
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

/* ═══════════════════════════════════════════════
   HOSE MODAL – WEIGHT NOTES
═══════════════════════════════════════════════ */

/**
 * Returns true if a weight note entry is locked (older than 1 minute).
 * @param {object} note - The weight note entry.
 * @returns {boolean}
 */
export function isWeightNoteLocked(note) {
    return Date.now() - note.savedAtMs > 60000;
}

/**
 * Toggles a weight note entry open or closed.
 * @param {HTMLElement} entryEl - The entry element.
 */
export function toggleWeightNoteEntry(entryEl) {
    entryEl.classList.toggle('open');
}

/**
 * Inserts the total calculated weight into the weight-note-total element.
 * @param {number} total - The sum of all note weights.
 */
function renderTotalWeight(total) {
    const totalDiv = document.getElementById('weight-note-total');
    if (!totalDiv) return;
    totalDiv.innerHTML = total;
}

/**
 * Renders the weight note list inside the hose modal.
 */
export function renderWeightNoteList() {
    const listEl = document.getElementById('weight-note-list');
    if (!listEl) return;
    let total = 0;
    if (state.weightNoteEntries.length === 0) {
        renderTotalWeight(total);
        listEl.innerHTML = '<div class="temp-empty">Noch kein Gewicht</div>';
        return;
    }
    listEl.innerHTML = state.weightNoteEntries.map((note) => {
        let entryClass = 'temp-entry';
        total += note.weight;
        if (isWeightNoteLocked(note)) {
            entryClass += ' temp-locked';
        }
        return returnWeightNoteEntryTemplate(note, entryClass);
    }).join('');
    renderTotalWeight(total);
}

/**
 * Opens the weight note input overlay.
 */
export function openWeightNoteForm() {
    document.getElementById('weight-note-text').value = '';
    document.getElementById('weight-note-overlay').classList.add('open');
    document.getElementById('weight-note-text').focus();
}

/**
 * Closes the weight note input overlay.
 */
export function closeWeightNoteForm() {
    document.getElementById('weight-note-overlay').classList.remove('open');
}

/**
 * Persists only the weight notes of the currently edited hose to storage.
 * Used for quick saves without closing the modal.
 */
function quickSaveHoseNotizen() {
    if (state.editingHoseId === null) return;
    const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId);
    if (!hose) return;
    hose.notizen = [...state.weightNoteEntries];
    saveHoseToStorage();
}

/**
 * Validates and saves a new weight note entry to the state and re-renders the list.
 */
export function saveWeightNoteEntry() {
    const text   = document.getElementById('weight-note-text').value.trim();
    const weight = parseFloat(text);
    if (isNaN(weight)) {
        showToast('Bitte eine Zahl eingeben.');
        return;
    }
    const now = new Date();
    state.weightNoteEntries.push({
        weight,
        savedBy:        localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs:      now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    });
    closeWeightNoteForm();
    renderWeightNoteList();
    quickSaveHoseNotizen();
}
