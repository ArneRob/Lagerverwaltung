/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */

if (localStorage.getItem('lager_auth') !== 'true') {
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('lager_auth');
    localStorage.removeItem('lager_user');
    window.location.href = 'index.html';
}

/* ═══════════════════════════════════════════════
   KONSTANTEN
═══════════════════════════════════════════════ */

const STORAGE_KEY = 'lager_slots';
const COL_KEY     = 'lager_col_idx';
const COL_OPTIONS = [2, 3];

const STATUS_LABELS = {
    leer:       'Ungereinigt',
    voll:       'Voll',
    gereinigt:  'Gereinigt',
    reserviert: 'Reserviert',
};

const SICHT_LABELS = { ok: 'OK', schaedling: 'Schädlingsbefall', schimmel: 'Schimmel' };

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */

let slots         = [];
let nextId        = 1;
let editingId     = null;
let tempEntries   = [];
let editingParties = [];
let colIdx        = 0;

/* ═══════════════════════════════════════════════
   HILFSFUNKTIONEN
═══════════════════════════════════════════════ */

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function nowTimestamp() {
    const d = new Date();
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, duration = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════ */

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            slots = JSON.parse(raw);
            slots.forEach((s, i) => {
                if (!s.temperatures) s.temperatures = [];
                if (s.slotNumber == null) s.slotNumber = i + 5;
                if (!s.parties) {
                    s.parties = s.name ? [{ value: s.name, addedAt: s.updated, addedAtMs: 0 }] : [];
                }
                if (s.fruchtart == null) s.fruchtart = '';
            });
            nextId = slots.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        } else {
            slots = defaultSlots();
            nextId = slots.length + 1;
        }
    } catch (e) {
        console.warn('localStorage lesen fehlgeschlagen:', e);
        slots = defaultSlots();
        nextId = slots.length + 1;
    }

    try {
        const ci = localStorage.getItem(COL_KEY);
        if (ci !== null) colIdx = parseInt(ci, 10);
    } catch (_) { }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
        localStorage.setItem(COL_KEY, String(colIdx));
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
