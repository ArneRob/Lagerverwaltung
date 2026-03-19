import { state, loadFromStorage, loadHoseFromStorage } from './state.js';
import { logout } from './utils.js';
import { render, cycleLayout, setActiveView } from './render.js';
import {
    openAdd, openEdit, closeModal, saveSlot, clearSlot, deleteSlot,
    openHoseAdd, openHoseEdit, closeHoseModal, saveHose, deleteHose,
    toggleHosePartyDropdown, openHoseNewPartyInput, confirmHoseNewParty,
    toggleHoseLocationDropdown, setHoseLocationValue,
} from './modal.js';
import { addPartition } from './partition.js';
import { toggleDropdown, selectStatus, togglePartieDropdown, openNewPartieInput, confirmNewPartie } from './dropdown.js';
import {
    openTempForm, closeTempForm, saveTempEntry, toggleTempEntry,
    openNoteForm, closeNoteForm, saveNoteEntry, toggleNoteEntry,
} from './temperature.js';

/* ═══════════════════════════════════════════════
   EVENT HANDLERS & INIT
═══════════════════════════════════════════════ */

function init() {
    loadFromStorage();
    loadHoseFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${state.slots.length} Fächer geladen · Klicke auf ein Lager zum Bearbeiten`;

    // Topbar
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('layout-btn').addEventListener('click', cycleLayout);
    document.getElementById('add-btn').addEventListener('click', () => {
        if (state.activeView === 'schlauch') {
            openHoseAdd();
        } else {
            openAdd();
        }
    });

    // View tabs
    document.getElementById('tab-lager').addEventListener('click',    () => setActiveView('lager'));
    document.getElementById('tab-schlauch').addEventListener('click', () => setActiveView('schlauch'));

    // Grid – event delegation for warehouse and hose cards
    document.getElementById('grid').addEventListener('click', (event) => {
        const hoseCard    = event.target.closest('.schlauch-card');
        const hoseAddBtn  = event.target.closest('[data-action="add-schlauch"]');
        const slotCard    = event.target.closest('.slot');
        const slotAddBtn  = event.target.closest('[data-action="add-slot"]');

        if (hoseCard)   { openHoseEdit(parseInt(hoseCard.dataset.schlauchId, 10)); return; }
        if (hoseAddBtn) { openHoseAdd(); return; }
        if (slotCard)   { openEdit(parseInt(slotCard.dataset.id, 10)); return; }
        if (slotAddBtn) { openAdd(); }
    });

    // Warehouse main overlay
    document.getElementById('overlay').addEventListener('click', (event) => {
        if (event.target.id === 'overlay') closeModal();
    });
    document.getElementById('del-btn').addEventListener('click', deleteSlot);
    document.getElementById('clear-btn').addEventListener('click', clearSlot);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveSlot);

    // Partition
    document.getElementById('add-partition-btn').addEventListener('click', addPartition);

    // Warehouse status dropdown
    document.getElementById('status-trigger').addEventListener('click', toggleDropdown);
    document.querySelectorAll('#status-dropdown .cs-item').forEach(listItem => {
        listItem.addEventListener('click', () => selectStatus(listItem));
    });

    // Warehouse party dropdown
    document.getElementById('partie-trigger').addEventListener('click', togglePartieDropdown);
    document.getElementById('partie-add-btn').addEventListener('click', openNewPartieInput);
    document.getElementById('pn-ok-btn').addEventListener('click', confirmNewPartie);
    document.getElementById('pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmNewPartie(); }
    });

    // Temperature overlay
    document.getElementById('temp-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'temp-overlay') closeTempForm();
    });
    document.getElementById('temp-add-btn').addEventListener('click', openTempForm);
    document.getElementById('temp-cancel-btn').addEventListener('click', closeTempForm);
    document.getElementById('temp-save-btn').addEventListener('click', saveTempEntry);

    // Temperature list – event delegation for dynamic entries
    document.getElementById('temp-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleTempEntry(entry);
    });

    // Hose main overlay
    document.getElementById('schlauch-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'schlauch-overlay') closeHoseModal();
    });
    document.getElementById('sc-del-btn').addEventListener('click', deleteHose);
    document.getElementById('sc-modal-cancel-btn').addEventListener('click', closeHoseModal);
    document.getElementById('sc-modal-save-btn').addEventListener('click', saveHose);

    // Hose party dropdown
    document.getElementById('sc-partie-trigger').addEventListener('click', toggleHosePartyDropdown);
    document.getElementById('sc-partie-add-btn').addEventListener('click', openHoseNewPartyInput);
    document.getElementById('sc-pn-ok-btn').addEventListener('click', confirmHoseNewParty);
    document.getElementById('sc-pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmHoseNewParty(); }
    });

    // Hose location dropdown
    document.getElementById('sc-standort-trigger').addEventListener('click', toggleHoseLocationDropdown);
    document.querySelectorAll('.sc-standort-item').forEach(item => {
        item.addEventListener('click', () => setHoseLocationValue(item.dataset.value));
    });

    // Hose note overlay
    document.getElementById('schlauch-notiz-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'schlauch-notiz-overlay') closeNoteForm();
    });
    document.getElementById('sc-notiz-add-btn').addEventListener('click', openNoteForm);
    document.getElementById('sn-cancel-btn').addEventListener('click', closeNoteForm);
    document.getElementById('sn-save-btn').addEventListener('click', saveNoteEntry);

    // Note list – event delegation for dynamic entries
    document.getElementById('sc-notiz-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleNoteEntry(entry);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        const warehouseOpen = document.getElementById('overlay').classList.contains('open');
        const hoseOpen      = document.getElementById('schlauch-overlay').classList.contains('open');

        if (warehouseOpen) {
            if (event.key === 'Escape') { closeModal(); return; }
            if (event.key === 'Enter'
                && event.target.tagName !== 'TEXTAREA'
                && event.target.id !== 'pn-new-input'
                && event.target.id !== 'f-num') {
                event.preventDefault();
                saveSlot();
            }
        }
        if (hoseOpen) {
            if (event.key === 'Escape') { closeHoseModal(); return; }
            if (event.key === 'Enter'
                && event.target.tagName !== 'TEXTAREA'
                && event.target.id !== 'sc-pn-new-input'
                && event.target.id !== 'sc-f-num') {
                event.preventDefault();
                saveHose();
            }
        }
    });

    // Close all dropdowns on outside click
    document.addEventListener('click', () => {
        document.getElementById('status-dropdown')?.classList.remove('open');
        document.getElementById('partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-standort-dropdown')?.classList.remove('open');
    });
}

init();
