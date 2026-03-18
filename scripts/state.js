import { showToast, nowTimestamp } from './utils.js';

/* ═══════════════════════════════════════════════
   KONSTANTEN
═══════════════════════════════════════════════ */

export const STORAGE_KEY = 'lager_slots';
export const COL_KEY     = 'lager_col_idx';
export const COL_OPTIONS = [2, 3];

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
    slots:          [],
    nextId:         1,
    editingId:      null,
    tempEntries:    [],
    editingParties: [],
    colIdx:         0,
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
                if (!s.temperatures)  s.temperatures = [];
                if (s.slotNumber == null) s.slotNumber = i + 5;
                if (!s.parties) {
                    s.parties = s.name
                        ? [{ value: s.name, addedAt: s.updated, addedAtMs: 0 }]
                        : [];
                }
                if (s.fruchtart == null) s.fruchtart = '';
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
        { id: 1, slotNumber: 5,  fruchtart: 'Weizen', parties: [{ value: '66-1001', addedAt: t, addedAtMs: 0 }], status: 'leer',       temperatures: [], updated: t },
        { id: 2, slotNumber: 6,  fruchtart: 'Dinkel', parties: [{ value: '66-1002', addedAt: t, addedAtMs: 0 }], status: 'voll',       temperatures: [], updated: t },
        { id: 3, slotNumber: 7,  fruchtart: 'SBK',    parties: [{ value: '66-1003', addedAt: t, addedAtMs: 0 }], status: 'gereinigt',  temperatures: [], updated: t },
        { id: 4, slotNumber: 8,  fruchtart: 'Weizen', parties: [{ value: '66-1004', addedAt: t, addedAtMs: 0 }], status: 'gereinigt',  temperatures: [], updated: t },
        { id: 5, slotNumber: 9,  fruchtart: 'Dinkel', parties: [{ value: '66-1005', addedAt: t, addedAtMs: 0 }], status: 'reserviert', temperatures: [], updated: t },
        { id: 6, slotNumber: 10, fruchtart: 'SBK',    parties: [{ value: '66-1006', addedAt: t, addedAtMs: 0 }], status: 'leer',       temperatures: [], updated: t },
        { id: 7, slotNumber: 11, fruchtart: 'Weizen', parties: [{ value: '66-1007', addedAt: t, addedAtMs: 0 }], status: 'voll',       temperatures: [], updated: t },
        { id: 8, slotNumber: 12, fruchtart: '',       parties: [{ value: '66-1008', addedAt: t, addedAtMs: 0 }], status: 'leer',       temperatures: [], updated: t },
        { id: 9, slotNumber: 13, fruchtart: 'Dinkel', parties: [{ value: '66-1009', addedAt: t, addedAtMs: 0 }], status: 'gereinigt',  temperatures: [], updated: t },
    ];
}
