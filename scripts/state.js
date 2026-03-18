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

export function archiveSlotData(slot) {
    try {
        const raw     = localStorage.getItem(ARCHIVE_KEY);
        const archiv  = raw ? JSON.parse(raw) : {};
        const fachKey = `Fach ${slot.slotNumber}`;

        if (!archiv[fachKey]) {
            archiv[fachKey] = {};
        }

        const now         = new Date();
        const datumKey    = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const eintrag     = {};

        slot.partitions.forEach(p => {
            const fruchtKey      = p.fruchtart || 'Unbekannt';
            eintrag[fruchtKey]   = {
                partien:      p.parties.map(x => x.value),
                temperaturen: p.temperatures,
            };
        });

        archiv[fachKey][datumKey] = eintrag;
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archiv));
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
        { id: 1, slotNumber: 5,  partitions: [{ label: 'A', fruchtart: 'Weizen', parties: [{ value: '66-1001', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'leer',       updated: t },
        { id: 2, slotNumber: 6,  partitions: [{ label: 'A', fruchtart: 'Dinkel', parties: [{ value: '66-1002', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'voll',       updated: t },
        { id: 3, slotNumber: 7,  partitions: [{ label: 'A', fruchtart: 'SBK',    parties: [{ value: '66-1003', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'gereinigt',  updated: t },
        { id: 4, slotNumber: 8,  partitions: [{ label: 'A', fruchtart: 'Weizen', parties: [{ value: '66-1004', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'gereinigt',  updated: t },
        { id: 5, slotNumber: 9,  partitions: [{ label: 'A', fruchtart: 'Dinkel', parties: [{ value: '66-1005', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'reserviert', updated: t },
        { id: 6, slotNumber: 10, partitions: [{ label: 'A', fruchtart: 'SBK',    parties: [{ value: '66-1006', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'leer',       updated: t },
        { id: 7, slotNumber: 11, partitions: [{ label: 'A', fruchtart: 'Weizen', parties: [{ value: '66-1007', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'voll',       updated: t },
        { id: 8, slotNumber: 12, partitions: [{ label: 'A', fruchtart: '',       parties: [{ value: '66-1008', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'leer',       updated: t },
        { id: 9, slotNumber: 13, partitions: [{ label: 'A', fruchtart: 'Dinkel', parties: [{ value: '66-1009', addedAt: t, addedAtMs: 0 }], temperatures: [] }], status: 'gereinigt',  updated: t },
    ];
}
