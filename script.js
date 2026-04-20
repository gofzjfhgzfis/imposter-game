// کۆنفیگی فایەربەیسەکەت لێرە دابنێ
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName = "";
let currentRoomCode = "";
let isHost = false;
let currentMode = "";

const dictionary = {
    "خواردن": ["پیتزا", "کباب", "یاپراخ", "بێرگەر", "شۆربا", "مریشک", "دۆلمە", "برنج"],
    "ئاژەڵ": ["شێر", "پشیلە", "سەگ", "فیل", "مار", "پڵنگ", "کیسەڵ", "کەروێشک"],
    "تەکنەلۆژیا": ["مۆبایل", "کۆمپیوتەر", "ئینتەرنێت", "ڕۆبۆت", "فەیسبووک", "ئایفۆن"],
    "وەرزش": ["تۆپی پێ", "مەلەوانی", "ڕاکردن", "تێنس", "باسکە", "کۆنگ فو"],
    "فیلم": ["باتمان", "جۆکەر", "تایتانیک", "سپایدەرمان", "هاری پۆتەر"]
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMode(mode) {
    currentMode = mode;
    showScreen('auth-screen');
    document.getElementById('mode-title').innerText = mode === 'create' ? "دروستکردنی ژوور" : "جۆین بوون بە ژوور";
    document.getElementById('roomCodeInput').style.display = mode === 'join' ? "block" : "none";
}

function handleAction() {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("تکایە ناوت بنووسە");

    if (currentMode === 'create') {
        currentRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
        isHost = true;
        db.ref("rooms/" + currentRoomCode).set({
            host: myName,
            status: "waiting",
            players: { [myName]: true }
        }).then(() => enterLobby());
    } else {
        currentRoomCode = document.getElementById('roomCodeInput').value.trim();
        if (!currentRoomCode) return alert("کۆدی ژوورەکە بنووسە");
        db.ref("rooms/" + currentRoomCode).once("value", snap => {
            if (snap.exists() && snap.val().status === "waiting") {
                db.ref("rooms/" + currentRoomCode + "/players/" + myName).set(true);
                isHost = false;
                enterLobby();
            } else alert("ژوورەکە بوونی نییە یان یاری دەستی پێکردووە");
        });
    }
}

function enterLobby() {
    showScreen('waiting-screen');
    document.getElementById('displayRoomCode').innerText = currentRoomCode;
    if (isHost) document.getElementById('hostControls').style.display = "block";
    listenToRoom();
}

function listenToRoom() {
    db.ref("rooms/" + currentRoomCode).on("value", snap => {
        const data = snap.val();
        if (!data) return window.location.reload();

        if (!data.players || !data.players[myName]) {
            alert("دەرکرایت لە ژوورەکە!");
            window.location.reload();
        }

        const players = Object.keys(data.players);
        document.getElementById('count').innerText = players.length;
        
        let html = "";
        players.forEach(p => {
            html += `<li><span>${p} ${p === data.host ? '👑' : ''}</span> 
            ${isHost && p !== myName ? `<button class="kick-btn" onclick="kick('${p}')">دەرکردن</button>` : ''}</li>`;
        });
        document.getElementById('playersList').innerHTML = html;

        if (data.status === "playing") {
            showGame(data);
        } else {
            showScreen('waiting-screen');
            document.getElementById('hostReplay').style.display = "none";
        }
    });
}

function startGame() {
    db.ref("rooms/" + currentRoomCode + "/players").once("value", snap => {
        const players = Object.keys(snap.val());
        if (players.length < 3) return alert("بۆ دەستپێکردن لانی کەم ٣ یاریزان پێویستە");

        const cats = Object.keys(dictionary);
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const words = dictionary[cat];
        const word = words[Math.floor(Math.random() * words.length)];
        const imposter = players[Math.floor(Math.random() * players.length)];

        db.ref("rooms/" + currentRoomCode).update({
            status: "playing",
            category: cat,
            word: word,
            imposter: imposter
        });
    });
}

function showGame(data) {
    showScreen('game-screen');
    document.getElementById('categoryLabel').innerText = "کەتەگۆری: " + data.category;
    
    if (myName === data.imposter) {
        document.getElementById('roleDisplay').innerHTML = "<span style='color:#ef4444'>تۆ ئیمپۆستەری!</span><br><small>هەوڵ بدە بزانیت وشەکە چییە</small>";
    } else {
        document.getElementById('roleDisplay').innerHTML = "وشەکە: <span style='color:#10b981'>" + data.word + "</span>";
    }

    if (isHost) document.getElementById('hostReplay').style.display = "block";
}

function playAgain() {
    db.ref("rooms/" + currentRoomCode).update({ status: "waiting" });
}

function kick(p) { db.ref("rooms/" + currentRoomCode + "/players/" + p).remove(); }

function leaveRoom() {
    db.ref("rooms/" + currentRoomCode + "/players/" + myName).remove().then(() => window.location.reload());
}
