import { showToast, nowTimestamp } from './utils.js';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */

export const STORAGE_KEY  = 'lager_slots';
export const COL_KEY      = 'lager_col_idx';
export const ARCHIVE_KEY  = 'lager_archiv';
export const HOSE_KEY     = 'lager_schlauch_slots';
export const COL_OPTIONS  = [2, 3];

export const STATUS_LABELS = {
    leer:       'Ungereinigt',
    voll:       'Voll',
    gereinigt:  'Gereinigt',
    reserviert: 'Reserviert',
};

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */

export const state = {
    slots:              [],
    nextId:             1,
    editingId:          null,
    editingPartitions:  [],
    activePartitionIdx: 0,
    tempEntries:        [],
    editingParties:     [],
    colIdx:             0,

    activeView:         'lager',
    hoseSlots:          [],
    hoseNextId:         1,
    editingHoseId:      null,
    hoseEditingParties: [],
    weightNoteEntries:  [],
};

/* ═══════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════ */

/**
 * Migrates a single slot from an older data format to the current format.
 * Adds a fallback slotNumber and wraps legacy fields into a partitions array if needed.
 * @param {Object} slot - The slot object to migrate.
 * @param {number} index - The index of the slot in the array (used as slotNumber fallback).
 */
function migrateLegacySlot(slot, index) {
    if (slot.slotNumber == null) {
        slot.slotNumber = index + 5;
    }
    if (!slot.partitions) {
        slot.partitions = [{
            label:        'A',
            fruchtart:    slot.fruchtart || '',
            parties:      slot.parties || [],
            temperatures: slot.temperatures || [],
        }];
    }
}

/**
 * Loads slot data from localStorage into state.slots and state.nextId.
 * Falls back to defaultSlots() if no data exists or parsing fails.
 */
function loadSlotsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            state.slots = JSON.parse(raw);
            state.slots.forEach((slot, index) => migrateLegacySlot(slot, index));
            state.nextId = state.slots.reduce((max, slot) => Math.max(max, slot.id), 0) + 1;
        } else {
            state.slots  = defaultSlots();
            state.nextId = state.slots.length + 1;
        }
    } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        state.slots  = defaultSlots();
        state.nextId = state.slots.length + 1;
    }
}

/**
 * Loads the column index setting from localStorage into state.colIdx.
 */
function loadColIdxFromStorage() {
    try {
        const colIndex = localStorage.getItem(COL_KEY);
        if (colIndex !== null) state.colIdx = parseInt(colIndex, 10);
    } catch (_) { }
}

/**
 * Loads all persistent state from localStorage (slots and column index).
 */
export function loadFromStorage() {
    loadSlotsFromStorage();
    loadColIdxFromStorage();
}

/**
 * Reads and parses the archive object from localStorage.
 * @returns {Object} The parsed archive, or an empty object if none exists.
 */
export function loadArchive() {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) {
        return JSON.parse(raw);
    }
    return {};
}

/**
 * Writes the archive object back to localStorage.
 * @param {Object} archive - The archive object to persist.
 */
function saveArchive(archive) {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
}

/**
 * Builds a German-formatted date/time string used as the archive entry key.
 * @returns {string} e.g. "20.03.2026 14:05"
 */
function buildArchiveDateKey() {
    const now = new Date();
    const date = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

/**
 * Writes a partition's data into the archive under the given compartment and grain key.
 * @param {string} compartmentKey - e.g. "Lager 5"
 * @param {string} grainKey - e.g. "Hafer"
 * @param {string[]} partyValues - List of party numbers.
 * @param {Object[]} temperatures - List of temperature entries.
 */
function writeToArchive(compartmentKey, grainKey, partyValues, temperatures) {
    const archive = loadArchive();
    const dateKey = buildArchiveDateKey();

    if (!archive[compartmentKey]) archive[compartmentKey] = {};
    if (!archive[compartmentKey][dateKey]) archive[compartmentKey][dateKey] = {};

    archive[compartmentKey][dateKey][grainKey] = {
        partien:      partyValues,
        temperaturen: temperatures,
    };

    saveArchive(archive);
}

export function archiveSlotData(slot) {
    try {
        const compartmentKey = `Lager ${slot.slotNumber}`;
        slot.partitions.forEach(partition => {
            const grainKey = partition.fruchtart || 'Unbekannt';
            writeToArchive(compartmentKey, grainKey, partition.parties.map(party => party.value), partition.temperatures);
        });
    } catch (error) {
        console.warn('Archiving failed:', error);
    }
}

export function archivePartitionData(slot, partition) {
    try {
        const compartmentKey = `Lager ${slot.slotNumber}`;
        const grainKey       = partition.fruchtart || 'Unbekannt';
        writeToArchive(compartmentKey, grainKey, partition.parties.map(party => party.value), partition.temperatures);
    } catch (error) {
        console.warn('Archiving failed:', error);
    }
}

export function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.slots));
        localStorage.setItem(COL_KEY, String(state.colIdx));
    } catch (error) {
        console.warn('Failed to write to localStorage:', error);
        showToast('⚠ Speichern fehlgeschlagen – localStorage voll?');
    }
}

