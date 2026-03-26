import { state, loadFromStorage, loadHoseFromStorage } from './state.js';
import { importArchive } from './archiveView.js';
import { logout } from './utils.js';
import { render, cycleLayout, setActiveView } from './render.js';
import { openAdd, openEdit, closeModal, saveSlot, clearSlot, deleteSlot } from './modals/modalCompartment.js';
import {
    openHoseAdd, openHoseEdit, closeHoseModal, saveHose, deleteHose,
    toggleHosePartyDropdown, openHoseNewPartyInput, confirmHoseNewParty,
    toggleHoseLocationDropdown, setHoseLocationValue,
    openWeightNoteForm, closeWeightNoteForm, saveWeightNoteEntry, toggleWeightNoteEntry,
} from './modals/modalHose.js';
import { addPartition } from './partition.js';
import { toggleDropdown, selectStatus, togglePartieDropdown, openNewPartieInput, confirmNewPartie } from './dropdown.js';
import { openTempForm, closeTempForm, saveTempEntry, toggleTempEntry } from './temperature.js';

/* ═══════════════════════════════════════════════
   EVENT HANDLERS & INIT
═══════════════════════════════════════════════ */

/**
 * Lädt Daten aus dem Storage, rendert die Ansicht und setzt den Untertitel.
 */
