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

function updateStatus(s) { 
    if(roomID) db.ref(`rooms/${roomID}/status`).set(s).catch(e => console.error(e)); 
}

function initHost() {
    isHost = true;
    let name = prompt("ناوی تۆ چییە؟") || "Host";
    roomID = Math.floor(1000 + Math.random() * 9000).toString();
    
    db.ref(`rooms/${roomID}`).set({ status: 'waiting' }).catch(e => alert("هەڵە لە سێرڤەر: " + e.message));
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
    if(!name || !roomID) return alert("تکایە ناو و کۆدی ژوور بنووسە");
    
    db.ref(`rooms/${roomID}`).once('value').then(snap => {
        if(!snap.exists()) return alert("ئەم کۆدەی ژوورە بوونی نییە!");
        
        db.ref(`rooms/${roomID}/players`).push({ name: name, votes: 0 }).then(ref => {
            myKey = ref.key;
            document.getElementById('display-room-id').innerText = roomID;
            showScreen('screen-host');
            listenToPlayers();
            listenToStatus();
        });
    });
}

function listenToPlayers() {
    db.ref(`rooms/${roomID}/players`).on('value', snap => {
        const p = snap.val() || {};
        document.getElementById('player-list').innerHTML = Object.values(p).map(x => `<span class="player-tag">${x.name}</span>`).join("");
        
        // ڕێگە دەدات بە ١ یاریزانیش تاقیبکرێتەوە بۆ ئاسانی (لە کاتی بڵاوکردنەوە بیکە بە ٣)
        if(isHost) document.getElementById('btn-start').style.display = Object.keys(p).length >= 1 ? 'block' : 'none';
    });
}

function startGame() {
    const cat = document.getElementById('inp-cat').value;
    const timeInput = document.getElementById('inp-time').value;
    
    // لێرەدا کێشەی نەخوێندنەوەی کاتەکە چارەسەر کراوە
    let timeInSeconds = (parseInt(timeInput) || 3) * 60; 

    const pool = dictionary[cat];
    const word = pool[Math.floor(Math.random() * pool.length)];

    db.ref(`rooms/${roomID}/players`).once('value').then(snap => {
        if (!snap.exists()) return;
        const keys = Object.keys(snap.val());
        const imposter = keys[Math.floor(Math.random() * keys.length)];
        
        db.ref(`rooms/${roomID}`).update({
            status: 'active', word: word, category: cat, imposter: imposter, time: timeInSeconds
        }).catch(e => alert("هەڵە هەیە: " + e.message));
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
    
    db.ref(`rooms/${roomID}`).once('value').then(snap => {
        const d = snap.val();
        document.getElementById('role-box').innerText = (d.imposter === myKey) ? "تۆ ساختەکاریت! 🤫" : d.word;
        document.getElementById('cat-hint').innerText = "بابەت: " + d.category;
        startTimer(d.time); // ناردنی کاتەکە بۆ تایمەر
    });
}

function startTimer(totalSeconds) {
    let t = totalSeconds;
    clearInterval(timerInterval);
    
    // خێرا پیشاندانی کاتەکە پێش ئەوەی چرکەیەک تێپەڕێت
    updateTimerUI(t);

    timerInterval = setInterval(() => {
        t--;
        updateTimerUI(t);

        if(t <= 0) { 
            clearInterval(timerInterval); 
            if(isHost) updateStatus('voting'); 
        }
    }, 1000);
}

function updateTimerUI(seconds) {
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    document.getElementById('game-timer').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

function runVoting() {
    clearInterval(timerInterval);
    showScreen('screen-voting');
    const list = document.getElementById('voting-list');
    list.innerHTML = '';
    
    db.ref(`rooms/${roomID}/players`).once('value').then(snap => {
        const players = snap.val();
        Object.keys(players).forEach(k => {
            const btn = document.createElement('button');
            btn.className = 'vote-btn';
            btn.style.background = "rgba(255,255,255,0.1)";
            btn.style.color = "white";
            btn.innerHTML = `👤 ${players[k].name}`;
            
            btn.onclick = () => {
                // وەستاندنی هەموو دوگمەکانی تر کاتێک دەنگ دەدەیت (کێشەی کلیکی دووبارە چارەسەر کرا)
                document.querySelectorAll('.vote-btn').forEach(b => b.disabled = true);
                btn.style.borderColor = "var(--primary)";
                btn.style.background = "rgba(0, 242, 254, 0.2)";
                
                db.ref(`rooms/${roomID}/players/${k}/votes`).transaction(v => (v || 0) + 1);
            };
            list.appendChild(btn);
        });
    });
    
    // هۆست دوای ٢٠ چرکە ئەنجامەکان پیشان دەدات
    if(isHost) setTimeout(() => updateStatus('results'), 20000);
}

function runResults() {
    showScreen('screen-results');
    db.ref(`rooms/${roomID}`).once('value').then(snap => {
        const d = snap.val();
        document.getElementById('imposter-reveal').innerText = "ساختەکار: " + d.players[d.imposter].name;
        
        let sum = "";
        Object.values(d.players).forEach(p => sum += `• ${p.name}: <b>${p.votes || 0} دەنگ</b><br>`);
        document.getElementById('vote-summary').innerHTML = sum;
    });
}