/* ═══════════════════════════════════════════════
   HOSE STORAGE
═══════════════════════════════════════════════ */

/**
 * Loads hose data from localStorage into the state.
 */
export function loadHoseFromStorage() {
    try {
        const raw = localStorage.getItem(HOSE_KEY);
        if (raw) {
            state.hoseSlots  = JSON.parse(raw);
            state.hoseNextId = state.hoseSlots.reduce((max, hose) => Math.max(max, hose.id), 0) + 1;
        } else {
            state.hoseSlots  = [];
            state.hoseNextId = 1;
        }
    } catch (error) {
        console.warn('Failed to read hose data from localStorage:', error);
        state.hoseSlots  = [];
        state.hoseNextId = 1;
    }
}

/**
 * Saves hose data from the state into localStorage.
 */
export function saveHoseToStorage() {
    try {
        localStorage.setItem(HOSE_KEY, JSON.stringify(state.hoseSlots));
    } catch (error) {
        console.warn('Failed to write hose data to localStorage:', error);
        showToast('⚠ Speichern fehlgeschlagen – localStorage voll?');
    }
}

function defaultSlots() {
    const t = nowTimestamp();
    return [
        { id:  1, slotNumber:  1, partitions: [{ label: 'A', fruchtart: 'Hafer',         parties: [{ value: '66-1001', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id:  2, slotNumber:  2, partitions: [{ label: 'A', fruchtart: 'Dinkel im Sp.', parties: [{ value: '66-1002', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id:  3, slotNumber:  3, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id:  4, slotNumber:  4, partitions: [{ label: 'A', fruchtart: 'Weizen br.',     parties: [{ value: '66-1004', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id:  5, slotNumber:  5, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1005', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id:  6, slotNumber:  6, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'gereinigt',  updated: t },
        { id:  7, slotNumber:  7, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1007', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id:  8, slotNumber:  9, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'reserviert', updated: t },
        { id:  9, slotNumber: 10, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id: 10, slotNumber: 11, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'gereinigt',  updated: t },
        { id: 11, slotNumber: 12, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'reserviert', updated: t },
        { id: 12, slotNumber: 13, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id: 13, slotNumber: 14, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1014', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id: 14, slotNumber: 15, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'gereinigt',  updated: t },
        { id: 15, slotNumber: 16, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id: 16, slotNumber: 19, partitions: [{ label: 'A', fruchtart: 'Soja',           parties: [{ value: '66-1019', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id: 17, slotNumber: 20, partitions: [{ label: 'A', fruchtart: 'Raps',           parties: [{ value: '66-1020A', addedAt: t, addedAtMs: 0 }], temperatures: [] }, { label: 'B', fruchtart: 'SBK', parties: [{ value: '66-1020B', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                status: 'voll',       updated: t },
        { id: 18, slotNumber: 21, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id: 19, slotNumber: 22, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1022', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id: 20, slotNumber: 23, partitions: [{ label: 'A', fruchtart: '',               parties: [],                                                                   temperatures: [] }],                                                                                                                status: 'leer',       updated: t },
        { id: 21, slotNumber: 24, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1024', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
        { id: 22, slotNumber: 25, partitions: [{ label: 'A', fruchtart: 'SBK',            parties: [{ value: '66-1025', addedAt: t, addedAtMs: 0 }], temperatures: [] }],                                                                                                                                   status: 'voll',       updated: t },
    ];
}