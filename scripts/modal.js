import { showToast, nowTimestamp } from './utils.js';
import { state, saveToStorage, archiveSlotData, archivePartitionData } from './state.js';
import { saveCurrentPartitionState, loadPartitionContent, renderPartitionTabs, showPartitionPicker, deletePartition } from './partition.js';
import { setDropdownValue } from './dropdown.js';
import { render } from './render.js';

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

/** Schließt das Haupt-Overlay. */
export function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

/** Öffnet das Modal zum Anlegen eines neuen Lagers. */
export function openAdd() {
    state.editingId          = null;
    state.editingPartitions  = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
    state.activePartitionIdx = 0;
    document.getElementById('modal-title').innerHTML =
        'Lager <input id="f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
    loadPartitionContent(0);
    renderPartitionTabs();
    setDropdownValue('leer');
    document.getElementById('f-date').value                   = nowTimestamp();
    document.getElementById('del-btn').style.display          = 'none';
    document.getElementById('clear-btn').style.display        = 'none';
    document.getElementById('partition-picker').style.display = 'none';
    document.getElementById('modal-content').style.display    = 'block';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-num').focus();
}

/**
 * Erstellt eine tiefe Kopie aller Partitionen eines Slots für den Bearbeitungszustand.
 * @param {object} slot - Der Slot aus state.slots.
 * @returns {Array} Kopierte Partitionen.
 */
function buildEditingPartitions(slot) {
    return slot.partitions.map(partition => ({
        label:        partition.label,
        fruchtart:    partition.fruchtart || '',
        parties:      partition.parties ? partition.parties.map(x => ({ ...x })) : [],
        temperatures: partition.temperatures ? [...partition.temperatures] : [],
    }));
}

/**
 * Setzt alle DOM-Elemente des Modals für einen bestehenden Slot und öffnet das Overlay.
 * @param {object} slot - Der Slot aus state.slots.
 */
function showModalForSlot(slot) {
    document.getElementById('modal-title').textContent     = `Lager ${slot.slotNumber}`;
    document.getElementById('f-date').value                = slot.updated;
    document.getElementById('del-btn').style.display       = 'inline-block';
    document.getElementById('clear-btn').style.display     = 'inline-block';
    document.getElementById('pn-new-row').style.display    = 'none';
    document.getElementById('overlay').classList.add('open');
    setDropdownValue(slot.status);
    if (state.editingPartitions.length > 1) {
        showPartitionPicker();
    } else {
        document.getElementById('partition-picker').style.display = 'none';
        document.getElementById('modal-content').style.display    = 'block';
    }
}

/**
 * Öffnet das Modal zum Bearbeiten eines bestehenden Slots.
 * @param {number} id - Die ID des zu bearbeitenden Slots.
 */
export function openEdit(id) {
    const slot = state.slots.find(s => s.id === id);
    if (!slot) return;
    state.editingId          = id;
    state.editingPartitions  = buildEditingPartitions(slot);
    state.activePartitionIdx = 0;
    loadPartitionContent(0);
    renderPartitionTabs();
    showModalForSlot(slot);
}

/**
 * Ermittelt die Lagernummer – beim Bearbeiten aus dem Slot, beim Anlegen aus dem Input.
 * @returns {number} Die Lagernummer.
 */
function resolveSlotNumber() {
    if (state.editingId !== null) {
        return state.slots.find(s => s.id === state.editingId)?.slotNumber;
    }
    return parseInt(document.getElementById('f-num')?.value, 10) || state.nextId + 4;
}

/**
 * Prüft ob alle Partitionen konsistent befüllt sind.
 * Erlaubt: komplett leer (kein Fruchtart, keine Partienummern).
 * Nicht erlaubt: nur Fruchtart ohne Partienummer oder umgekehrt.
 * @returns {boolean} true wenn valide, false wenn nicht.
 */
function validatePartitions() {
    for (let i = 0; i < state.editingPartitions.length; i++) {
        const partition   = state.editingPartitions[i];
        const hasFrucht   = partition.fruchtart.trim().length > 0;
        const hasParties  = partition.parties.length > 0;

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
 * Schreibt die Änderungen in den bestehenden Slot oder legt einen neuen an.
 * @param {number} slotNumber - Die Lagernummer.
 * @param {string} status     - Der neue Status.
 * @param {string} updated    - Zeitstempel der Änderung.
 */
function applySlotChanges(slotNumber, status, updated) {
    if (state.editingId !== null) {
        const slot = state.slots.find(s => s.id === state.editingId);
        if (slot) {
            slot.partitions = state.editingPartitions;
            slot.status     = status;
            slot.updated    = updated;
        }
    } else {
        state.slots.push({ id: state.nextId++, slotNumber, partitions: state.editingPartitions, status, updated });
    }
}

/** Speichert den aktuellen Bearbeitungszustand des Slots. */
export function saveSlot() {
    saveCurrentPartitionState();
    if (!validatePartitions()) return;

    const slotNumber = resolveSlotNumber();
    const status     = document.getElementById('f-status').value;
    const updated    = nowTimestamp();

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
 * Archiviert die aktive Partition und hebt die Teilung auf.
 * @param {object} slot - Der Slot aus state.slots.
 * @returns {boolean} true wenn bestätigt und durchgeführt, false bei Abbruch.
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
 * Archiviert das gesamte Lager und setzt es auf leer zurück.
 * @param {object} slot - Der Slot aus state.slots.
 * @returns {boolean} true wenn bestätigt und durchgeführt, false bei Abbruch.
 */
function clearSinglePartition(slot) {
    if (!confirm(`Lager ${slot.slotNumber} wirklich leeren? Die Daten werden archiviert.`)) return false;
    archiveSlotData(slot);
    slot.partitions = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
    slot.status     = 'leer';
    return true;
}

/** Leert das aktive Lager oder die aktive Partition und archiviert die Daten. */
export function clearSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(s => s.id === state.editingId);
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

/** Löscht das aktive Lager vollständig nach Bestätigung. */
export function deleteSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(s => s.id === state.editingId);
    if (!confirm(`Lager ${slot.slotNumber} wirklich löschen?`)) return;
    state.slots = state.slots.filter(s => s.id !== state.editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Lager gelöscht');
}
