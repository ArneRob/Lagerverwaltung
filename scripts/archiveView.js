import { loadArchive } from './state.js';
import {
    returnArchiveHeaderCellTemplate,
    returnArchiveDataCellTemplate,
    returnArchiveDataRowTemplate,
    returnArchiveTableTemplate,
    returnButtonTemplate,
} from './template.js';

/* ═══════════════════════════════════════════════
   ARCHIVE VIEW
═══════════════════════════════════════════════ */

/**
 * Returns archive entries sorted numerically by slot number.
 * @param {Object} archive - The raw archive object.
 * @returns {Array} Sorted array of [slotKey, slotData] pairs.
 */
function getSortedSlotEntries(archive) {
    return Object.entries(archive).sort((entryA, entryB) => {
        const slotNumberA = parseInt(entryA[0].replace(/\D/g, ''), 10);
        const slotNumberB = parseInt(entryB[0].replace(/\D/g, ''), 10);
        return slotNumberA - slotNumberB;
    });
}

/**
 * Builds a row object for a grain entry with no control entries.
 * @param {string} dateKey - Date the slot was cleared.
 * @param {string} grainKey - Fruchtart name.
 * @param {string} partiesString - Comma-separated list of Partie numbers.
 * @returns {Object} Row object with empty control fields.
 */
function buildEmptyRow(dateKey, grainKey, partiesString) {
    return {
        slot: '',
        clearedAt: dateKey,
        grainType: grainKey,
        parties: partiesString,
        controlDate: '—',
        tempFrom: '—',
        tempTo: '—',
        visualCheck: '—',
        measures: '—',
        recordedBy: '—',
    };
}

/**
 * Builds a row object for a single control entry.
 * @param {string} dateKey - Date the slot was cleared.
 * @param {string} grainKey - Fruchtart name.
 * @param {string} partiesString - Comma-separated list of Partie numbers.
 * @param {Object} controlEntry - The control entry object.
 * @returns {Object} Row object populated with control data.
 */
function buildControlRow(dateKey, grainKey, partiesString, controlEntry) {
    return {
        slot: '',
        clearedAt: dateKey,
        grainType: grainKey,
        parties: partiesString,
        controlDate: controlEntry.savedAtDisplay,
        tempFrom: `${controlEntry.von}°C`,
        tempTo: `${controlEntry.bis}°C`,
        visualCheck: controlEntry.sicht || '—',
        measures: controlEntry.massnahmen || '—',
        recordedBy: controlEntry.savedBy || '—',
    };
}

/**
 * Builds all rows for a single grain entry.
 * @param {string} dateKey - Date the slot was cleared.
 * @param {string} grainKey - Fruchtart name.
 * @param {Object} grainEntry - The grain entry containing partien and temperaturen.
 * @returns {Object[]} Array of row objects.
 */
function buildRowsForGrain(dateKey, grainKey, grainEntry) {
    const partiesString = grainEntry.partien.join(', ');
    const grainRows = [];

    if (grainEntry.temperaturen.length === 0) {
        grainRows.push(buildEmptyRow(dateKey, grainKey, partiesString));
        return grainRows;
    }

    for (let tempIndex = 0; tempIndex < grainEntry.temperaturen.length; tempIndex++) {
        grainRows.push(buildControlRow(dateKey, grainKey, partiesString, grainEntry.temperaturen[tempIndex]));
    }
    return grainRows;
}

/**
 * Builds all rows for a single slot, sorted by date.
 * Sets the slot field only on the first row; all others remain empty.
 * @param {string} slotKey - The slot name e.g. "Lager 5".
 * @param {Object} slotData - All date entries for this slot.
 * @returns {Object[]} Array of row objects.
 */
function buildRowsForSlot(slotKey, slotData) {
    const slotRows = [];
    const dateEntries = Object.entries(slotData).sort((entryA, entryB) => entryA[0].localeCompare(entryB[0]));

    for (let dateIndex = 0; dateIndex < dateEntries.length; dateIndex++) {
        const [dateKey, grainData] = dateEntries[dateIndex];
        const grainEntries = Object.entries(grainData);

        for (let grainIndex = 0; grainIndex < grainEntries.length; grainIndex++) {
            const [grainKey, grainEntry] = grainEntries[grainIndex];
            const grainRows = buildRowsForGrain(dateKey, grainKey, grainEntry);
            for (let rowIndex = 0; rowIndex < grainRows.length; rowIndex++) {
                slotRows.push(grainRows[rowIndex]);
            }
        }
    }

    if (slotRows.length > 0) slotRows[0].slot = slotKey;
    return slotRows;
}

/**
 * Flattens the full archive into a sorted array of rows, one row per control entry.
 * @returns {Object[]} Array of row objects.
 */
