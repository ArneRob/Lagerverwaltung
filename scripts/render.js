import { state, COL_OPTIONS, STATUS_LABELS, saveToStorage } from './state.js';
import {
    returnStatsTemplate,
    returnSlotCardTemplate,
    returnHoseStatsTemplate,
    returnHoseCardTemplate,
} from './template.js';

/* ═══════════════════════════════════════════════
   VIEW CONTROL
═══════════════════════════════════════════════ */

/**
 * Switches the active view and re-renders.
 * @param {string} view - 'lager' or 'schlauch'.
 */
export function setActiveView(view) {
    state.activeView = view;
    render();
}

/**
 * Updates all view-dependent UI elements (buttons, legend, sub text, tabs).
 */
function updateViewUI() {
    const isHoseView = state.activeView === 'schlauch';

    if (isHoseView) {
        document.querySelector('.legend').style.display             = 'none';
        document.querySelector('.legend-hose').style.display        = '';
        document.getElementById('add-btn').textContent              = '+ Schlauch hinzufügen';
        document.getElementById('sub').textContent                  =
            `${state.hoseSlots.length} Schläuche · Klicke auf einen Schlauch zum Bearbeiten`;
    } else {
        document.querySelector('.legend').style.display             = '';
        document.querySelector('.legend-hose').style.display        = 'none';
        document.getElementById('add-btn').textContent              = '+ Lager hinzufügen';
        document.getElementById('sub').textContent                  =
            `${state.slots.length} Fächer geladen · Klicke auf ein Lager zum Bearbeiten`;
    }

    document.getElementById('tab-lager').classList.toggle('active', !isHoseView);
    document.getElementById('tab-schlauch').classList.toggle('active', isHoseView);
}

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */

/**
 * Renders the stats bar for the active view.
 */
function renderStats() {
    if (state.activeView === 'schlauch') {
        document.getElementById('stats').innerHTML = returnHoseStatsTemplate(state.hoseSlots.length);
        return;
    }
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    state.slots.forEach(slot => counts[slot.status]++);
    document.getElementById('stats').innerHTML = returnStatsTemplate(state.slots.length, counts);
}

/* ═══════════════════════════════════════════════
   GRID – WAREHOUSE
═══════════════════════════════════════════════ */

/**
 * Renders the warehouse grid with all slot cards.
 */
function renderWarehouseGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...state.slots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((slot) => {
        const card = document.createElement('div');
        card.className  = `slot ${slot.status}`;
        card.dataset.id = String(slot.id);

        const firstPartition = slot.partitions && slot.partitions[0];
        let lastParty = '—';
        let fruchtart = '';
        if (firstPartition) {
            fruchtart = firstPartition.fruchtart || '';
            if (firstPartition.parties && firstPartition.parties.length > 0) {
                lastParty = firstPartition.parties[firstPartition.parties.length - 1].value;
            }
        }

        card.innerHTML = returnSlotCardTemplate(slot, lastParty, STATUS_LABELS[slot.status], fruchtart, slot.partitions.length);
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className      = 'add-slot';
    addBtn.dataset.action = 'add-slot';
    addBtn.innerHTML      = '<div class="plus">+</div><div>Lager hinzufügen</div>';
    grid.appendChild(addBtn);
}

/* ═══════════════════════════════════════════════
   GRID – HOSES
═══════════════════════════════════════════════ */

/**
 * Renders the hose grid with all hose cards.
 */
function renderHoseGrid() {
    const cols = COL_OPTIONS[state.colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    const sortedHoseSlots = [...state.hoseSlots].sort((a, b) => {
        const locationOrder = { wiese: 0, acker: 1 };
        const locationDiff  = (locationOrder[a.standort] ?? 0) - (locationOrder[b.standort] ?? 0);
        if (locationDiff !== 0) {
            return locationDiff;
        }
        return a.slotNumber - b.slotNumber;
    });

    sortedHoseSlots.forEach((hose) => {
        const card = document.createElement('div');
        card.className          = `schlauch-card ${hose.standort || 'wiese'}`;
        card.dataset.schlauchId = String(hose.id);

        let lastParty = '—';
        if (hose.parties && hose.parties.length > 0) {
            lastParty = hose.parties[hose.parties.length - 1].value;
        }

        card.innerHTML = returnHoseCardTemplate(hose, lastParty);
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className      = 'add-slot';
    addBtn.dataset.action = 'add-schlauch';
    addBtn.innerHTML      = '<div class="plus">+</div><div>Schlauch hinzufügen</div>';
    grid.appendChild(addBtn);
}

/**
 * Renders the grid for the active view.
 */
function renderGrid() {
    if (state.activeView === 'schlauch') {
        renderHoseGrid();
        return;
    }
    renderWarehouseGrid();
}

/* ═══════════════════════════════════════════════
   MAIN RENDER
═══════════════════════════════════════════════ */

/**
 * Fully re-renders stats, grid, and UI elements.
 */
export function render() {
    renderStats();
    renderGrid();
    updateViewUI();
}

/**
 * Cycles to the next grid layout and saves the new state.
 */
export function cycleLayout() {
    state.colIdx = (state.colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}
