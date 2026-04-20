/**
 * Imposter Game Engine v2.0
 * Developed by Yusuf
 */

// --- 1. Firebase Initialization ---
const firebaseConfig = {
    apiKey: "لێرە كلیلەكە دانێ",
    authDomain: "yousif-eda79.firebaseapp.com",
    databaseURL: "https://yousif-eda79-default-rtdb.firebaseio.com",
    projectId: "yousif-eda79",
    storageBucket: "yousif-eda79.appspot.com",
    appId: "لێرە ئایدیەكە دانێ"
};

// Start Firebase with safety check
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Connected Successfully");
} catch (error) {
    console.error("Firebase Connection Failed: ", error);
}

const db = firebase.database();

// --- 2. Global State ---
let userSession = {
    name: "",
    roomCode: "",
    isHost: false,
    currentRole: "player"
};

// --- 3. Massive Dictionary (سەدان وشە) ---
const GameDictionary = {
    "خواردن": ["پیتزا", "کباب", "یاپراخ", "بێرگەر", "شۆربا", "مریشک", "دۆلمە", "برنج", "ماسی", "کوتلێت", "فەلافل", "لوبیا", "ساوەر", "نیسک"],
    "تەکنەلۆژیا": ["مۆبایل", "کۆمپیوتەر", "ئینتەرنێت", "ڕۆبۆت", "فەیسبووک", "ئایفۆن", "فایەربەیس", "پڕۆگرامینگ", "سۆشیاڵ میدیا", "لاپتۆپ", "تەختەکلیل"],
    "ئاژەڵان": ["شێر", "پشیلە", "سەگ", "فیل", "مار", "پڵنگ", "کیسەڵ", "کەروێشک", "وشتر", "گوێدرێژ", "مەیمون", "دایناسۆڕ", "نەهەنگ", "کوڕەبڕە"],
    "وەرزش": ["تۆپی پێ", "مەلەوانی", "ڕاکردن", "تێنس", "باسکە", "کۆنگ فو", "بۆکسێن", "سەرکەوتن بەسەر چیا", "بالە", "جودۆ", "شەتڕەنج"],
    "فیلمەکان": ["باتمان", "جۆکەر", "تایتانیک", "سپایدەرمان", "هاری پۆتەر", "ئینتەرستێلار", "ئینسیپشن", "سێڤن", "باربی", "ئۆپنهایمەر"],
    "وڵاتان": ["کوردستان", "عێراق", "تورکیا", "ئێران", "ئەڵمانیا", "فەڕەنسا", "ئەمریکا", "بەریتانیا", "ژاپۆن", "چین", "ئیتاڵیا", "بەڕازیل"],
    "ئۆتۆمبێل": ["بی ئێم دەبلیو", "مێرسیدس", "تۆۆیۆتا", "نیسان", "دۆج", "فۆرد", "تێسلا", "لامبۆرگینی", "فێراری", "ڕێنج ڕۆڤەر"],
    "پڕۆگرامینگ": ["پایسۆن", "جاڤاسکریپت", "سی پڵەس پڵەس", "جاڤا", "کۆتڵین", "سویفت", "پی ئێچ پی", "ڕۆبی", "گۆ", "تایپ سکریپت"]
};

// --- 4. Navigation & UI Logic ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if(target) target.classList.add('active');
    else console.error(`Screen ${screenId} not found!`);
}

window.showMode = function(mode) {
    userSession.mode = mode;
    showScreen('auth-screen');
    const title = document.getElementById('mode-title');
    const joinSection = document.getElementById('join-section');
    
    if (mode === 'create') {
        title.innerText = "دروستکردنی ژووری نوێ";
        joinSection.style.display = "none";
    } else {
        title.innerText = "جۆین بوونی ژوور";
        joinSection.style.display = "block";
    }
};

// --- 5. Room Management ---
window.handleAction = function() {
    const nameInput = document.getElementById('playerName');
    userSession.name = nameInput.value.trim();

    if (!userSession.name) return alert("تکایە ناوت بنووسە!");

    if (userSession.mode === 'create') {
        userSession.roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        userSession.isHost = true;
        
        db.ref("rooms/" + userSession.roomCode).set({
            host: userSession.name,
            status: "waiting",
            players: { [userSession.name]: true },
            createdAt: Date.now()
        }).then(() => enterLobby());
    } else {
        userSession.roomCode = document.getElementById('roomCodeInput').value.trim();
        if (!userSession.roomCode) return alert("کۆدی ژوورەکە بنووسە!");
        
        db.ref("rooms/" + userSession.roomCode).once("value", snapshot => {
            if (snapshot.exists()) {
                const room = snapshot.val();
                if (room.status !== "waiting") return alert("یارییەکە دەستی پێکردووە!");
                
                db.ref("rooms/" + userSession.roomCode + "/players/" + userSession.name).set(true);
                userSession.isHost = false;
                enterLobby();
            } else {
                alert("ئەم ژوورە بوونی نییە!");
            }
        });
    }
};

