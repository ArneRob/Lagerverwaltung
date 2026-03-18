import { state, loadFromStorage } from './state.js';
import { logout } from './utils.js';
import { render, cycleLayout } from './render.js';
import { openAdd, openEdit, closeModal, saveSlot, clearSlot, deleteSlot } from './modal.js';
import { addPartition } from './partition.js';
import { toggleDropdown, selectStatus, togglePartieDropdown, openNewPartieInput, confirmNewPartie } from './dropdown.js';
import { openTempForm, closeTempForm, saveTempEntry, toggleTempEntry } from './temperature.js';

/* ═══════════════════════════════════════════════
   EVENT HANDLER & INIT
═══════════════════════════════════════════════ */

function init() {
    loadFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${state.slots.length} Fächer geladen · Klicke auf ein Fach zum Bearbeiten`;

    // Topbar
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('layout-btn').addEventListener('click', cycleLayout);
    document.getElementById('add-btn').addEventListener('click', openAdd);

    // Grid – Event-Delegation für Slot-Karten und Add-Button
    document.getElementById('grid').addEventListener('click', (event) => {
        const card    = event.target.closest('.slot');
        const addBtn  = event.target.closest('[data-action="add-slot"]');
        if (card) openEdit(parseInt(card.dataset.id, 10));
        if (addBtn) openAdd();
    });

    // Haupt-Overlay
    document.getElementById('overlay').addEventListener('click', (event) => {
        if (event.target.id === 'overlay') closeModal();
    });
    document.getElementById('del-btn').addEventListener('click', deleteSlot);
    document.getElementById('clear-btn').addEventListener('click', clearSlot);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveSlot);

    // Partition
    document.getElementById('add-partition-btn').addEventListener('click', addPartition);

    // Status-Dropdown
    document.getElementById('status-trigger').addEventListener('click', toggleDropdown);
    document.querySelectorAll('.cs-item').forEach(listItem => {
        listItem.addEventListener('click', () => selectStatus(listItem));
    });

    // Partie-Dropdown
    document.getElementById('partie-trigger').addEventListener('click', togglePartieDropdown);
    document.getElementById('partie-add-btn').addEventListener('click', openNewPartieInput);
    document.getElementById('pn-ok-btn').addEventListener('click', confirmNewPartie);
    document.getElementById('pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmNewPartie(); }
    });

    // Temperatur-Overlay
    document.getElementById('temp-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'temp-overlay') closeTempForm();
    });
    document.getElementById('temp-add-btn').addEventListener('click', openTempForm);
    document.getElementById('temp-cancel-btn').addEventListener('click', closeTempForm);
    document.getElementById('temp-save-btn').addEventListener('click', saveTempEntry);

    // Temperaturliste – Event-Delegation für dynamische Einträge
    document.getElementById('temp-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleTempEntry(entry);
    });

    // Tastatur
    document.addEventListener('keydown', (event) => {
        if (!document.getElementById('overlay').classList.contains('open')) return;
        if (event.key === 'Escape') closeModal();
        if (event.key === 'Enter'
            && event.target.tagName !== 'TEXTAREA'
            && event.target.id !== 'pn-new-input'
            && event.target.id !== 'f-num') {
            event.preventDefault();
            saveSlot();
        }
    });

    // Dropdowns bei Klick außerhalb schließen
    document.addEventListener('click', () => {
        document.getElementById('status-dropdown')?.classList.remove('open');
        document.getElementById('partie-dropdown')?.classList.remove('open');
    });
}

init();