function flattenArchiveToRows() {
    const archive = loadArchive();
    const sortedSlotEntries = getSortedSlotEntries(archive);
    const archiveRows = [];

    for (let slotIndex = 0; slotIndex < sortedSlotEntries.length; slotIndex++) {
        const [slotKey, slotData] = sortedSlotEntries[slotIndex];
        const slotRows = buildRowsForSlot(slotKey, slotData);
        for (let rowIndex = 0; rowIndex < slotRows.length; rowIndex++) {
            archiveRows.push(slotRows[rowIndex]);
        }
    }

    return archiveRows;
}

/**
 * Builds and renders the archive table into the document body.
 * Called when the user clicks the "Import Archiv" button.
 */
const ARCHIVE_COLUMNS = [
    { key: 'slot', label: 'Lager' },
    { key: 'clearedAt', label: 'Geleert am' },
    { key: 'grainType', label: 'Fruchtart' },
    { key: 'parties', label: 'Partien' },
    { key: 'controlDate', label: 'Kontrolldatum' },
    { key: 'tempFrom', label: 'Von' },
    { key: 'tempTo', label: 'Bis' },
    { key: 'visualCheck', label: 'Sichtkontrolle' },
    { key: 'measures', label: 'Maßnahmen' },
    { key: 'recordedBy', label: 'Erfasst von' },
];

/**
 * Returns the inline style for an archive table cell.
 * @param {boolean} isSlotFirstRow - Whether this row is the first row of a slot group.
 * @param {string}  columnKey      - The column key to check for bold styling.
 * @returns {string} Inline style string.
 */
function buildArchiveCellStyle(isSlotFirstRow, columnKey) {
    if (isSlotFirstRow && columnKey === 'slot') {
        return 'padding:5px 10px;font-weight:bold';
    }
    return 'padding:5px 10px';
}

/**
 * Returns the background color for an archive table row.
 * @param {Object} row      - The row data object.
 * @param {number} rowIndex - The index of the row in the full list.
 * @returns {string} CSS color value.
 */
function buildArchiveRowBgColor(row, rowIndex) {
    if (row.slot !== '') return '#1a1a2e';
    if (rowIndex % 2 === 0) return '#111';
    return '#1a1a1a';
}

/**
 * Returns the full HTML string for a single archive table row.
 * @param {Object}   row      - The row data object.
 * @param {Object[]} columns  - Column definitions with key and label.
 * @param {number}   rowIndex - The index of the row in the full list.
 * @returns {string} HTML string.
 */
function buildArchiveRowHtml(row, columns, rowIndex) {
    const isSlotFirstRow = row.slot !== '';
    const cellsHtml = columns.map(column => {
        const cellStyle = buildArchiveCellStyle(isSlotFirstRow, column.key);
        return returnArchiveDataCellTemplate(row[column.key], cellStyle);
    }).join('');
    return returnArchiveDataRowTemplate(cellsHtml, buildArchiveRowBgColor(row, rowIndex));
}

/**
 * Returns the full HTML string for the archive table header row.
 * @param {Object[]} columns - Column definitions with key and label.
 * @returns {string} HTML string.
 */
function buildArchiveHeaderHtml(columns) {
    return columns.map(column => returnArchiveHeaderCellTemplate(column.label)).join('');
}

/**
 * Returns the full HTML string for all archive table body rows.
 * @param {Object[]} archiveRows - Flattened array of row data objects.
 * @param {Object[]} columns     - Column definitions with key and label.
 * @returns {string} HTML string.
 */
function buildArchiveBodyHtml(archiveRows, columns) {
    return archiveRows.map((row, rowIndex) => buildArchiveRowHtml(row, columns, rowIndex)).join('');
}

/**
 * Builds and renders the archive table into the document body.
 * Called when the user clicks the "Import Archiv" button.
 */
export function importArchive() {
    const archiveRows = flattenArchiveToRows();
    let archiveTableImportData = document.getElementById('archivTableImportData')
    let grainCompartmentDashboard = document.getElementById('grainCompartmentDashboard')
    if (archiveRows.length === 0) {
        alert('Kein Archiv vorhanden.');
        return;
    }

    const headerHtml = buildArchiveHeaderHtml(ARCHIVE_COLUMNS);
    const bodyHtml = buildArchiveBodyHtml(archiveRows, ARCHIVE_COLUMNS);
    grainCompartmentDashboard.classList.add('d_none');
    archiveTableImportData.innerHTML = returnButtonTemplate("dashBoardButton", "Dashboard") + returnArchiveTableTemplate(headerHtml, bodyHtml);
    const dashBoardButton = document.getElementById('dashBoardButton');
    dashBoardButton.style.marginBottom = '20px';
    dashBoardButton.addEventListener('click', returnToDashBoard);

}


/**
 * deletes all table data in archivTableImportData 
 * Called when the user clicks the "Dashboard" button.
 */
function returnToDashBoard() {
    let archiveTableImportData = document.getElementById('archivTableImportData')
    let grainCompartmentDashboard = document.getElementById('grainCompartmentDashboard')

    archiveTableImportData.innerHTML = ""
    grainCompartmentDashboard.classList.remove('d_none')
}