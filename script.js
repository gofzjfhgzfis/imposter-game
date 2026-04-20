const firebaseConfig = {
    apiKey: "لێرە کلیلەکە دابنێ",
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "لێرە ئایدیەکە دابنێ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName = "";
let currentRoomCode = "";
let isHost = false;

// فەنکشنی دروستکردنی ژوور
function createRoom() {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("ناوت بنووسە");
    
    currentRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    isHost = true;
    
    db.ref("rooms/" + currentRoomCode).set({
        host: myName,
        status: "waiting",
        players: { [myName]: true }
    }).then(() => {
        enterLobby();
    }).catch(err => alert("کێشەیەک هەیە: " + err.message));
}

// فەنکشنی جۆین بوون
function joinRoom() {
    myName = document.getElementById('playerName').value.trim();
    currentRoomCode = document.getElementById('roomCodeInput').value.trim();
    
    if (!myName || !currentRoomCode) return alert("زانیارییەکان پڕ بکەرەوە");
    
    db.ref("rooms/" + currentRoomCode).once("value", snapshot => {
        if (snapshot.exists()) {
            db.ref("rooms/" + currentRoomCode + "/players").update({ [myName]: true });
            enterLobby();
        } else {
            alert("ئەم ژوورە نییە!");
        }
    });
}

function enterLobby() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('waiting-screen').classList.add('active');
    document.getElementById('displayRoomCode').innerText = currentRoomCode;
    
    if (isHost) document.getElementById('hostControls').style.display = "block";
    
    listenToRoom();
}

function listenToRoom() {
    db.ref("rooms/" + currentRoomCode).on("value", snapshot => {
        const data = snapshot.val();
        if (!data) return window.location.reload();

        // سیستەمی دەرکردن (Kick)
        if (!data.players[myName]) {
            alert("دەرکرایت لە ژوورەکە!");
            window.location.reload();
        }

        // نوێکردنەوەی لیستی یاریزانەکان
        let listHtml = "";
        Object.keys(data.players).forEach(p => {
            listHtml += `<li>${p} ${isHost && p !== myName ? `<button onclick="kick('${p}')" class="kick-btn">X</button>` : ''}</li>`;
        });
        document.getElementById('playersList').innerHTML = listHtml;

        // کاتێک یاری دەستپێدەکات یان دووبارە دەکرێتەوە
        if (data.status === "playing") {
            showGame(data);
        } else if (data.status === "waiting") {
            document.getElementById('game-screen').classList.remove('active');
            document.getElementById('waiting-screen').classList.add('active');
        }
    });
}

function kick(player) {
    db.ref("rooms/" + currentRoomCode + "/players/" + player).remove();
}

function playAgain() {
    db.ref("rooms/" + currentRoomCode).update({ status: "waiting" });
}

// لێرەدا دەتوانیت لۆجیکی یارییەکە و وشەکان زیاد بکەیت
function startGame() {
    db.ref("rooms/" + currentRoomCode).update({ status: "playing" });
}

function showGame(data) {
    document.getElementById('waiting-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    if (isHost) document.getElementById('hostReplay').style.display = "block";
    document.getElementById('roleDisplay').innerText = "یاری دەستی پێکرد...";
}
