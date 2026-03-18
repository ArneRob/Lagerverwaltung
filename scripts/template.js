import { escHtml } from './utils.js';

/* ═══════════════════════════════════════════════
   TEMPLATES
═══════════════════════════════════════════════ */

export function returnTempEntryTemplate(e, entryClass) {
    return `
      <div class="${entryClass}">
        <div class="temp-entry-preview">
          <span class="temp-preview-range">${e.von}°C – ${e.bis}°C</span>
          <span class="temp-preview-date">${escHtml(e.savedAtDisplay)}</span>
        </div>
        <div class="temp-entry-details">
          <div class="temp-detail-row"><span class="temp-detail-lbl">Sichtkontrolle</span><span>${escHtml(e.sicht)}</span></div>
          <div class="temp-detail-row"><span class="temp-detail-lbl">Maßnahmen</span><span>${escHtml(e.massnahmen)}</span></div>
          <div class="temp-entry-meta">
            <span>${escHtml(e.savedAtDisplay)}</span>
            <span>${escHtml(e.savedBy)}</span>
          </div>
        </div>
      </div>`;
}

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

export function returnSlotCardTemplate(sl, lastPartie, statusLabel, fruchtart) {
    let fruchtDisplay = 'Leer';
    if (fruchtart) fruchtDisplay = escHtml(fruchtart);
    return `
      <div class="slot-num">Fach ${sl.slotNumber} <span class="slot-fruchtart">${fruchtDisplay}</span></div>
      <div class="slot-name">${escHtml(lastPartie)}</div>
      <div class="badge ${sl.status}">${statusLabel}</div>
      <div class="slot-info">${escHtml(sl.updated)}</div>`;
}

export function returnPartieItemTemplate(p) {
    return `<li class="pn-item">${escHtml(p.value)}<span class="pn-item-date">${escHtml(p.addedAt)}</span></li>`;
}

export function returnPartitionPickerTemplate(partitions) {
    const items = partitions.map((p, i) => {
        let fruchtDisplay = 'Keine Fruchtart';
        if (p.fruchtart) fruchtDisplay = escHtml(p.fruchtart);
        let lastPartie = '—';
        if (p.parties && p.parties.length > 0) {
            lastPartie = escHtml(p.parties[p.parties.length - 1].value);
        }
        return `
          <button class="picker-card" data-idx="${i}">
            <div class="picker-label">${escHtml(p.label)}</div>
            <div class="picker-frucht">${fruchtDisplay}</div>
            <div class="picker-partie">${lastPartie}</div>
          </button>`;
    }).join('');
    return `<div class="picker-title">Welche Teilung möchtest du bearbeiten?</div><div class="picker-cards">${items}</div>`;
}

export function returnPartitionTabsTemplate(partitions, activeIdx) {
    return partitions.map((p, i) => {
        let cls = 'partition-tab';
        if (i === activeIdx) cls += ' active';
        return `<button class="${cls}" type="button">${escHtml(p.label)}</button>`;
    }).join('');
}
