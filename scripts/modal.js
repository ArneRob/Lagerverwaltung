import { showToast, nowTimestamp } from './utils.js';
import { state, saveToStorage, archiveSlotData, archivePartitionData } from './state.js';
import { saveCurrentPartitionState, loadPartitionContent, renderPartitionTabs, showPartitionPicker } from './partition.js';
import { setDropdownValue } from './dropdown.js';
import { render } from './render.js';

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

export function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

export function openAdd() {
    state.editingId          = null;
    state.editingPartitions  = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
    state.activePartitionIdx = 0;
    document.getElementById('modal-title').innerHTML =
        'Fach <input id="f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
    loadPartitionContent(0);
    renderPartitionTabs();
    setDropdownValue('leer');
    document.getElementById('f-date').value       = nowTimestamp();
    document.getElementById('del-btn').style.display   = 'none';
    document.getElementById('clear-btn').style.display = 'none';
    document.getElementById('partition-picker').style.display = 'none';
    document.getElementById('modal-content').style.display    = 'block';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-num').focus();
}

export function openEdit(id) {
    const slot = state.slots.find(s => s.id === id);
    if (!slot) return;
    state.editingId = id;
    state.editingPartitions = slot.partitions.map(partition => ({
        label:        partition.label,
        fruchtart:    partition.fruchtart || '',
        parties:      partition.parties ? partition.parties.map(x => ({ ...x })) : [],
        temperatures: partition.temperatures ? [...partition.temperatures] : [],
    }));
    state.activePartitionIdx = 0;
    document.getElementById('modal-title').textContent     = `Fach ${slot.slotNumber}`;
    loadPartitionContent(0);
    renderPartitionTabs();
    setDropdownValue(slot.status);
    document.getElementById('f-date').value            = slot.updated;
    document.getElementById('del-btn').style.display   = 'inline-block';
    document.getElementById('clear-btn').style.display = 'inline-block';
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
    if (state.editingPartitions.length > 1) {
        showPartitionPicker();
    } else {
        document.getElementById('partition-picker').style.display = 'none';
        document.getElementById('modal-content').style.display    = 'block';
    }
}

export function saveSlot() {
    saveCurrentPartitionState();

    const numInput = document.getElementById('f-num');
    let slotNumber;
    if (state.editingId !== null) {
        slotNumber = state.slots.find(s => s.id === state.editingId)?.slotNumber;
    } else {
        slotNumber = parseInt(numInput?.value, 10) || state.nextId + 4;
    }

    const status  = document.getElementById('f-status').value;
    const updated = nowTimestamp();

    for (let i = 0; i < state.editingPartitions.length; i++) {
        if (state.editingPartitions[i].parties.length === 0) {
            const label = state.editingPartitions[i].label;
            showToast(`Partition ${label}: Bitte mindestens eine Partie-Nummer hinzufügen.`);
            return;
        }
    }

    if (state.editingId !== null) {
        const slot = state.slots.find(s => s.id === state.editingId);
        if (slot) {
            slot.partitions = state.editingPartitions;
            slot.status     = status;
            slot.updated    = updated;
        }
    } else {
        state.slots.push({
            id: state.nextId++, slotNumber,
            partitions: state.editingPartitions,
            status, updated,
        });
    }

    saveToStorage();
    closeModal();
    render();
    if (state.editingId !== null) {
        showToast('✓ Fach gespeichert');
    } else {
        showToast('✓ Fach hinzugefügt');
    }
}

export function clearSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(s => s.id === state.editingId);
    if (!slot) return;

    if (slot.partitions.length > 1) {
        const partition = slot.partitions[state.activePartitionIdx];
        if (!confirm(`Partition ${partition.label} in Fach ${slot.slotNumber} wirklich leeren? Die Daten werden archiviert und die Teilung aufgehoben.`)) return;
        archivePartitionData(slot, partition);
        deletePartition(state.activePartitionIdx);
        slot.partitions = state.editingPartitions;
    } else {
        if (!confirm(`Fach ${slot.slotNumber} wirklich leeren? Die Daten werden archiviert.`)) return;
        archiveSlotData(slot);
        slot.partitions = [{ label: 'A', fruchtart: '', parties: [], temperatures: [] }];
        slot.status     = 'leer';
    }

    slot.updated = nowTimestamp();
    saveToStorage();
    closeModal();
    render();
    showToast(`✓ Fach ${slot.slotNumber} geleert und archiviert`);
}

export function deleteSlot() {
    if (state.editingId === null) return;
    const slot = state.slots.find(s => s.id === state.editingId);
    if (!confirm(`Fach ${slot.slotNumber} wirklich löschen?`)) return;
    state.slots = state.slots.filter(s => s.id !== state.editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Fach gelöscht');
}
