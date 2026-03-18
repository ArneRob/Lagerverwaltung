import { state, COL_OPTIONS, STATUS_LABELS, saveToStorage } from './state.js';
import { returnStatsTemplate, returnSlotCardTemplate } from './template.js';

/* ═══════════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════════ */

function renderStats() {
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    state.slots.forEach(slot => counts[slot.status]++);
    document.getElementById('stats').innerHTML = returnStatsTemplate(state.slots.length, counts);
}

function renderGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...state.slots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((slot) => {
        const card = document.createElement('div');
        card.className   = `slot ${slot.status}`;
        card.dataset.id  = String(slot.id);

        const firstPartition = slot.partitions && slot.partitions[0];
        let lastPartie = '—';
        let fruchtart  = '';
        if (firstPartition) {
            fruchtart = firstPartition.fruchtart || '';
            if (firstPartition.parties && firstPartition.parties.length > 0) {
                lastPartie = firstPartition.parties[firstPartition.parties.length - 1].value;
            }
        }

        card.innerHTML = returnSlotCardTemplate(slot, lastPartie, STATUS_LABELS[slot.status], fruchtart, slot.partitions.length);
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-slot';
    addBtn.dataset.action = 'add-slot';
    addBtn.innerHTML = '<div class="plus">+</div><div>Fach hinzufügen</div>';
    grid.appendChild(addBtn);
}

export function render() {
    renderStats();
    renderGrid();
}

export function cycleLayout() {
    state.colIdx = (state.colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}
