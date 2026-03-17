/* ═══════════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════════ */

function renderStats() {
    const counts = { leer: 0, voll: 0, gereinigt: 0, reserviert: 0 };
    slots.forEach(s => counts[s.status]++);

    document.getElementById('stats').innerHTML = `
      <div class="stat">
        <div class="stat-val">${slots.length}</div>
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
      </div>
    `;
}

function renderGrid() {
    const cols = COL_OPTIONS[colIdx];
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    [...slots].sort((a, b) => a.slotNumber - b.slotNumber).forEach((sl) => {
        const card = document.createElement('div');
        card.className = `slot ${sl.status}`;
        const lastPartie = sl.parties && sl.parties.length > 0
            ? sl.parties[sl.parties.length - 1].value : '—';
        card.innerHTML = `
          <div class="slot-num">Fach ${sl.slotNumber}</div>
          <div class="slot-name">${escHtml(lastPartie)}</div>
          <div class="badge ${sl.status}">${STATUS_LABELS[sl.status]}</div>
          <div class="slot-info">${escHtml(sl.updated)}</div>
        `;
        card.addEventListener('click', () => openEdit(sl.id));
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-slot';
    addBtn.innerHTML = '<div class="plus">+</div><div>Fach hinzufügen</div>';
    addBtn.addEventListener('click', openAdd);
    grid.appendChild(addBtn);
}

function render() {
    renderStats();
    renderGrid();
}

function cycleLayout() {
    colIdx = (colIdx + 1) % COL_OPTIONS.length;
    saveToStorage();
    renderGrid();
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */

function openAdd() {
    editingId = null;
    document.getElementById('modal-title').innerHTML =
        'Fach <input id="f-num" class="title-num-input" type="number" min="1" placeholder="Nr." />';
    document.getElementById('f-frucht').value = '';
    editingParties = [];
    renderPartieDropdownLabel();
    setDropdownValue('leer');
    tempEntries = [];
    renderTempList();
    document.getElementById('f-date').value = nowTimestamp();
    document.getElementById('del-btn').style.display = 'none';
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
    document.getElementById('f-num').focus();
}

function openEdit(id) {
    const sl = slots.find(s => s.id === id);
    if (!sl) return;
    editingId = id;
    document.getElementById('modal-title').textContent = `Fach ${sl.slotNumber}`;
    document.getElementById('f-frucht').value = sl.fruchtart || '';
    editingParties = sl.parties ? sl.parties.map(p => ({ ...p })) : [];
    renderPartieDropdownLabel();
    setDropdownValue(sl.status);
    tempEntries = sl.temperatures ? [...sl.temperatures] : [];
    renderTempList();
    document.getElementById('f-date').value = sl.updated;
    document.getElementById('del-btn').style.display = 'inline-block';
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('overlay').classList.remove('open');
}

function onOverlayClick(event) {
    if (event.target.id === 'overlay') closeModal();
}

function saveSlot() {
    const numInput = document.getElementById('f-num');
    const slotNumber = editingId !== null
        ? slots.find(s => s.id === editingId)?.slotNumber
        : (parseInt(numInput?.value, 10) || nextId + 4);
    const fruchtart = document.getElementById('f-frucht').value.trim();
    const status = document.getElementById('f-status').value;
    const updated = nowTimestamp();

    if (editingParties.length === 0) {
        showToast('Bitte mindestens eine Partie-Nummer hinzufügen.');
        return;
    }

    if (editingId !== null) {
        const sl = slots.find(s => s.id === editingId);
        if (sl) {
            sl.parties = editingParties;
            sl.fruchtart = fruchtart;
            sl.status = status;
            sl.temperatures = tempEntries;
            sl.updated = updated;
        }
    } else {
        slots.push({ id: nextId++, slotNumber, fruchtart, parties: editingParties, status, temperatures: tempEntries, updated });
    }

    saveToStorage();
    closeModal();
    render();
    showToast(editingId !== null ? '✓ Fach gespeichert' : '✓ Fach hinzugefügt');
}

function deleteSlot() {
    if (editingId === null) return;
    const sl = slots.find(s => s.id === editingId);
    const lastName = sl && sl.parties && sl.parties.length > 0
        ? sl.parties[sl.parties.length - 1].value : 'Fach';
    if (!confirm(`"${lastName}" wirklich löschen?`)) return;
    slots = slots.filter(s => s.id !== editingId);
    saveToStorage();
    closeModal();
    render();
    showToast('🗑 Fach gelöscht');
}

/* ═══════════════════════════════════════════════
   STATUS-DROPDOWN
═══════════════════════════════════════════════ */

function toggleDropdown(e) {
    e.stopPropagation();
    document.getElementById('status-dropdown').classList.toggle('open');
}

function selectStatus(li) {
    const value = li.dataset.value;
    document.getElementById('f-status').value = value;
    document.getElementById('cs-label').textContent = li.querySelector('.badge').textContent;
    document.querySelectorAll('.cs-item').forEach(i => i.classList.remove('selected'));
    li.classList.add('selected');
    document.getElementById('status-dropdown').classList.remove('open');
}

function setDropdownValue(value) {
    const li = document.querySelector(`.cs-item[data-value="${value}"]`);
    if (li) selectStatus(li);
}

/* ═══════════════════════════════════════════════
   PARTIE-DROPDOWN
═══════════════════════════════════════════════ */

function renderPartieDropdownLabel() {
    const last = editingParties.length > 0
        ? editingParties[editingParties.length - 1].value
        : 'Keine vorhanden';
    document.getElementById('pn-label').textContent = last;
}

function togglePartieDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('partie-dropdown');
    const opening = !dd.classList.contains('open');
    dd.classList.toggle('open');
    if (opening) populatePartieList();
    document.getElementById('pn-new-row').style.display = 'none';
}

function populatePartieList() {
    const list = document.getElementById('pn-list');
    if (editingParties.length === 0) {
        list.innerHTML = '<li class="pn-empty">Noch keine Partie-Nummern</li>';
        return;
    }
    const reversed = [...editingParties].reverse();
    list.innerHTML = reversed.map(p =>
        `<li class="pn-item">${escHtml(p.value)}<span class="pn-item-date">${escHtml(p.addedAt)}</span></li>`
    ).join('');
}

function openNewPartieInput() {
    document.getElementById('partie-dropdown').classList.remove('open');
    const row = document.getElementById('pn-new-row');
    row.style.display = 'flex';
    document.getElementById('pn-new-input').value = '';
    document.getElementById('pn-new-input').focus();
}

function confirmNewPartie() {
    const val = document.getElementById('pn-new-input').value.trim();
    if (!val) { showToast('Bitte Partie-Nummer eingeben.'); return; }
    const now = new Date();
    editingParties.push({
        value: val,
        addedAt: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        addedAtMs: now.getTime(),
    });
    document.getElementById('pn-new-row').style.display = 'none';
    document.getElementById('pn-new-input').value = '';
    renderPartieDropdownLabel();
    showToast('✓ Partie-Nummer hinzugefügt');
}

/* ═══════════════════════════════════════════════
   EVENT HANDLER & INIT
═══════════════════════════════════════════════ */

document.addEventListener('keydown', (e) => {
    if (!document.getElementById('overlay').classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA'
        && e.target.id !== 'pn-new-input' && e.target.id !== 'f-num') {
        e.preventDefault();
        saveSlot();
    }
});

document.addEventListener('click', () => {
    document.getElementById('status-dropdown')?.classList.remove('open');
    document.getElementById('partie-dropdown')?.classList.remove('open');
});

(function init() {
    loadFromStorage();
    render();
    document.getElementById('sub').textContent =
        `${slots.length} Fächer geladen · Klicke auf ein Fach zum Bearbeiten`;
})();
