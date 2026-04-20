const firebaseConfig = {
    apiKey: "AIzaSy...", // لێرە کلیلی خۆت دابنێ
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "1:..." // لێرە ئایدی خۆت دابنێ
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName = "", currentRoomCode = "", isHost = false, currentMode = "";

const dictionary = {
    "خواردن": ["پیتزا", "کباب", "یاپراخ", "بێرگەر"],
    "ئاژەڵ": ["شێر", "پشیلە", "سەگ", "فیل"],
    "تەکنەلۆژیا": ["مۆبایل", "کۆمپیوتەر", "ئینتەرنێت"]
};

// فەنکشنی گۆڕینی شاشەکان
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// نیشاندانی شاشەی دروستکردن یان جۆین
window.showMode = function(mode) {
    currentMode = mode;
    showScreen('auth-screen');
    document.getElementById('mode-title').innerText = mode === 'create' ? "دروستکردنی ژوور" : "جۆین بوون";
    document.getElementById('roomCodeInput').style.display = mode === 'join' ? "block" : "none";
};

window.handleAction = function() {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("ناوت بنووسە");

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
        db.ref("rooms/" + currentRoomCode).once("value", snap => {
            if (snap.exists()) {
                db.ref("rooms/" + currentRoomCode + "/players/" + myName).set(true);
                isHost = false;
                enterLobby();
            } else alert("ژوورەکە نییە");
        });
    }
};

function enterLobby() {
    showScreen('waiting-screen');
    document.getElementById('displayRoomCode').innerText = currentRoomCode;
    document.getElementById('hostControls').style.display = isHost ? "block" : "none";
    
    db.ref("rooms/" + currentRoomCode).on("value", snap => {
        const data = snap.val();
        if (!data) return;

        let html = "";
        Object.keys(data.players).forEach(p => {
            html += `<li>${p} ${isHost && p !== myName ? `<button onclick="kick('${p}')" style="color:red">X</button>` : ''}</li>`;
        });
        document.getElementById('playersList').innerHTML = html;

        if (data.status === "playing") showGame(data);
        if (data.status === "waiting") showScreen('waiting-screen');
    });
}

window.startGame = function() {
    const cats = Object.keys(dictionary);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const word = dictionary[cat][Math.floor(Math.random() * dictionary[cat].length)];
    
    db.ref("rooms/" + currentRoomCode + "/players").once("value", snap => {
        const players = Object.keys(snap.val());
        const imposter = players[Math.floor(Math.random() * players.length)];
        db.ref("rooms/" + currentRoomCode).update({
            status: "playing",
            category: cat,
            word: word,
            imposter: imposter
        });
    });
};

function showGame(data) {
    showScreen('game-screen');
    document.getElementById('categoryLabel').innerText = "کەتەگۆری: " + data.category;
    document.getElementById('roleDisplay').innerText = myName === data.imposter ? "تۆ ئیمپۆستەری!" : "وشەکە: " + data.word;
    document.getElementById('hostReplay').style.display = isHost ? "block" : "none";
}

window.playAgain = function() { db.ref("rooms/" + currentRoomCode).update({ status: "waiting" }); };
window.kick = function(p) { db.ref("rooms/" + currentRoomCode + "/players/" + p).remove(); };
window.leaveRoom = function() { window.location.reload(); };
