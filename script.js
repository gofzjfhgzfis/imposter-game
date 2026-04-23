/**
 * IMPOSTER ULTRA - STABLE VERSION
 * Optimized by Yusuf's Assistant
 */

// 1. Configuration
const firebaseConfig = {
    apiKey: "AIzaSy...", // كلیلەكەی خۆت
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "1:..."
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. App State
let user = { name: "", room: "", isHost: false, mode: "" };

const words = {
    "خواردن": ["دۆ","کینتاکی","ڕیزۆ","برنج","دۆڵمە","ساوەر","بەرگر","تکە","گەس","مەحشی","بریانی","پیتزا","شاورمە","مەقلووبە","دۆغوا","کفتە","پیتزا", "کەباب", "شۆربا"],
    "تەکنەلۆژیا": ["کاتژمێری زیرەک","مۆبایل","ئایپاد","ئێکس بۆکس","پلەیستەشین","تەلەفیزیۆن","کیبۆڕد","کامێرا","ئایفۆن", "لابتۆپ", "ئینتەرنێت"],
    "ئاژەڵ": ["بەراز","ڕێوی","زەڕافە","ئەسپ","ئاسک","چێڵ","بزن","فیل","سمۆرە","ڕێوی","حوشتر","ورچ","مشک","سەگ","پشیلە","گوێدرێژ","شێر", "پشیلە", "فیل"]
};

// 3. Robust Navigation Function
function go(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`sc-${screenId}`);
    if (target) target.classList.add('active');
}

// 4. Centralized Button Controller (چارەسەری ئیش نەکردنی دوگمەکان)
document.addEventListener('click', (e) => {
    const id = e.target.id;

    if (id === 'btn-create') { user.mode = 'create'; document.getElementById('in-code').style.display = 'none'; go('auth'); }
    if (id === 'btn-join') { user.mode = 'join'; document.getElementById('in-code').style.display = 'block'; go('auth'); }
    if (id === 'btn-back') { go('home'); }
    if (id === 'btn-go') { handleAuth(); }
    if (id === 'btn-start') { launchGame(); }
    if (id === 'btn-leave' || id === 'btn-quit') { leaveRoom(); }
    if (id === 'btn-reset') { db.ref(`rooms/${user.room}`).update({ status: 'waiting' }); }
    if (e.target.classList.contains('kick-btn')) { kickPlayer(e.target.dataset.name); }
    if (e.target.closest('#role-card')) { document.querySelector('.card-inner').classList.toggle('flipped'); }
});

// 5. Core Logic
async function handleAuth() {
    user.name = document.getElementById('in-name').value.trim();
    if (!user.name) return alert("ناوت بنووسە!");

    if (user.mode === 'create') {
        user.room = Math.floor(1000 + Math.random() * 9000).toString();
        user.isHost = true;
        await db.ref(`rooms/${user.room}`).set({
            host: user.name, status: "waiting", players: { [user.name]: true }
        });
        startLobby();
    } else {
        user.room = document.getElementById('in-code').value.trim();
        const snap = await db.ref(`rooms/${user.room}`).once('value');
        if (snap.exists()) {
            await db.ref(`rooms/${user.room}/players/${user.name}`).set(true);
            startLobby();
        } else alert("ژوورەکە نییە!");
    }
}

function startLobby() {
    go('lobby');
    document.getElementById('room-id').innerText = user.room;
    document.getElementById('host-ui').style.display = user.isHost ? 'block' : 'none';

    // Presence & Sync
    const roomRef = db.ref(`rooms/${user.room}`);
    db.ref(`rooms/${user.room}/players/${user.name}`).onDisconnect().remove();

    roomRef.on('value', snap => {
        const data = snap.val();
        if (!data) return;

        // Check if I'm kicked
        if (!data.players || !data.players[user.name]) {
            roomRef.off();
            alert("تۆ لە ژوورەکە دەرکرایت!");
            location.reload();
            return;
        }

        // Render List
        const pList = Object.keys(data.players);
        document.getElementById('p-count').innerText = pList.length;
        document.getElementById('p-list').innerHTML = pList.map(p => `
            <div class="player-item">
                <span>${p} ${p === data.host ? '👑' : ''}</span>
                ${user.isHost && p !== user.name ? `<button class="kick-btn" data-name="${p}">دەرکردن</button>` : ''}
            </div>
        `).join('');

        if (data.status === 'playing') renderGame(data.gameData);
        if (data.status === 'waiting') { go('lobby'); document.querySelector('.card-inner').classList.remove('flipped'); }
    });
}

function launchGame() {
    const cats = Object.keys(words);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const word = words[cat][Math.floor(Math.random() * words[cat].length)];
    
    db.ref(`rooms/${user.room}/players`).once('value', snap => {
        const players = Object.keys(snap.val());
        if (players.length < 3) return alert("لانی کەم ٣ یاریزان پێویستە!");
        const imposter = players[Math.floor(Math.random() * players.length)];
        
        db.ref(`rooms/${user.room}`).update({
            status: "playing",
            gameData: { cat, word, imposter }
        });
    });
}

function renderGame(data) {
    go('game');
    document.getElementById('game-info').innerText = "کەتەگۆری: " + data.cat;
    const isImp = user.name === data.imposter;
    document.getElementById('word-txt').innerText = isImp ? "تۆ ساختەکاری!" : data.word;
    document.getElementById('hint-txt').innerText = isImp ? "هەوڵ بدە ئاشکرا نەبیت" : "باسی وشەکە بکە";
    if (user.isHost) document.getElementById('host-replay').style.display = 'block';
}

function kickPlayer(name) {
    db.ref(`rooms/${user.room}/players/${name}`).remove();
}

function leaveRoom() {
    if (user.room) {
        db.ref(`rooms/${user.room}/players/${user.name}`).remove().then(() => location.reload());
    } else location.reload();
}
