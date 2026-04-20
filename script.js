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

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMode(mode) {
    currentMode = mode;
    showScreen('auth-screen');
    document.getElementById('mode-title').innerText = mode === 'create' ? "دروستکردنی ژوور" : "جۆین بوون";
    document.getElementById('join-inputs').style.display = mode === 'join' ? "block" : "none";
}

function handleAction() {
    if (currentMode === 'create') createRoom();
    else joinRoom();
}

function createRoom() {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("ناوت بنووسە");
    currentRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    isHost = true;
    db.ref("rooms/" + currentRoomCode).set({
        host: myName,
        status: "waiting",
        players: { [myName]: true }
    }).then(() => enterLobby());
}

function joinRoom() {
    myName = document.getElementById('playerName').value.trim();
    currentRoomCode = document.getElementById('roomCodeInput').value.trim();
    if (!myName || !currentRoomCode) return alert("زانیارییەکان تەواو بکە");
    db.ref("rooms/" + currentRoomCode).once("value", snapshot => {
        if (snapshot.exists()) {
            db.ref("rooms/" + currentRoomCode + "/players").update({ [myName]: true });
            isHost = false;
            enterLobby();
        } else {
            alert("ژوورەکە نییە!");
        }
    });
}

function enterLobby() {
    showScreen('waiting-screen');
    document.getElementById('displayRoomCode').innerText = currentRoomCode;
    if (isHost) document.getElementById('hostControls').style.display = "block";
    listenToRoom();
}

function listenToRoom() {
    db.ref("rooms/" + currentRoomCode).on("value", snapshot => {
        const data = snapshot.val();
        if (!data) return window.location.reload();
        if (!data.players[myName]) {
            alert("دەرکرایت!");
            window.location.reload();
        }
        let listHtml = "";
        Object.keys(data.players).forEach(p => {
            listHtml += `<li>${p} ${isHost && p !== myName ? `<button onclick="kick('${p}')" class="kick-btn">X</button>` : ''}</li>`;
        });
        document.getElementById('playersList').innerHTML = listHtml;
        if (data.status === "playing") showGame(data);
        else if (data.status === "waiting") showScreen('waiting-screen');
    });
}

function kick(player) { db.ref("rooms/" + currentRoomCode + "/players/" + player).remove(); }

function startGame() { db.ref("rooms/" + currentRoomCode).update({ status: "playing" }); }

function showGame(data) {
    showScreen('game-screen');
    document.getElementById('hostReplay').style.display = isHost ? "block" : "none";
    document.getElementById('roleDisplay').innerText = "یاری دەستی پێکرد، وشەکە لای خاوەن ژوورە...";
}

function playAgain() { db.ref("rooms/" + currentRoomCode).update({ status: "waiting" }); }

function leaveRoom() {
    db.ref("rooms/" + currentRoomCode + "/players/" + myName).remove().then(() => window.location.reload());
}
