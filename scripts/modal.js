import { showToast, nowTimestamp } from './utils.js';
import { state, saveToStorage, saveHoseToStorage, archiveSlotData, archivePartitionData } from './state.js';
import { saveCurrentPartitionState, loadPartitionContent, renderPartitionTabs, showPartitionPicker, deletePartition } from './partition.js';
import { setDropdownValue, setStatusDropdownDisabled, setVollOptionHidden } from './dropdown.js';
import { render } from './render.js';
import { returnPartieItemTemplate } from './template.js';
import { renderWeightNoteList } from './temperature.js';

/* ═══════════════════════════════════════════════
   STATUS LOGIC
═══════════════════════════════════════════════ */

/**
 * Returns true if at least one partition has content (grain type or party number).
 * @returns {boolean}
 */
function hasSlotContent() {
    return state.editingPartitions.some(partition =>
        partition.fruchtart.trim().length > 0 || partition.parties.length > 0
    );
}

/**
 * Updates the status dropdown based on partition content.
 * Filled slot: dropdown locked, status set to "Voll".
 * Empty slot: dropdown enabled, only leer/gereinigt/reserviert selectable.
 */
function updateStatusDropdownForContent() {
    const slotHasContent = hasSlotContent();
    setStatusDropdownDisabled(slotHasContent);
    setVollOptionHidden(!slotHasContent);
    if (slotHasContent) {
        setDropdownValue('voll');
        return;
    }
    const currentStatus = document.getElementById('f-status').value;
    if (currentStatus === 'voll') {
        setDropdownValue('leer');
    }
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

/**
 * Closes the main warehouse overlay.
 */
export function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

/**
 * Opens the modal to add a new warehouse slot.
 */
export function openAdd() {
    initAddState();
    renderAddTitle();
    initAddPartitions();
    showAddModal();
    document.getElementById('f-num').focus();
}

/**
 * Resets the editing state for a new slot.
 */
function initAddState() {
    state.editingId          = null;
    state.editingPartitions  = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
    state.activePartitionIdx = 0;
}

/**
 * Sets the modal title to include the slot number input field.
 */
function renderAddTitle() {
    document.getElementById('modal-title').innerHTML =
        'Lager <input id="f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
}

/**
 * Loads partition content and initialises the status dropdown for a new slot.
 */
function initAddPartitions() {
    loadPartitionContent(0);
    renderPartitionTabs();
    setDropdownValue('leer');
    updateStatusDropdownForContent();
}

/**
 * Sets button visibility and opens the overlay for the add modal.
 */
function showAddModal() {
    document.getElementById('f-date').value                   = nowTimestamp();
    document.getElementById('del-btn').style.display          = 'none';
    document.getElementById('clear-btn').style.display        = 'none';
    document.getElementById('partition-picker').style.display = 'none';
    document.getElementById('modal-content').style.display    = 'block';
    document.getElementById('overlay').classList.add('open');
}

/**
 * Builds a deep copy of all partitions of a slot for the editing state.
 * @param {object} slot - The slot from state.slots.
 * @returns {Array} Copied partitions.
 */
function buildEditingPartitions(slot) {
    return slot.partitions.map(partition => ({
        label:        partition.label,
        fruchtart:    partition.fruchtart || '',
        parties:      partition.parties      ? partition.parties.map(party => ({ ...party }))        : [],
        temperatures: partition.temperatures ? [...partition.temperatures]                            : [],
    }));
}

/**
 * Sets all DOM elements in the modal for an existing slot and opens the overlay.
 * @param {object} slot - The slot from state.slots.
 */
function showModalForSlot(slot) {
    document.getElementById('modal-title').textContent     = `Lager ${slot.slotNumber}`;
    document.getElementById('f-date').value                = slot.updated;
    document.getElementById('del-btn').style.display       = 'inline-block';
    document.getElementById('clear-btn').style.display     = 'inline-block';
    document.getElementById('pn-new-row').style.display    = 'none';
    document.getElementById('overlay').classList.add('open');
    setDropdownValue(slot.status);
    updateStatusDropdownForContent();
    if (state.editingPartitions.length > 1) {
        showPartitionPicker();
    } else {
        document.getElementById('partition-picker').style.display = 'none';
        document.getElementById('modal-content').style.display    = 'block';
    }
}

/**
 * Opens the modal to edit an existing warehouse slot.
 * @param {number} id - The ID of the slot to edit.
 */
export function openEdit(id) {
    const slot = state.slots.find(slot => slot.id === id);
    if (!slot) return;
    state.editingId          = id;
    state.editingPartitions  = buildEditingPartitions(slot);
    state.activePartitionIdx = 0;
    loadPartitionContent(0);
    renderPartitionTabs();
    showModalForSlot(slot);
}

/**
 * Resolves the slot number – from the existing slot when editing,
 * or from the input field when creating a new slot.
 * @returns {number} The slot number.
 */
function resolveSlotNumber() {
    if (state.editingId !== null) {
        return state.slots.find(slot => slot.id === state.editingId)?.slotNumber;
    }
    return parseInt(document.getElementById('f-num')?.value, 10) || state.nextId + 4;
}

/**
 * Validates that all partitions are consistently filled.
 * Allowed: completely empty (no grain type, no party numbers).
 * Not allowed: grain type without party number, or vice versa.
 * @returns {boolean} true if valid, false otherwise.
 */
function validatePartitions() {
    for (let i = 0; i < state.editingPartitions.length; i++) {
        const partition  = state.editingPartitions[i];
        const hasFrucht  = partition.fruchtart.trim().length > 0;
        const hasParties = partition.parties.length > 0;

        if (hasFrucht && !hasParties) {
            showToast(`Partition ${partition.label}: Fruchtart angegeben – bitte auch eine Partie-Nummer hinzufügen.`);
            return false;
        }
        if (hasParties && !hasFrucht) {
            showToast(`Partition ${partition.label}: Partie-Nummer angegeben – bitte auch eine Fruchtart eingeben.`);
            return false;
        }
    }
    return true;
}

/**
 * Writes the changes to an existing slot or creates a new one.
 * @param {number} slotNumber - The slot number.
 * @param {string} status     - The new status.
 * @param {string} updated    - Timestamp of the change.
 */
function applySlotChanges(slotNumber, status, updated) {
    if (state.editingId !== null) {
        const slot = state.slots.find(slot => slot.id === state.editingId);
        if (slot) {
            slot.partitions = state.editingPartitions;
            slot.status     = status;
            slot.updated    = updated;
        }
    } else {
        state.slots.push({ id: state.nextId++, slotNumber, partitions: state.editingPartitions, status, updated });
    }
}

/**
 * Saves the current editing state of the slot.
 */
export function saveSlot() {
    saveCurrentPartitionState();
    if (!validatePartitions()) return;

    const slotNumber = resolveSlotNumber();
    const updated    = nowTimestamp();
    let status;
    if (hasSlotContent()) {
        status = 'voll';
    } else {
        status = document.getElementById('f-status').value;
    }

    applySlotChanges(slotNumber, status, updated);
    saveToStorage();
    closeModal();
    render();
    if (state.editingId !== null) {
        showToast('✓ Lager gespeichert');
    } else {
        showToast('✓ Lager hinzugefügt');
    }
}

/**
 * Archives the active partition and removes the split.
 * @param {object} slot - The slot from state.slots.
 * @returns {boolean} true if confirmed and executed, false if cancelled.
 */
function clearActivePartition(slot) {
    const partition = slot.partitions[state.activePartitionIdx];
    if (!confirm(`Partition ${partition.label} in Lager ${slot.slotNumber} wirklich leeren? Die Daten werden archiviert und die Teilung aufgehoben.`)) return false;
    archivePartitionData(slot, partition);
    deletePartition(state.activePartitionIdx);
    slot.partitions = state.editingPartitions;
    return true;
}

/**
 * Archives the entire slot and resets it to empty.
 * @param {object} slot - The slot from state.slots.
 * @returns {boolean} true if confirmed and executed, false if cancelled.
 */
function clearSinglePartition(slot) {
    if (!confirm(`Lager ${slot.slotNumber} wirklich leeren? Die Daten werden archiviert.`)) return false;
    archiveSlotData(slot);
    slot.partitions = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
    slot.status     = 'leer';
    return true;
}

/**
 * Empties the active slot or partition and archives its data.
 */
export function clearSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(slot => slot.id === state.editingId);
    if (!slot) return;

    let cleared;
    if (slot.partitions.length > 1) {
        cleared = clearActivePartition(slot);
    } else {
        cleared = clearSinglePartition(slot);
    }
    if (!cleared) return;

    slot.updated = nowTimestamp();
    saveToStorage();
    closeModal();
    render();
    showToast(`✓ Lager ${slot.slotNumber} geleert und archiviert`);
}

