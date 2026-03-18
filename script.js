// ... (بەشی سەرەوەی script.js هەروەک خۆی دەمێنێتەوە تا دەگاتە فانکشنی startGame) ...

function startGame() {
    const cat = document.getElementById('inp-cat').value;
    const timeInput = document.getElementById('inp-time').value;
    const impCountInput = document.getElementById('inp-imps').value; // وەرگرتنی ژمارەی ساختەکار
    
    let timeInSeconds = (parseInt(timeInput) || 3) * 60; 
    let impCount = parseInt(impCountInput) || 1; // ئەگەر خاڵی بوو با ١ بێت

    const pool = dictionary[cat];
    const word = pool[Math.floor(Math.random() * pool.length)];

    db.ref(`rooms/${roomID}/players`).once('value').then(snap => {
        if (!snap.exists()) return;
        const keys = Object.keys(snap.val());
        
        // دڵنیابوونەوە لەوەی ژمارەی ساختەکار کەمترە لە ژمارەی یاریزانەکان
        if (impCount >= keys.length) {
            alert("ژمارەی ساختەکارەکان دەبێت کەمتر بێت لە یاریزانەکان!");
            impCount = keys.length - 1; // بە شێوەیەکی ئۆتۆماتیکی کەمی دەکاتەوە
            if (impCount < 1) impCount = 1;
        }

        // تێکەڵکردنی یاریزانەکان و هەڵبژاردنی N ساختەکار
        let shuffledKeys = keys.sort(() => 0.5 - Math.random());
        let selectedImposters = shuffledKeys.slice(0, impCount); // وەرگرتنی لیستی ساختەکارەکان
        
        db.ref(`rooms/${roomID}`).update({
            status: 'active', 
            word: word, 
            category: cat, 
            imposters: selectedImposters, // ئێستا ئەمە لیستێکە (Array) نەک تەنها یەک ناو
            time: timeInSeconds
        }).catch(e => alert("هەڵە هەیە: " + e.message));
    });
}

// ... (فانکشنەکانی listenToStatus و startTimer و runVoting هەروەک خۆیان دەمێننەوە) ...

function runGame() {
    showScreen('screen-game');
    if(isHost) document.getElementById('stop-game-btn').style.display = 'block';
    
    db.ref(`rooms/${roomID}`).once('value').then(snap => {
        const d = snap.val();
        
        // پشکنین دەکات بزانێت ئایا کلیکی تۆ لەناو لیستی ساختەکارەکاندایە
        const isImposter = (d.imposters && d.imposters.includes(myKey));
        
        document.getElementById('role-box').innerText = isImposter ? "تۆ ساختەکاریت! 🤫" : d.word;
        document.getElementById('cat-hint').innerText = "بابەت: " + d.category;
        startTimer(d.time);
    });
}

function runResults() {
    showScreen('screen-results');
    db.ref(`rooms/${roomID}`).once('value').then(snap => {
        const d = snap.val();
        
        // هێنانی ناوی هەموو ساختەکارەکان لەناو لیستەکەدا
        let imposterNames = d.imposters.map(key => d.players[key].name).join(" و ");
        
        document.getElementById('imposter-reveal').innerText = "ساختەکار: " + imposterNames;
        
        let sum = "";
        Object.values(d.players).forEach(p => sum += `• ${p.name}: <b>${p.votes || 0} دەنگ</b><br>`);
        document.getElementById('vote-summary').innerHTML = sum;
    });
}
