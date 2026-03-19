import { showToast, nowTimestamp } from './utils.js';

/* ═══════════════════════════════════════════════
   KONSTANTEN
═══════════════════════════════════════════════ */

export const STORAGE_KEY  = 'lager_slots';
export const COL_KEY      = 'lager_col_idx';
export const ARCHIVE_KEY  = 'lager_archiv';
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
};

/* ═══════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════ */

export function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            state.slots = JSON.parse(raw);
            state.slots.forEach((s, i) => {
                if (s.slotNumber == null) s.slotNumber = i + 5;
                if (!s.partitions) {
                    s.partitions = [{
                        label:        'A',
                        fruchtart:    s.fruchtart || '',
                        parties:      s.parties || [],
                        temperatures: s.temperatures || [],
                    }];
                }
            });
            state.nextId = state.slots.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        } else {
            state.slots  = defaultSlots();
            state.nextId = state.slots.length + 1;
        }
    } catch (e) {
        console.warn('localStorage lesen fehlgeschlagen:', e);
        state.slots  = defaultSlots();
        state.nextId = state.slots.length + 1;
    }

    try {
        const ci = localStorage.getItem(COL_KEY);
        if (ci !== null) state.colIdx = parseInt(ci, 10);
    } catch (_) { }
}

function writeToArchive(fachKey, fruchtKey, partienValues, temperaturen) {
    const raw    = localStorage.getItem(ARCHIVE_KEY);
    const archiv = raw ? JSON.parse(raw) : {};

    if (!archiv[fachKey]) {
        archiv[fachKey] = {};
    }

    const now      = new Date();
    const datumKey = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                   + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    if (!archiv[fachKey][datumKey]) {
        archiv[fachKey][datumKey] = {};
    }

    archiv[fachKey][datumKey][fruchtKey] = {
        partien:      partienValues,
        temperaturen: temperaturen,
    };

    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archiv));
}

export function archiveSlotData(slot) {
    try {
        const fachKey = `Lager ${slot.slotNumber}`;
        slot.partitions.forEach(partition => {
            const fruchtKey = partition.fruchtart || 'Unbekannt';
            writeToArchive(fachKey, fruchtKey, partition.parties.map(x => x.value), partition.temperatures);
        });
    } catch (e) {
        console.warn('Archivierung fehlgeschlagen:', e);
    }
}

export function archivePartitionData(slot, partition) {
    try {
        const fachKey   = `Lager ${slot.slotNumber}`;
        const fruchtKey = partition.fruchtart || 'Unbekannt';
        writeToArchive(fachKey, fruchtKey, partition.parties.map(x => x.value), partition.temperatures);
    } catch (e) {
        console.warn('Archivierung fehlgeschlagen:', e);
    }
}

export function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.slots));
        localStorage.setItem(COL_KEY, String(state.colIdx));
    } catch (e) {
        console.warn('localStorage schreiben fehlgeschlagen:', e);
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
