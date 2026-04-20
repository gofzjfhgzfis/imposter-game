// تکایە کۆنفیگی فایەربەیسەکەی خۆت لێرە دابنێ
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName = "";
let currentRoomCode = "";
let isHost = false;

const dictionary = {
    "فیلم": ["ئینتەرستێلار", "ئینسیپشن", "سێڤن", "باتمان", "جۆکەر", "تایتانیک", "هاری پۆتەر", "پیاوی جاڵجاڵۆکە", "کیسەڵەکان", "ئایۆن مەن"],
    "تەکنەلۆژیا": ["کۆمپیوتەر", "ئینتەرنێت", "مۆبایل", "فایەربەیس", "ڕۆبۆت", "پڕۆگرامینگ", "فەیسبووک", "یوتیوب", "گوگڵ", "زیرەکی دەستکرد"],
    "ئۆتۆمبێل": ["بزوێنەر", "تایە", "گێڕ", "ویل", "لایت", "پەنزین", "جام", "ستێرن", "ڕادێتەر", "پاتری", "بیئێم", "کڕۆڵە", "دۆج", "ئەڤۆلۆن", "مێرسیدس", "لادە"],
    "خواردن": ["پیتزا", "بێرگەر", "نانی کوردی", "سێو", "مۆز", "کباب", "یاپراخ", "شۆربا", "مریشک", "دۆ"],
    "وەرزش": ["تۆپی پێ", "ڕاکردن", "مەلەوانی", "تێنس", "باسکە", "مێسی", "ڕۆناڵدۆ", "ڕیاڵ مەدرید", "بەرشەلۆنە", "مۆندیال"],
    "گەیمینگ": ["پۆبجی", "گتای", "ماینکرافت", "پلەیستەیشن", "ئێکس بۆکس", "فۆرتنایت", "ڕۆبلۆکس", "کۆنترۆڵ", "مۆنیتەر", "گەیمەر"],
    "ئاژەڵان": ["شێر", "پڵنگ", "پشیلە", "سەگ", "فیڵ", "نەهەنگ", "مار", "دایناسۆڕ", "مەیمون", "داڵ"]
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function createRoom() {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("تکایە ناوت بنووسە");

    currentRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    isHost = true;

    db.ref("rooms/" + currentRoomCode).set({
        host: myName, 
        status: "waiting",
        players: { [myName]: true }
    }).then(() => {
        enterWaitingRoom();
    });
}

function joinRoom() {
    myName = document.getElementById('playerName').value.trim();
    currentRoomCode = document.getElementById('roomCodeInput').value.trim();
    if (!myName || !currentRoomCode) return alert("ناوی خۆت و کۆدی ژوور بنووسە");

    db.ref("rooms/" + currentRoomCode).once("value", snapshot => {
        if (snapshot.exists()) {
            let roomData = snapshot.val();
            if (roomData.status === "playing") return alert("یاری دەستی پێکردووە ناتوانیت جۆین بیت!");
            
            isHost = false;
            db.ref("rooms/" + currentRoomCode + "/players").update({
                [myName]: true
            }).then(() => {
                enterWaitingRoom();
            });
        } else {
            alert("ئەم ژوورە بوونی نییە!");
        }
    });
}

function enterWaitingRoom() {
    document.getElementById('displayRoomCode').innerText = currentRoomCode;
    if (isHost) document.getElementById('hostControls').style.display = "block";
    listenToRoom();
}

function listenToRoom() {
    db.ref("rooms/" + currentRoomCode).on("value", snapshot => {
        if (!snapshot.exists()) {
            alert("ژوورەکە داخرا.");
            window.location.reload();
            return;
        }

        let roomData = snapshot.val();
        let players = roomData.players || {};

        // ئەگەر ناوم نەما لە لیستەکە، واتە دەرکراوم
        if (!players[myName]) {
            alert("لەلایەن خاوەنی ژوورەکەوە دەرکرایت!");
            window.location.reload();
            return;
        }

        // کۆنترۆڵکردنی شاشەکان بەپێی دۆخی یارییەکە
        if (roomData.status === "waiting") {
            showScreen('waiting-screen');
            updatePlayersList(roomData);
        } else if (roomData.status === "playing") {
            showGameScreen(roomData);
        }
    });
}

function updatePlayersList(roomData) {
    let players = roomData.players || {};
    let playersListHTML = "";
    
    Object.keys(players).forEach(player => {
        let hostText = (player === roomData.host) ? `<span style="color:#00f2fe; font-size:0.8rem;"> (خاوەن)</span>` : "";
        playersListHTML += `<li><span>${player} ${hostText}</span>`;
        
        // دوگمەی دەرکردن تەنها بۆ خاوەن ژوور
        if (isHost && player !== myName) {
            playersListHTML += `<button onclick="kickPlayer('${player}')" class="btn kick-btn">دەرکردن</button>`;
        }
        playersListHTML += `</li>`;
    });
    document.getElementById('playersList').innerHTML = playersListHTML;
}

function kickPlayer(playerToKick) {
    db.ref("rooms/" + currentRoomCode + "/players/" + playerToKick).remove();
}

function startGame() {
    db.ref("rooms/" + currentRoomCode + "/players").once("value", snapshot => {
        let playersArray = Object.keys(snapshot.val() || {});
        if (playersArray.length < 3) return alert("لانی کەم 3 یاریزان پێویستە بۆ دەستپێکردنی یاری");

        let categories = Object.keys(dictionary);
        let randomCategory = categories[Math.floor(Math.random() * categories.length)];
        let wordsInCategory = dictionary[randomCategory];
        let randomWord = wordsInCategory[Math.floor(Math.random() * wordsInCategory.length)];
        
        let imposterIndex = Math.floor(Math.random() * playersArray.length);
        let imposterName = playersArray[imposterIndex];

        db.ref("rooms/" + currentRoomCode).update({
            status: "playing",
            word: randomWord,
            category: randomCategory,
            imposter: imposterName
        });
    });
}

function showGameScreen(roomData) {
    showScreen('game-screen');
    let roleText = "";
    
    if (myName === roomData.imposter) {
        roleText = `<span style="color: #ff4b2b;">تۆ ساختەکاریت (Imposter)!</span> <br><br> جۆری وشەکە: <span style="color: #00f2fe;">${roomData.category}</span>`;
    } else {
        roleText = `وشەکە: <span style="color: #38ef7d;">${roomData.word}</span> <br><br> جۆری وشەکە: <span style="color: #00f2fe;">${roomData.category}</span>`;
    }
    
    document.getElementById('roleDisplay').innerHTML = roleText;

    // پیشاندانی دوگمەی 'دووبارە یاریکردنەوە' تەنها بۆ خاوەن ژوور
    if (isHost) {
        document.getElementById('playAgainBtn').style.display = "block";
    }
}

// فەنکشنی نوێ بۆ گەڕانەوە بۆ لۆبی بەبێ دەرچوون
function playAgain() {
    if (!isHost) return;
    
    // گۆڕینی دۆخی یارییەکە بۆ چاوەڕوانی (لۆبی)
    db.ref("rooms/" + currentRoomCode).update({
        status: "waiting",
        word: null,
        category: null,
        imposter: null
    });
}

function leaveRoom() {
    db.ref("rooms/" + currentRoomCode + "/players/" + myName).remove().then(() => {
        window.location.reload();
    });
}
