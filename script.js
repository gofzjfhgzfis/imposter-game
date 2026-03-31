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
    "فیلم": ["ئینتەرستێلار", "ئینسیپشن", "سێڤن", "باتمان", "جۆکەر", "تایتانیک", "هاری پۆتەر", "پیاوی جاڵجاڵۆکە", "کیسەڵەکان", "ئایۆن مەن"],
    "تەکنەلۆژیا": ["کۆمپیوتەر", "ئینتەرنێت", "مۆبایل", "فایەربەیس", "ڕۆبۆت", "پڕۆگرامینگ", "فەیسبووک", "یوتیوب", "گوگڵ", "زیرەکی دەستکرد"],
    "ئۆتۆمبێل": ["بزوێنەر", "تایە", "گێڕ", "ویل", "لایت", "پەنزین", "جام", "ستێرن", "ڕادێتەر", "پاتری", "بیئێم", "کڕۆڵە", "دۆج", "ئەڤۆلۆن", "مێرسیدس", "لادە", "لاکشمیبای"],
    "خواردن": ["پیتزا", "بێرگەر", "نانی کوردی", "سێو", "مۆز", "کباب", "یاپراخ", "شۆربا", "مریشک", "دۆ"],
    "وەرزش": ["تۆپی پێ", "ڕاکردن", "مەلەوانی", "تێنس", "باسکە", "مێسی", "ڕۆناڵدۆ", "ڕیاڵ مەدرید", "بەرشەلۆنە", "مۆندیال"],
    "گەیمینگ": ["پۆبجی", "گتای", "ماینکرافت", "پلەیستەیشن", "ئێکس بۆکس", "فۆرتنایت", "ڕۆبلۆکس", "کۆنترۆڵ", "مۆنیتەر", "گەیمەر"],
    "ئاژەڵان": ["شێر", "پڵنگ", "پشیلە", "سەگ", "فیڵ", "نەهەنگ", "مار", "دایناسۆڕ", "مەیمون", "داڵ"],
    "زانکۆ": ["تاقیکردنەوە", "محازەرە", "کتێبخانە", "قوتابی", "پڕۆفیسۆر", "پڕۆژە", "نمرە", "قەڵەم", "دەرچوون", "پشوو"],
    "گەردوون": ["مانگ", "خۆر", "مەریخ", "کونە ڕەشە", "گاڵاکسی", "زەوی", "ئەستێرە", "ناسە", "هەسارە", "کەشتی ئاسمانی"],
    "گشتی": ["ماڵ", "پرد", "کتێب", "سەعات", "مۆبایل", "ئاو", "پارە", "قوتابخانە", "دەریای سور", "ئاسمان", "ئاراشتگا"]
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function updateStatus(s) { if(roomID) db.ref(`rooms/${roomID}/status`).set(s); }

function initHost() {
    isHost = true;
    let name = prompt("ناوەکەت بنووسە:") || "Host";
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
    db.ref(`rooms/${roomID}`).once('value', snap => {
        if(!snap.exists()) return alert("ژوورەکە نییە!");
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
        if(isHost) document.getElementById('btn-start').style.display = Object.keys(p).length >= 1 ? 'block' : 'none';
    });
}

function startGame() {
    const cat = document.getElementById('inp-cat').value;
    const timeVal = parseInt(document.getElementById('inp-time').value) || 3;
    const impCount = parseInt(document.getElementById('inp-imps').value) || 1;
    const pool = dictionary[cat];
    const word = pool[Math.floor(Math.random() * pool.length)];

    db.ref(`rooms/${roomID}/players`).once('value', snap => {
        const keys = Object.keys(snap.val());
        let shuffled = keys.sort(() => 0.5 - Math.random());
        let selectedImps = shuffled.slice(0, Math.min(impCount, keys.length - 1 || 1));
        db.ref(`rooms/${roomID}`).update({
            status: 'active', word: word, category: cat, imposters: selectedImps, time: timeVal * 60
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
        const isImp = d.imposters && d.imposters.includes(myKey);
        document.getElementById('role-box').innerText = isImp ? "تۆ ساختەکاریت! 🤫" : d.word;
        document.getElementById('cat-hint').innerText = "کەتەگۆری: " + d.category;
        startTimer(d.time);
    });
}

function startTimer(sec) {
    let t = sec; clearInterval(timerInterval);
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
            btn.className = 'btn-secondary';
            btn.innerHTML = `👤 ${players[k].name}`;
            btn.onclick = () => {
                document.querySelectorAll('#voting-list button').forEach(b => b.disabled = true);
                btn.style.background = "var(--primary)"; btn.style.color = "#000";
                db.ref(`rooms/${roomID}/players/${k}/votes`).transaction(v => (v || 0) + 1);
            };
            list.appendChild(btn);
        });
    });
    if(isHost) setTimeout(() => updateStatus('results'), 15000);
}

function runResults() {
    showScreen('screen-results');
    db.ref(`rooms/${roomID}`).once('value', snap => {
        const d = snap.val();
        let imps = d.imposters.map(k => d.players[k].name).join(" و ");
        document.getElementById('imposter-reveal').innerText = "ساختەکارەکان: " + imps;
        let sum = "";
        Object.values(d.players).forEach(p => sum += `• ${p.name}: ${p.votes || 0} دەنگ<br>`);
        document.getElementById('vote-summary').innerHTML = sum;
    });
}
