

const USERS = [
    { username: 'arne', password: 'LagerSoftware' },
];

const AUTH_KEY = 'lager_auth';

(function checkSession() {
    if (localStorage.getItem(AUTH_KEY) === 'true') {
        goToApp();
    }
})();

function doLogin() {
    const user = document.getElementById('inp-user').value.trim().toLowerCase();
    const pass = document.getElementById('inp-pass').value;
    const match = USERS.find(u => u.username === user && u.password === pass);
    if (match) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem('lager_user', match.username);
        goToApp();
    } else {
        showError();
    }
}

function showError() {
    const card = document.getElementById('card');
    const err = document.getElementById('err-msg');
    const pass = document.getElementById('inp-pass');
    const user = document.getElementById('inp-user');
    err.classList.add('show');
    pass.classList.add('error');
    user.classList.add('error');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    pass.value = '';
    pass.focus();
}

function goToApp() {
    window.location.href = 'lagerverwaltung.html';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
});

['inp-user', 'inp-pass'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        document.getElementById('err-msg').classList.remove('show');
        document.getElementById('inp-user').classList.remove('error');
        document.getElementById('inp-pass').classList.remove('error');
    });
});