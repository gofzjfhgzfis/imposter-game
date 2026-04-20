/**
 * IMPOSTER PRO - GAME ENGINE
 * Developed by Yusuf - CS Student
 */

// 1. Config & Initialization
const firebaseConfig = {
    apiKey: "AIzaSy...", 
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "1:..."
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State Management
let state = {
    user: { name: "", role: "viewer", isHost: false },
    room: { id: "", status: "waiting", players: {} },
    game: { timer: 60, active: false }
};

// 2. Dictionary (Large Dataset)
const dictionary = {
    "خواردن": ["پیتزا", "هەمبەرگر", "یاپراخ", "کەباب", "مریشک", "ماسی", "دۆلمە"],
    "وڵات": ["کوردستان", "ئەڵمانیا", "فەڕەنسا", "ژاپۆن", "ئیتاڵیا", "بەڕازیل"],
    "وەرزش": ["تۆپی پێ", "تێنس", "مەلەوانی", "باسکە", "کاراتی", "گۆڵف"],
    "فیلم": ["باتمان", "سپایدەرمان", "تایتانیک", "جۆکەر", "ئینتەرستێلار"]
};

// 3. Navigation System
function navigate(screenId, mode = null) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    
    if (mode === 'create') {
        document.getElementById('setup-title').innerText = "دروستکردنی ژوور";
        document.getElementById('code-input-wrapper').style.display = 'none';
        state.user.isHost = true;
    } else if (mode === 'join') {
        document.getElementById('setup-title').innerText = "جۆین بوون";
        document.getElementById('code-input-wrapper').style.display = 'block';
        state.user.isHost = false;
    }
}

// 4. Session Initiation & Fix for Joining Issues
async function initSession() {
    const nameInput = document.getElementById('p-name').value.trim();
    if (!nameInput) return alert("ناوەکەت بنووسە!");
    state.user.name = nameInput;

    if (state.user.isHost) {
        state.room.id = Math.floor(1000 + Math.random() * 9000).toString();
        await createRoomOnDB();
    } else {
        const codeInput = document.getElementById('r-code').value.trim();
        if (!codeInput) return alert("کۆدی ژوورەکە بنووسە!");
        state.room.id = codeInput;
        await joinRoomOnDB();
    }
}

async function createRoomOnDB() {
    const roomRef = db.ref(`rooms/${state.room.id}`);
    await roomRef.set({
        host: state.user.name,
        status: "waiting",
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    addPlayerWithPresence();
}

async function joinRoomOnDB() {
    const roomRef = db.ref(`rooms/${state.room.id}`);
    const snapshot = await roomRef.once('value');
    
    if (!snapshot.exists()) return alert("ژوورەکە بوونی نییە!");
    if (snapshot.val().status !== "waiting") return alert("یاری دەستی پێکردووە!");
    
    addPlayerWithPresence();
}

// Presence Logic: This solves the "Join/Leave" problem
function addPlayerWithPresence() {
    const playerRef = db.ref(`rooms/${state.room.id}/players/${state.user.name}`);
    
    // کاتێک یاریزانەکە پەیوەندی بڕا، خۆکارانە لە داتابەیس دەسڕێتەوە
    playerRef.onDisconnect().remove();
    
    playerRef.set(true).then(() => {
        navigate('lobby');
        document.getElementById('room-id-display').innerText = state.room.id;
        syncRoomData();
    });
}

// 5. Real-time Synchronization
function syncRoomData() {
    const roomRef = db.ref(`rooms/${state.room.id}`);
    
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return handleRoomClosed();

        // Update UI Players List
        const playersList = Object.keys(data.players || {});
        renderPlayers(playersList, data.host);
        
        // Handle Transitions
        if (data.status === "playing" && !state.game.active) {
            startClientGame(data);
        } else if (data.status === "waiting") {
            resetToLobby();
        }
    });
}

function renderPlayers(list, hostName) {
    const container = document.getElementById('players-container');
    container.innerHTML = list.map(p => `
        <div class="player-bubble">
            <span>${p} ${p === hostName ? '👑' : ''}</span>
            ${state.user.isHost && p !== state.user.name ? `<button onclick="kick('${p}')">❌</button>` : ''}
        </div>
    `).join('');
    
    if (state.user.isHost) document.getElementById('host-zone').style.display = 'block';
}

// 6. Gameplay Logic
function requestStart() {
    const players = document.getElementById('players-container').children.length;
    if (players < 3) return alert("بۆ دەستپێکردن لانی کەم ٣ کەس بن!");

    const cats = Object.keys(dictionary);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const word = dictionary[cat][Math.floor(Math.random() * dictionary[cat].length)];
    
    db.ref(`rooms/${state.room.id}/players`).once('value', snap => {
        const pList = Object.keys(snap.val());
        const imposter = pList[Math.floor(Math.random() * pList.length)];
        
        db.ref(`rooms/${state.room.id}`).update({
            status: "playing",
            gameData: { cat, word, imposter }
        });
    });
}

function startClientGame(data) {
    state.game.active = true;
    navigate('game');
    
    const { cat, word, imposter } = data.gameData;
    document.getElementById('cat-label').innerText = "کەتەگۆری: " + cat;
    
    if (state.user.name === imposter) {
        document.getElementById('main-word').innerText = "تۆ ئیمپۆستەری!";
        document.getElementById('main-word').style.color = "#ff4b2b";
    } else {
        document.getElementById('main-word').innerText = word;
        document.getElementById('main-word').style.color = "#00f2fe";
    }
}

// Helpers
function revealRole() { document.getElementById('card-inner').classList.toggle('flipped'); }
function copyCode() { 
    navigator.clipboard.writeText(state.room.id); 
    alert("کۆدەکە کۆپی کرا!"); 
}
