import { state } from './state.js';
import { returnPartitionTabsTemplate, returnPartitionPickerTemplate } from './template.js';
import { renderPartieDropdownLabel } from './dropdown.js';
import { renderTempList } from './temperature.js';

/* ═══════════════════════════════════════════════
   PARTITIONEN
═══════════════════════════════════════════════ */

export function saveCurrentPartitionState() {
    const partition = state.editingPartitions[state.activePartitionIdx];
    if (!partition) return;
    partition.fruchtart    = document.getElementById('f-frucht').value.trim();
    partition.parties      = state.editingParties;
    partition.temperatures = state.tempEntries;
}

export function loadPartitionContent(idx) {
    const partition = state.editingPartitions[idx];
    if (!partition) return;
    document.getElementById('f-frucht').value = partition.fruchtart || '';
    state.editingParties = partition.parties ? partition.parties.map(x => ({ ...x })) : [];
    state.tempEntries    = partition.temperatures ? [...partition.temperatures] : [];
    renderPartieDropdownLabel();
    renderTempList();
    document.getElementById('pn-new-row').style.display = 'none';
}

function switchPartition(idx) {
    saveCurrentPartitionState();
    state.activePartitionIdx = idx;
    loadPartitionContent(idx);
    renderPartitionTabs();
}

export function addPartition() {
    saveCurrentPartitionState();
    const label = String.fromCharCode(65 + state.editingPartitions.length);
    state.editingPartitions.push({ label, fruchtart: '', parties: [], temperatures: [] });
    state.activePartitionIdx = state.editingPartitions.length - 1;
    loadPartitionContent(state.activePartitionIdx);
    renderPartitionTabs();
}

export function deletePartition(idx) {
    if (state.editingPartitions.length <= 1) return;
    state.editingPartitions.splice(idx, 1);
    state.editingPartitions.forEach((partition, i) => {
        partition.label = String.fromCharCode(65 + i);
    });
    let newIdx = idx;
    if (newIdx >= state.editingPartitions.length) {
        newIdx = state.editingPartitions.length - 1;
    }
    state.activePartitionIdx = newIdx;
    loadPartitionContent(newIdx);
    renderPartitionTabs();
}

export function renderPartitionTabs() {
    const tabsEl = document.getElementById('partition-tabs');
    if (state.editingPartitions.length <= 1) {
        tabsEl.style.display = 'none';
        return;
    }
    tabsEl.style.display = 'flex';
    tabsEl.innerHTML = returnPartitionTabsTemplate(state.editingPartitions, state.activePartitionIdx);
    tabsEl.querySelectorAll('.partition-tab').forEach((btn, idx) => {
        btn.addEventListener('click', () => switchPartition(idx));
    });
}

function selectPartitionFromPicker(idx) {
    state.activePartitionIdx = idx;
    loadPartitionContent(idx);
    renderPartitionTabs();
    document.getElementById('partition-picker').style.display = 'none';
    document.getElementById('modal-content').style.display = 'block';
}

export function showPartitionPicker() {
    const picker = document.getElementById('partition-picker');
    picker.innerHTML = returnPartitionPickerTemplate(state.editingPartitions);
    picker.style.display = 'flex';
    document.getElementById('modal-content').style.display = 'none';
    picker.querySelectorAll('.picker-card').forEach((btn) => {
        const idx = parseInt(btn.dataset.idx, 10);
        btn.addEventListener('click', () => selectPartitionFromPicker(idx));
    });
}
