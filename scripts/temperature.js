import { escHtml, showToast } from './utils.js';
import { state } from './state.js';

/* ═══════════════════════════════════════════════
   TEMPERATUR-EINTRÄGE
═══════════════════════════════════════════════ */

export function isTempLocked(entry) {
    return Date.now() - entry.savedAtMs > 60000;
}

export function toggleTempEntry(el) {
    el.classList.toggle('open');
}

export function renderTempList() {
    const list = document.getElementById('temp-list');
    if (!list) return;
    if (state.tempEntries.length === 0) {
        list.innerHTML = '<div class="temp-empty">Noch keine Einträge</div>';
        return;
    }
    list.innerHTML = state.tempEntries.map((e) => {
        const locked = isTempLocked(e);
        return `
          <div class="temp-entry${locked ? ' temp-locked' : ''}">
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
    }).join('');
}

export function openTempForm() {
    document.getElementById('t-von').value        = '';
    document.getElementById('t-bis').value        = '';
    document.getElementById('t-sicht').value      = '';
    document.getElementById('t-massnahmen').value = '';
    document.getElementById('temp-overlay').classList.add('open');
    document.getElementById('t-von').focus();
}

export function closeTempForm() {
    document.getElementById('temp-overlay').classList.remove('open');
}

export function saveTempEntry() {
    const von        = parseFloat(document.getElementById('t-von').value);
    const bis        = parseFloat(document.getElementById('t-bis').value);
    const sicht      = document.getElementById('t-sicht').value.trim();
    const massnahmen = document.getElementById('t-massnahmen').value.trim();

    if (isNaN(von) || document.getElementById('t-von').value === '') {
        showToast('Bitte Temperatur "von" eingeben.');
        return;
    }
    if (isNaN(bis) || document.getElementById('t-bis').value === '') {
        showToast('Bitte Temperatur "bis" eingeben.');
        return;
    }
    if (!sicht)      { showToast('Bitte Sichtkontrolle eingeben.');           return; }
    if (!massnahmen) { showToast('Bitte durchgeführte Maßnahmen eingeben.');  return; }

    const now = new Date();
    state.tempEntries.push({
        von,
        bis,
        sicht,
        massnahmen,
        savedBy:        localStorage.getItem('lager_user') || 'Unbekannt',
        savedAtMs:      now.getTime(),
        savedAtDisplay: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    });
    closeTempForm();
    renderTempList();
}
