/* Custom Properties for Global Theme */
:root {
    --primary-gradient: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
    --danger-gradient: linear-gradient(135deg, #ff0844 0%, #ffb199 100%);
    --glass: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --text-main: #f8fafc;
    --text-dim: #94a3b8;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    user-select: none;
}

body {
    background: #020617;
    color: var(--text-main);
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Background Animation */
.bg-animation {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: -1;
    background: radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%);
}

#main-wrapper {
    width: 100%;
    max-width: 420px;
    height: 90vh;
    position: relative;
    padding: 20px;
}

.screen {
    display: none;
    height: 100%;
    flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.screen.active { display: flex; }

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Glass Panel Design */
.glass-panel {
    background: var(--glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 32px;
    padding: 30px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Menu Cards */
.card-grid {
    display: grid;
    gap: 15px;
    margin-top: 40px;
}

.menu-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    padding: 20px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: right;
}

.menu-card:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(-5px);
}

.card-icon {
    font-size: 2.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.card-info h3 { font-size: 1.2rem; margin-bottom: 4px; }
.card-info p { color: var(--text-dim); font-size: 0.85rem; }

/* Players List in Lobby */
.players-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
    max-height: 50vh;
    overflow-y: auto;
}

.player-bubble {
    background: var(--glass);
    padding: 15px;
    border-radius: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--glass-border);
}

/* Role Card Animation */
.role-display-box {
    perspective: 1000px;
    width: 100%;
    height: 300px;
    cursor: pointer;
}

.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.card-inner.flipped { transform: rotateY(180deg); }

.card-front, .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 30px;
    border: 2px solid var(--primary-gradient);
}

.card-back {
    background: var(--glass);
    transform: rotateY(180deg);
}
