/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */

if (localStorage.getItem('lager_auth') !== 'true') {
    window.location.href = 'index.html';
}

export function logout() {
    localStorage.removeItem('lager_auth');
    localStorage.removeItem('lager_user');
    window.location.href = 'index.html';
}

/* ═══════════════════════════════════════════════
   HILFSFUNKTIONEN
═══════════════════════════════════════════════ */

export function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function nowTimestamp() {
    const d = new Date();
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function showToast(msg, duration = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}
