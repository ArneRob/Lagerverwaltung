import { showToast, nowTimestamp } from '../utils.js';
import { state, saveToStorage, archiveSlotData, archivePartitionData } from '../state.js';
import { saveCurrentPartitionState, loadPartitionContent, renderPartitionTabs, showPartitionPicker, deletePartition } from '../partition.js';
import { setDropdownValue, setStatusDropdownDisabled, setVollOptionHidden } from '../dropdown.js';
import { render } from '../render.js';



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

