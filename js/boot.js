const bios = document.getElementById("bios-text");
const enterHint = document.getElementById("enter-hint");

/* ======================
   STARFIELD (SAFE)
====================== */
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const stars = Array.from({ length: 169 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    s: Math.random() * 2 + 0.3,
    v: Math.random() * 0.4 + 0.1
}));

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        const flicker = 0.6 + Math.random() * 0.6;
        ctx.fillStyle = `rgba(255,255,255,${flicker})`;
        ctx.fillRect(star.x, star.y, star.s, star.s);
    });

    requestAnimationFrame(drawStars);
}
drawStars();

/* ======================
   BIOS OUTPUT HELPERS
====================== */

function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function addLine(text = "") {
    bios.textContent += text + "\n";
}

function updateLastLine(text) {
    const lines = bios.textContent.split("\n");
    lines[lines.length - 2] = text;
    bios.textContent = lines.join("\n");
}

async function loadingLine(label, states, final, speed = 160) {
    addLine(label + states[0]);
    await wait(speed);

    for (let state of states.slice(1)) {
        updateLastLine(label + state);
        await wait(speed);
    }

    updateLastLine(label + final);
    await wait(200);
}


async function numberRun(label, max) {
    let value = 0;
    addLine(label + value);
    await wait(120);

    while (value < max) {
        value += Math.floor(Math.random() * 500) + 100;
        if (value > max) value = max;
        updateLastLine(label + value);
        await wait(80);
    }

    await wait(200);
    updateLastLine(label + max + " 0K");
    await wait(200);
}


/* ======================
   BOOT SEQUENCE
====================== */

(async function boot() {

    // FULLSCREEN PRE-BOOT GLITCH
    bios.textContent = "";
    document.body.style.background = "black";

    for (let i = 0; i < 12; i++) {
        bios.textContent = Math.random() > 0.5
            ? "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒"
            : "";
        await wait(70);
    }

    bios.textContent = "";
    document.getElementById("boot-screen").style.display = "block";

    const sound = document.getElementById("bootSound");
    if (sound) {
        sound.volume = 0.7;
        sound.play().catch(() => { });
    }

    addLine("CHOG BIOS V0.01.");
    await wait(200);

    addLine("A Curated Digital Anomaly.");
    await wait(200);

    addLine("Copyright (c) 2001–2026 CHOG Collective.");
    await wait(300);

    addLine("");

    addLine("CHOGCore™ Soft Processor");
    await wait(200);

    addLine("13 69000 MHZ: Unstable");
    await wait(300);

    await loadingLine(
        "MONAD < Interface: ",
        ["Checking", "Initializing", "Retrying", "Finalizing"],
        "Detected"
    );

    await loadingLine(
        "Status: ",
        ["Checking", "Analyzing", "Resolving"],
        "Unknown"
    );

    addLine("");

    await loadingLine(
        "Initializing Memory Cards: ",
        [
            "Checking",
            "Failed",
            "Re-running Prompt",
            "Optimizing Allocation",
            "Verifying"
        ],
        "0K"
    );

   addLine("CHOG Signal: > 1969 OK");
await wait(200);

await loadingLine(
    "Detecting Pattern Fixation: ",
    [
        "Scanning",
        "Error",
        "Retrying Scan",
        "Indexing Patterns",
        "Finalizing"
    ],
    "OK"
);

    addLine("");

    await loadingLine(
        "Initializing chog.exe: ",
        [
            "Loading",
            "Resolving Dependencies",
            "Optimizing Runtime",
            "Starting"
        ],
        "0K"
    );

    addLine("");
    enterHint.classList.remove("hidden");
    startCountdown();

})();

/* ======================
   ENTER KEY
====================== */

/* ======================
   ANY KEY + COUNTDOWN
====================== */

let countdownValue = 10;
let countdownTimer = null;
let hasContinued = false;

function continueToLogin(playSound) {
    if (hasContinued) return;
    hasContinued = true;

    clearInterval(countdownTimer);

    if (playSound) {
        const snd = document.getElementById("biosSound");
        if (snd) {
            snd.currentTime = 0;
            snd.volume = 0.7;
            snd.play().catch(() => { });
        }
    }

    setTimeout(() => {
        window.location.href = "login.html";
    }, playSound ? 700 : 0);
}

// Start countdown when hint appears
function startCountdown() {
    const counter = document.getElementById("countdown");
    counter.textContent = `(${countdownValue})`;

    countdownTimer = setInterval(() => {
        countdownValue--;
        counter.textContent = `(${countdownValue})`;

        if (countdownValue <= 0) {
            clearInterval(countdownTimer);
            continueToLogin(false);
        }
    }, 1000);
}


// Trigger countdown when BIOS finishes


// ANY key press
document.addEventListener("keydown", e => {
    if (!enterHint.classList.contains("hidden")) {
        continueToLogin(true); // SOUND PLAYS
    }
});

// Touch/click support for mobile
document.addEventListener("click", e => {
    if (!enterHint.classList.contains("hidden")) {
        continueToLogin(true); // SOUND PLAYS
    }
});

document.addEventListener("touchend", e => {
    if (!enterHint.classList.contains("hidden")) {
        continueToLogin(true); // SOUND PLAYS
    }
});