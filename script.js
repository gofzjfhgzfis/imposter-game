// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyCGX5s8Z8m-DhMXDRVmF0F6Yje_p7A",
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomID, myName, isHost = false, myKey, timer;
const dictionary = {
    "فیلم": ["ئینتەرستێلار", "ئینسیپشن", "سێڤن", "جۆکەر", "باتمان"],
    "تەکنەلۆژیا": ["ڕۆبۆت", "ئایفۆن", "لابتۆپ", "ئینتەرنێت", "فایەربەیس"],
    "گەردوون": ["مانگ", "خۆر", "مەریخ", "گاڵاکسی", "نەیزەک"],
    "هەمەجۆر": ["ماڵ", "قوتابخانە", "کتێب", "سەعات", "پرد"]
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        document.getElementById(id).classList.add('active');
    }, 50);
}

function updateStatus(s) { db.ref(`rooms/${roomID}/status`).set(s); }

function initHost() {
    isHost = true;
    myName = prompt("ناوت بنووسە:") || "Host";
    roomID = Math.floor(1000 + Math.random() * 9000).toString();
    db.ref(`rooms/${roomID}`).set({ status: 'waiting' });
    const ref = db.ref(`rooms/${roomID}/players`).push({ name: myName, votes: 0 });
    myKey = ref.key;
    document.getElementById('display-room-id').innerText = roomID;
    showScreen('screen-host');
    listenToPlayers();
    listenToStatus();
}

function joinRoom() {
    myName = document.getElementById('join-name').value.trim();
    roomID = document.getElementById('join-code').value.trim();
    if(!myName || !roomID) return alert("زانیارییەکان تەواو بکە");
    db.ref(`rooms/${roomID}`).once('value', snap => {
        if(!snap.exists()) return alert("ژوورەکە نییە");
        const ref = db.ref(`rooms/${roomID}/players`).push({ name: myName, votes: 0 });
        myKey = ref.key;
        showScreen('screen-host');
        document.getElementById('screen-host').innerHTML = `<h3>بەخێرهاتی ${myName}</h3><p>چاوەڕێی دەستپێکردن بە...</p>`;
        listenToStatus();
    });
}

function listenToPlayers() {
    db.ref(`rooms/${roomID}/players`).on('value', snap => {
        const p = snap.val() || {};
        document.getElementById('player-list').innerHTML = "یاریزانەکان: " + Object.values(p).map(i => i.name).join(", ");
        if(isHost) document.getElementById('btn-start').style.display = Object.keys(p).length >= 3 ? 'block' : 'none';
    });
}

function startGame() {
    const cat = document.getElementById('inp-cat').value;
    const pool = dictionary[cat];
    const word = pool[Math.floor(Math.random() * pool.length)];
    const time = parseInt(document.getElementById('inp-time').value) * 60;
    db.ref(`rooms/${roomID}/players`).once('value', snap => {
        const keys = Object.keys(snap.val());
        const imposter = keys[Math.floor(Math.random() * keys.length)];
        db.ref(`rooms/${roomID}`).update({
            status: 'active', word: word, category: cat, imposters: [imposter], duration: time
        });
    });
}

function listenToStatus() {
    db.ref(`rooms/${roomID}/status`).on('value', snap => {
        const s = snap.val();
        if(s === 'active') runGame();
        if(s === 'voting') runVoting();
        if(s === 'results') runResults();
        if(s === 'waiting' && !isHost && document.getElementById('screen-results').classList.contains('active')) location.reload();
    });
}

function runGame() {
    showScreen('screen-game');
    if(isHost) document.getElementById('host-stop-btn').style.display = 'block';
    db.ref(`rooms/${roomID}`).once('value', snap => {
        const d = snap.val();
        const isImp = d.imposters.includes(myKey);
        document.getElementById('role-box').innerText = isImp ? "تۆ ساختەکاریت! 🤫" : d.word;
        document.getElementById('cat-hint').innerText = "کەتەگۆری: " + d.category;
        startTimer(d.duration);
    });
}

function startTimer(sec) {
    let t = sec;
    clearInterval(timer);
    timer = setInterval(() => {
        let m = Math.floor(t/60), s = t%60;
        document.getElementById('game-timer').innerText = `${m}:${s<10?'0':''}${s}`;
        if(t-- <= 0) { clearInterval(timer); if(isHost) updateStatus('voting'); }
    }, 1000);
}

// سیستەمی نوێی دەنگدان
function runVoting() {
    clearInterval(timer);
    showScreen('screen-voting');
    const listDiv = document.getElementById('voting-list');
    listDiv.innerHTML = '';

    db.ref(`rooms/${roomID}/players`).once('value', snap => {
        const players = snap.val();
        Object.keys(players).forEach(key => {
            const div = document.createElement('div');
            div.className = 'player-card';
            div.innerHTML = `<div class="avatar">👤</div><b>${players[key].name}</b>`;
            div.onclick = () => castVote(key, div);
            listDiv.appendChild(div);
        });
    });

    // هۆست دوای ٣٠ چرکە ئەنجامەکان نیشان دەدات
    if(isHost) {
        setTimeout(() => updateStatus('results'), 30000);
    }
}

function castVote(targetKey, element) {
    if(document.querySelector('.player-card.voted')) return; // ڕێگری لە دەنگدانی دووبارە
    element.classList.add('voted');
    db.ref(`rooms/${roomID}/players/${targetKey}/votes`).transaction(v => (v || 0) + 1);
}

function runResults() {
    showScreen('screen-results');
    if(isHost) document.getElementById('host-replay-btn').style.display = 'block';
    db.ref(`rooms/${roomID}`).once('value', snap => {
        const d = snap.val();
        const impName = d.players[d.imposters[0]].name;
        document.getElementById('imposter-reveal').innerText = "ساختەکار: " + impName;
        
        // نیشاندانی دەنگەکان
        let summary = "ئەنجامی دەنگەکان:<br>";
        Object.values(d.players).forEach(p => {
            summary += `${p.name}: ${p.votes || 0} دەنگ<br>`;
        });
        document.getElementById('vote-summary').innerHTML = summary;
    });
}

function replayGame() {
    db.ref(`rooms/${roomID}`).update({ status: 'waiting', imposters: null, word: null }).then(() => location.reload());
}
