const firebaseConfig = {
    apiKey: "AIzaSyCGX5s8Z8m-DhMXDRVmF0F6Yje_p7A",
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomID, myKey, isHost = false, timerInterval;
const dictionary = {
    "فیلم": ["ئینتەرستێلار", "ئینسیپشن", "سێڤن", "جۆکەر", "باتمان"],
    "تەکنەلۆژیا": ["ڕۆبۆت", "ئایفۆن", "لابتۆپ", "ئینتەرنێت", "فایەربەیس"],
    "گەردوون": ["مانگ", "خۆر", "مەریخ", "گاڵاکسی", "نەیزەک"],
    "هەمەجۆر": ["ماڵ", "قوتابخانە", "کتێب", "سەعات", "پرد"]
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function updateStatus(s) { db.ref(`rooms/${roomID}/status`).set(s); }

function initHost() {
    isHost = true;
    let name = prompt("ناوی تۆ چییە؟") || "Yusuf";
    roomID = Math.floor(1000 + Math.random() * 9000).toString();
    db.ref(`rooms/${roomID}`).set({ status: 'waiting' });
    const ref = db.ref(`rooms/${roomID}/players`).push({ name: name, votes: 0 });
    myKey = ref.key;
    document.getElementById('display-room-id').innerText = roomID;
    document.getElementById('host-only-ui').style.display = 'block';
    showScreen('screen-host');
    listenToPlayers();
    listenToStatus();
}

function joinRoom() {
    let name = document.getElementById('join-name').value;
    roomID = document.getElementById('join-code').value;
    if(!name || !roomID) return alert("زانیارییەکان تەواو بکە");
    db.ref(`rooms/${roomID}/players`).push({ name: name, votes: 0 }).then(ref => {
        myKey = ref.key;
        document.getElementById('display-room-id').innerText = roomID;
        showScreen('screen-host');
        listenToPlayers();
        listenToStatus();
    });
}

function listenToPlayers() {
    db.ref(`rooms/${roomID}/players`).on('value', snap => {
        const p = snap.val() || {};
        document.getElementById('player-list').innerHTML = Object.values(p).map(x => `<span class="player-tag">${x.name}</span>`).join("");
        if(isHost) document.getElementById('btn-start').style.display = Object.keys(p).length >= 3 ? 'block' : 'none';
    });
}

function startGame() {
    const cat = document.getElementById('inp-cat').value;
    if(!cat) return alert("کاتەگۆرییەک هەڵبژێرە");
    const pool = dictionary[cat];
    const word = pool[Math.floor(Math.random() * pool.length)];
    const time = (parseInt(document.getElementById('inp-time').value) || 3) * 60;

    db.ref(`rooms/${roomID}/players`).once('value', snap => {
        const keys = Object.keys(snap.val());
        const imposter = keys[Math.floor(Math.random() * keys.length)];
        db.ref(`rooms/${roomID}`).update({
            status: 'active', word: word, category: cat, imposter: imposter, time: time
        });
    });
}

function listenToStatus() {
    db.ref(`rooms/${roomID}/status`).on('value', snap => {
        const s = snap.val();
        if(s === 'active') runGame();
        if(s === 'voting') runVoting();
        if(s === 'results') runResults();
    });
}

function runGame() {
    showScreen('screen-game');
    if(isHost) document.getElementById('stop-game-btn').style.display = 'block';
    db.ref(`rooms/${roomID}`).once('value', snap => {
        const d = snap.val();
        document.getElementById('role-box').innerText = (d.imposter === myKey) ? "تۆ ساختەکاریت! 🤫" : d.word;
        document.getElementById('cat-hint').innerText = "بابەت: " + d.category;
        startTimer(d.time);
    });
}

function startTimer(sec) {
    let t = sec;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let m = Math.floor(t/60), s = t%60;
        document.getElementById('game-timer').innerText = `${m}:${s<10?'0':''}${s}`;
        if(t-- <= 0) { clearInterval(timerInterval); if(isHost) updateStatus('voting'); }
    }, 1000);
}

function runVoting() {
    clearInterval(timerInterval);
    showScreen('screen-voting');
    const list = document.getElementById('voting-list');
    list.innerHTML = '';
    db.ref(`rooms/${roomID}/players`).once('value', snap => {
        const players = snap.val();
        Object.keys(players).forEach(k => {
            const btn = document.createElement('button');
            btn.style.background = "rgba(255,255,255,0.05)";
            btn.style.color = "white";
            btn.innerHTML = `👤 ${players[k].name}`;
            btn.onclick = () => {
                btn.style.borderColor = "var(--primary)";
                btn.disabled = true;
                db.ref(`rooms/${roomID}/players/${k}/votes`).transaction(v => (v || 0) + 1);
            };
            list.appendChild(btn);
        });
    });
    if(isHost) setTimeout(() => updateStatus('results'), 20000);
}

function runResults() {
    showScreen('screen-results');
    db.ref(`rooms/${roomID}`).once('value', snap => {
        const d = snap.val();
        document.getElementById('imposter-reveal').innerText = "ساختەکار: " + d.players[d.imposter].name;
        let sum = "";
        Object.values(d.players).forEach(p => sum += `• ${p.name}: ${p.votes || 0} دەنگ<br>`);
        document.getElementById('vote-summary').innerHTML = sum;
    });
}