function initApp() {
    loadFromStorage();
    loadHoseFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${state.slots.length} Fächer geladen · Klicke auf ein Lager zum Bearbeiten`;
}

/**
 * Registriert Event-Handler für die Topbar (Logout, Layout, Hinzufügen).
 */
function initTopbar() {
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('import-archiv-btn').addEventListener('click', importArchive);
    document.getElementById('layout-btn').addEventListener('click', cycleLayout);
    document.getElementById('add-btn').addEventListener('click', () => {
        if (state.activeView === 'schlauch') {
            openHoseAdd();
        } else {
            openAdd();
        }
    });
}

/**
 * Registriert Event-Handler für die Ansichts-Tabs (Lager / Schlauch).
 */
function initViewTabs() {
    document.getElementById('tab-lager').addEventListener('click', () => setActiveView('lager'));
    document.getElementById('tab-schlauch').addEventListener('click', () => setActiveView('schlauch'));
}

/**
 * Registriert Event-Delegation auf dem Grid für Lager- und Schlauch-Karten.
 */
function initGrid() {
    document.getElementById('grid').addEventListener('click', (event) => {
        const hoseCard = event.target.closest('.schlauch-card');
        const hoseAddBtn = event.target.closest('[data-action="add-schlauch"]');
        const slotCard = event.target.closest('.slot');
        const slotAddBtn = event.target.closest('[data-action="add-slot"]');

        if (hoseCard) { openHoseEdit(parseInt(hoseCard.dataset.schlauchId, 10)); return; }
        if (hoseAddBtn) { openHoseAdd(); return; }
        if (slotCard) { openEdit(parseInt(slotCard.dataset.id, 10)); return; }
        if (slotAddBtn) { openAdd(); }
    });
}

/**
 * Registriert Event-Handler für das Lager-Modal (Overlay, Löschen, Leeren, Abbrechen, Speichern).
 */
function initWarehouseModal() {
    document.getElementById('overlay').addEventListener('click', (event) => {
        if (event.target.id === 'overlay') closeModal();
    });
    document.getElementById('del-btn').addEventListener('click', deleteSlot);
    document.getElementById('clear-btn').addEventListener('click', clearSlot);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveSlot);
}

/**
 * Registriert den Event-Handler für den Partition-Hinzufügen-Button.
 */
function initPartition() {
    document.getElementById('add-partition-btn').addEventListener('click', addPartition);
}

/**
 * Registriert Event-Handler für das Lager-Status-Dropdown.
 */
function initWarehouseStatusDropdown() {
    document.getElementById('status-trigger').addEventListener('click', toggleDropdown);
    document.querySelectorAll('#status-dropdown .cs-item').forEach(listItem => {
        listItem.addEventListener('click', () => selectStatus(listItem));
    });
}

/**
 * Registriert Event-Handler für das Lager-Partie-Dropdown (Trigger, Hinzufügen, Bestätigen, Enter-Key).
 */
function initWarehousePartyDropdown() {
    document.getElementById('partie-trigger').addEventListener('click', togglePartieDropdown);
    document.getElementById('partie-add-btn').addEventListener('click', openNewPartieInput);
    document.getElementById('pn-ok-btn').addEventListener('click', confirmNewPartie);
    document.getElementById('pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmNewPartie(); }
    });
}

/**
 * Registriert Event-Handler für das Temperatur-Overlay (Buttons und Listen-Delegation).
 */
function initTemperatureOverlay() {
    document.getElementById('temp-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'temp-overlay') closeTempForm();
    });
    document.getElementById('temp-add-btn').addEventListener('click', openTempForm);
    document.getElementById('temp-cancel-btn').addEventListener('click', closeTempForm);
    document.getElementById('temp-save-btn').addEventListener('click', saveTempEntry);

    document.getElementById('temp-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleTempEntry(entry);
    });
}

/**
 * Registriert Event-Handler für das Schlauch-Modal (Overlay, Löschen, Abbrechen, Speichern).
 */
function initHoseModal() {
    document.getElementById('schlauch-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'schlauch-overlay') closeHoseModal();
    });
    document.getElementById('sc-del-btn').addEventListener('click', deleteHose);
    document.getElementById('sc-modal-cancel-btn').addEventListener('click', closeHoseModal);
    document.getElementById('sc-modal-save-btn').addEventListener('click', saveHose);
}

/**
 * Registriert Event-Handler für das Schlauch-Partie-Dropdown (Trigger, Hinzufügen, Bestätigen, Enter-Key).
 */
function initHosePartyDropdown() {
    document.getElementById('sc-partie-trigger').addEventListener('click', toggleHosePartyDropdown);
    document.getElementById('sc-partie-add-btn').addEventListener('click', openHoseNewPartyInput);
    document.getElementById('sc-pn-ok-btn').addEventListener('click', confirmHoseNewParty);
    document.getElementById('sc-pn-new-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); confirmHoseNewParty(); }
    });
}

/**
 * Registriert Event-Handler für das Schlauch-Standort-Dropdown.
 */
function initHoseLocationDropdown() {
    document.getElementById('sc-standort-trigger').addEventListener('click', toggleHoseLocationDropdown);
    document.querySelectorAll('.sc-standort-item').forEach(item => {
        item.addEventListener('click', () => setHoseLocationValue(item.dataset.value));
    });
}

/**
 * Registriert Event-Handler für das Schlauch-Notiz-Overlay (Buttons und Listen-Delegation).
 */
function initWeightNoteOverlay() {
    document.getElementById('weight-note-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'weight-note-overlay') closeWeightNoteForm();
    });
    document.getElementById('weight-note-add-btn').addEventListener('click', openWeightNoteForm);
    document.getElementById('weight-note-cancel-btn').addEventListener('click', closeWeightNoteForm);
    document.getElementById('weight-note-save-btn').addEventListener('click', saveWeightNoteEntry);

    document.getElementById('weight-note-list').addEventListener('click', (event) => {
        const entry = event.target.closest('.temp-entry');
        if (entry) toggleWeightNoteEntry(entry);
    });
}

/**
 * Registriert globale Tastatur-Shortcuts (Escape und Enter) für Lager- und Schlauch-Modal.
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        const warehouseOpen = document.getElementById('overlay').classList.contains('open');
        const hoseOpen = document.getElementById('schlauch-overlay').classList.contains('open');

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
}

/**
 * Schließt alle Dropdowns bei einem Klick außerhalb.
 */
function initDropdownOutsideClick() {
    document.addEventListener('click', () => {
        document.getElementById('status-dropdown')?.classList.remove('open');
        document.getElementById('partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-partie-dropdown')?.classList.remove('open');
        document.getElementById('sc-standort-dropdown')?.classList.remove('open');
    });
}

/**
 * Einstiegspunkt: Initialisiert App-Daten und alle Event-Handler.
 */
function init() {
    initApp();
    initTopbar();
    initViewTabs();
    initGrid();
    initWarehouseModal();
    initPartition();
    initWarehouseStatusDropdown();
    initWarehousePartyDropdown();
    initTemperatureOverlay();
    initHoseModal();
    initHosePartyDropdown();
    initHoseLocationDropdown();
    initWeightNoteOverlay();
    initKeyboardShortcuts();
    initDropdownOutsideClick();
}

init();