function enterLobby() {
    showScreen('waiting-screen');
    document.getElementById('displayRoomCode').innerText = userSession.roomCode;
    
    if (userSession.isHost) {
        document.getElementById('host-panel').style.display = "block";
    }

    listenToRoomUpdates();
}

function listenToRoomUpdates() {
    const roomRef = db.ref("rooms/" + userSession.roomCode);
    
    roomRef.on("value", snapshot => {
        const data = snapshot.val();
        if (!data) return;

        // Check if I am kicked
        if (!data.players || !data.players[userSession.name]) {
            roomRef.off();
            alert("تۆ لە ژوورەکە دەرکرایت!");
            window.location.reload();
            return;
        }

        // Update Player List
        const players = Object.keys(data.players);
        document.getElementById('playerCount').innerText = players.length;
        
        let html = "";
        players.forEach(p => {
            const isHostLabel = p === data.host ? " 👑" : "";
            html += `
                <div class="player-item">
                    <span>${p}${isHostLabel}</span>
                    ${userSession.isHost && p !== userSession.name ? 
                        `<button class="kick-btn" onclick="kickPlayer('${p}')">دەرکردن</button>` : ''}
                </div>
            `;
        });
        document.getElementById('playersList').innerHTML = html;

        // Handle Game Status Changes
        if (data.status === "playing") {
            processGameStart(data);
        } else if (data.status === "waiting") {
            showScreen('waiting-screen');
        }
    });
}

// --- 6. Game Execution Logic ---
window.startGame = function() {
    const roomRef = db.ref("rooms/" + userSession.roomCode);
    
    roomRef.once("value", snapshot => {
        const players = Object.keys(snapshot.val().players);
        if (players.length < 3) return alert("بۆ دەستپێکردن لانی کەم ٣ یاریزان پێویستە!");

        // Randomly pick category and word
        const categories = Object.keys(GameDictionary);
        const selectedCat = categories[Math.floor(Math.random() * categories.length)];
        const words = GameDictionary[selectedCat];
        const selectedWord = words[Math.floor(Math.random() * words.length)];
        
        // Pick Imposter
        const imposter = players[Math.floor(Math.random() * players.length)];

        roomRef.update({
            status: "playing",
            category: selectedCat,
            word: selectedWord,
            imposter: imposter,
            gameId: Date.now()
        });
    });
};

function processGameStart(data) {
    showScreen('game-screen');
    document.getElementById('game-category').innerText = "کەتەگۆری: " + data.category;
    
    const wordDisplay = document.getElementById('word-display');
    const roleDesc = document.getElementById('role-description');
    
    if (userSession.name === data.imposter) {
        wordDisplay.innerText = "تۆ ساختەکاری!";
        wordDisplay.style.color = "#ff4b2b";
        roleDesc.innerText = "هەوڵ بدە بزانیت وشەکە چییە بێ ئەوەی ئاشکرا بیت.";
    } else {
        wordDisplay.innerText = data.word;
        wordDisplay.style.color = "#00f2fe";
        roleDesc.innerText = "باسی وشەکە بکە بە وریایی بۆ ئەوەی ساختەکارەکە نەزانێت.";
    }

    if (userSession.isHost) {
        document.getElementById('replay-section').style.display = "block";
    }
}

window.playAgain = function() {
    db.ref("rooms/" + userSession.roomCode).update({
        status: "waiting",
        word: null,
        imposter: null
    });
};

window.kickPlayer = function(pName) {
    db.ref("rooms/" + userSession.roomCode + "/players/" + pName).remove();
};

window.leaveRoom = function() {
    if(confirm("دڵنیای لە چوونە دەرەوە؟")){
        db.ref("rooms/" + userSession.roomCode + "/players/" + userSession.name).remove()
        .then(() => window.location.reload());
    }
};

window.copyRoomCode = function() {
    navigator.clipboard.writeText(userSession.roomCode);
    alert("کۆدەکە کۆپی کرا: " + userSession.roomCode);
};

window.toggleRules = function() {
    const modal = document.getElementById('rules-modal');
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
};
