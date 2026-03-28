import { escHtml } from './utils.js';

/* ═══════════════════════════════════════════════
   HOSE TEMPLATES
═══════════════════════════════════════════════ */

/**
 * Returns the stats template for the hose view.
 * Shows only "Gelegt" with the real count; the remaining 5 fields show "---".
 * @param {number} count - Number of active hoses.
 * @returns {string} HTML string.
 */
export function returnHoseStatsTemplate(count) {
  return `
      <div class="stat">
        <div class="stat-val">${count}</div>
        <div class="stat-lbl">Gelegt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--text3)">---</div>
        <div class="stat-lbl">---</div>
      </div>`;
}

/**
 * Returns the card template for a single hose entry.
 * No status badge – shows location (Wiese/Acker) instead.
 * @param {object} hose      - The hose data object.
 * @param {string} lastParty - The most recently added party number.
 * @returns {string} HTML string.
 */
export function returnHoseCardTemplate(hose, lastParty) {
  let fruchtDisplay = 'Leer';
  if (hose.fruchtart) {
    fruchtDisplay = escHtml(hose.fruchtart);
  }
  let locationLabel = '—';
  if (hose.standort === 'wiese') {
    locationLabel = 'Wiese';
  } else if (hose.standort === 'acker') {
    locationLabel = 'Acker';
  }
  return `
      <div class="slot-num">
        <p class="slot-fach">Schlauch ${hose.slotNumber}</p>
        <div class="slot-fruchtart">${fruchtDisplay}</div>
      </div>
      <div class="slot-name">${escHtml(lastParty)}</div>
      <div class="badge schlauch-standort ${hose.standort || 'wiese'}">${locationLabel}</div>
      <div class="slot-info">${escHtml(hose.updated)}</div>`;
}

/**
 * Returns the template for a single hose note entry.
 * @param {object} note       - The note data object.
 * @param {string} entryClass - CSS classes for the entry element.
 * @returns {string} HTML string.
 */
export function returnWeightNoteEntryTemplate(note, entryClass) {
  return `
      <div class="${entryClass}">
        <div class="temp-entry-preview">
          <span class="temp-preview-range notiz-preview-text">${escHtml(note.weight)}</span>
          <span class="temp-preview-date">${escHtml(note.savedAtDisplay)}</span>
        </div>
        <div class="temp-entry-details">
          <span>${escHtml(note.savedBy)}</span>
        </div>
      </div>`;
}

/* ═══════════════════════════════════════════════
   TEMPLATES
═══════════════════════════════════════════════ */

/**
 * Returns the temperature entry template for a single entry.
 * @param {object} entry      - The temperature entry data object.
 * @param {string} entryClass - CSS classes for the entry element.
 * @returns {string} HTML string.
 */
export function returnTempEntryTemplate(entry, entryClass) {
  return `
      <div class="${entryClass}">
        <div class="temp-entry-preview">
          <span class="temp-preview-range">${entry.von}°C – ${entry.bis}°C</span>
          <span class="temp-preview-date">${escHtml(entry.savedAtDisplay)}</span>
        </div>
        <div class="temp-entry-details">
          <div class="temp-detail-row"><span class="temp-detail-lbl">Sichtkontrolle</span><span>${escHtml(entry.sicht)}</span></div>
          <div class="temp-detail-row"><span class="temp-detail-lbl">Maßnahmen</span><span>${escHtml(entry.massnahmen)}</span></div>
          <div class="temp-entry-meta">
            <span>${escHtml(entry.savedAtDisplay)}</span>
            <span>${escHtml(entry.savedBy)}</span>
          </div>
        </div>
      </div>`;
}

/**
 * Returns the stats template for the warehouse view.
 * @param {number} slotsLength - Total number of slots.
 * @param {object} counts      - Count per status { leer, voll, gereinigt, reserviert }.
 * @returns {string} HTML string.
 */
export function returnStatsTemplate(slotsLength, counts) {
  return `
      <div class="stat">
        <div class="stat-val">${slotsLength}</div>
        <div class="stat-lbl">Gesamt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-voll-txt)">${counts.voll}</div>
        <div class="stat-lbl">Voll</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-reserviert-txt)">${counts.reserviert}</div>
        <div class="stat-lbl">Reserviert</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer + counts.gereinigt}</div>
        <div class="stat-lbl">Leer</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-gereinigt-txt)">${counts.gereinigt}</div>
        <div class="stat-lbl">Gereinigt</div>
      </div>
      <div class="stat">
        <div class="stat-val" style="color:var(--c-leer-txt)">${counts.leer}</div>
        <div class="stat-lbl">Ungereinigt</div>
      </div>`;
}