/**
 * Permanently deletes the active slot after confirmation.
 */
export function deleteSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(slot => slot.id === state.editingId);
    if (!confirm(`Lager ${slot.slotNumber} wirklich löschen?`)) return;
    state.slots = state.slots.filter(slot => slot.id !== state.editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Lager gelöscht');
}

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
            state.weightNoteEntries = [...hose.notizen];
        } else {
            state.weightNoteEntries = [];
        }
        setHoseLocationValue(hose.standort || 'wiese');
        document.getElementById('sc-f-date').value          = hose.updated;
        document.getElementById('sc-del-btn').style.display = 'inline-block';
    } else {
        document.getElementById('sc-modal-title').innerHTML =
            'Schlauch <input id="sc-f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
        document.getElementById('sc-f-frucht').value         = '';
        state.hoseEditingParties                             = [];
        state.weightNoteEntries                                = [];
        setHoseLocationValue('wiese');
        document.getElementById('sc-f-date').value           = nowTimestamp();
        document.getElementById('sc-del-btn').style.display  = 'none';
    }
    renderHosePartyDropdownLabel();
    renderWeightNoteList();
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
            notizen:   state.weightNoteEntries,
            updated,
        });
    } else {
        const hose = state.hoseSlots.find(hoseEntry => hoseEntry.id === state.editingHoseId);
        if (hose) {
            hose.fruchtart = fruchtart;
            hose.parties   = state.hoseEditingParties;
            hose.standort  = standort;
            hose.notizen   = state.weightNoteEntries;
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