/**
 * Returns the card template for a single warehouse slot.
 * @param {object} slot           - The slot data object.
 * @param {string} lastParty      - The most recently added party number.
 * @param {string} statusLabel    - Human-readable status label.
 * @param {string} fruchtart      - Grain type.
 * @param {number} partitionCount - Number of partitions in this slot.
 * @returns {string} HTML string.
 */
export function returnSlotCardTemplate(slot, lastParty, statusLabel, fruchtart, partitionCount) {
  let fruchtDisplay = 'Leer';
  if (fruchtart) fruchtDisplay = escHtml(fruchtart);
  let multiIndicator = '';
  if (partitionCount > 1) multiIndicator = '<span class="slot-multi">+</span>';
  return `
      <div class="slot-num">
        <p class="slot-fach">Lager ${slot.slotNumber}</p>
        <div class="slot-fruchtart">${fruchtDisplay}${multiIndicator}</div>
      </div>
      <div class="slot-name">${escHtml(lastParty)}</div>
      <div class="badge ${slot.status}">${statusLabel}</div>
      <div class="slot-info">${escHtml(slot.updated)}</div>`;
}

/**
 * Returns the list item template for a single party number entry.
 * @param {object} party - The party number entry { value, addedAt }.
 * @returns {string} HTML string.
 */
export function returnPartieItemTemplate(party) {
  return `<li class="pn-item">${escHtml(party.value)}<span class="pn-item-date">${escHtml(party.addedAt)}</span></li>`;
}

/**
 * Returns the partition picker overlay template.
 * @param {Array} partitions - Array of partition objects.
 * @returns {string} HTML string.
 */
export function returnPartitionPickerTemplate(partitions) {
  const items = partitions.map((partition, index) => {
    let fruchtDisplay = 'Keine Fruchtart';
    if (partition.fruchtart) fruchtDisplay = escHtml(partition.fruchtart);
    let lastParty = '—';
    if (partition.parties && partition.parties.length > 0) {
      lastParty = escHtml(partition.parties[partition.parties.length - 1].value);
    }
    return `
          <button class="picker-card" data-idx="${index}">
            <div class="picker-label">${escHtml(partition.label)}</div>
            <div class="picker-frucht">${fruchtDisplay}</div>
            <div class="picker-partie">${lastParty}</div>
          </button>`;
  }).join('');
  return `<div class="picker-title">Welche Teilung möchtest du bearbeiten?</div><div class="picker-cards">${items}</div>`;
}

/* ═══════════════════════════════════════════════
   ARCHIVE TEMPLATES
═══════════════════════════════════════════════ */

/**
 * Returns a single header cell for the archive table.
 * @param {string} label - Column header text.
 * @returns {string} HTML string.
 */
export function returnArchiveHeaderCellTemplate(label) {
  return `<th style="padding:6px 10px;background:#222;text-align:left">${escHtml(label)}</th>`;
}

/**
 * Returns a single data cell for the archive table.
 * @param {string} value     - Cell content.
 * @param {string} cellStyle - Full inline style string for the cell.
 * @returns {string} HTML string.
 */
export function returnArchiveDataCellTemplate(value, cellStyle) {
  return `<td style="${cellStyle}">${escHtml(value)}</td>`;
}

/**
 * Returns a single row for the archive table.
 * @param {string} cellsHtml - Pre-built HTML string of all cells.
 * @param {string} bgColor   - Background color for the row.
 * @returns {string} HTML string.
 */
export function returnArchiveDataRowTemplate(cellsHtml, bgColor) {
  return `<tr style="background:${bgColor}">${cellsHtml}</tr>`;
}

/**
 * Returns the full archive table HTML.
 * @param {string} headerHtml - Pre-built HTML string of header cells.
 * @param {string} bodyHtml   - Pre-built HTML string of body rows.
 * @returns {string} HTML string.
 */
export function returnArchiveTableTemplate(headerHtml, bodyHtml) {
  return `
        <table class="archiveTable" border=1>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
        </table>`;
}

/**
 * Returns the partition tabs template.
 * @param {Array}  partitions - Array of partition objects.
 * @param {number} activeIdx  - Index of the currently active partition.
 * @returns {string} HTML string.
 */
export function returnPartitionTabsTemplate(partitions, activeIdx) {
  return partitions.map((partition, index) => {
    let cls = 'partition-tab';
    if (index === activeIdx) cls += ' active';
    return `<button class="${cls}" type="button">${escHtml(partition.label)}</button>`;
  }).join('');
}

export function returnButtonTemplate(id, name) {
  return `
          <button id="${id}" class="btn">${name}</button>
          `
}
