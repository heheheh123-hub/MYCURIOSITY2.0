
// ============================================
// THE WORLD OF AYAT
// GAME ENGINE — VERSION 1
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const startButton = document.getElementById("startButton");
const gameHUD = document.getElementById("gameHUD");
const touchControls = document.getElementById("touchControls");
const interactionPrompt = document.getElementById("interactionPrompt");
const discoveryCount = document.getElementById("discoveryCount");

// ============================================
// GAME CONFIGURATION
// ============================================

const WORLD = {
    width: 2600,
    height: 1900
};

const camera = {
    x: 0,
    y: 0
};

const player = {
    x: 500,
    y: 1050,
    speed: 240,
    direction: "down",
    moving: false
};

let gameStarted = false;
let lastTime = 0;
let discoveries = 0;
let activeObject = null;

const keys = {};
const touch = {
    up: false,
    down: false,
    left: false,
    right: false
};

// ============================================
// WORLD OBJECTS
// ============================================

const objects = [
    {
        id: "lantern",
        x: 850,
        y: 900,
        radius: 65,
        name: "The Forgotten Lantern",
        discovered: false
    },
    {
        id: "pond",
        x: 1840,
        y: 650,
        radius: 110,
        name: "The Moonlit Pond",
        discovered: false
    }
];

// ============================================
// FOREST GENERATION
// ============================================

const trees = [];

let seed = 12345;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

function generateForest() {

    for (let i = 0; i < 175; i++) {

        const x = 80 + random() * (WORLD.width - 160);
        const y = 80 + random() * (WORLD.height - 160);

        // Keep the starting area and paths relatively clear.
        if (
            Math.hypot(x - 500, y - 1050) < 250 ||
            Math.hypot(x - 850, y - 900) < 125 ||
            Math.hypot(x - 1840, y - 650) < 180
        ) {
            continue;
        }

        trees.push({
            x,
            y,
            size: 35 + random() * 35,
            shade: random()
        });
    }

    // Decorative trees around the outer world.
    for (let i = 0; i < 45; i++) {

        const side = Math.floor(random() * 4);

        let x;
        let y;

        if (side === 0) {
            x = random() * WORLD.width;
            y = 35 + random() * 100;
        } else if (side === 1) {
            x = random() * WORLD.width;
            y = WORLD.height - 135 + random() * 100;
        } else if (side === 2) {
            x = 35 + random() * 100;
            y = random() * WORLD.height;
        } else {
            x = WORLD.width - 135 + random() * 100;
            y = random() * WORLD.height;
        }

        trees.push({
            x,
            y,
            size: 65 + random() * 40,
            shade: random()
        });
    }
}

generateForest();

// ============================================
// CANVAS RESIZING
// ============================================

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ============================================
// INPUT
// ============================================

window.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    if (
        ["w", "a", "s", "d", "arrowup",
         "arrowdown", "arrowleft", "arrowright", " "]
        .includes(key)
    ) {
        event.preventDefault();
    }

    keys[key] = true;

    if (key === "e" && gameStarted) {
        interact();
    }
});

window.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", function() {

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

    Object.keys(touch).forEach(key => {
        touch[key] = false;
    });
});

// Touch movement controls.
document.querySelectorAll(".control").forEach(button => {

    const direction = button.dataset.direction;

    button.addEventListener("pointerdown", function(event) {
        event.preventDefault();
        touch[direction] = true;
        button.setPointerCapture(event.pointerId);
    });

    function release() {
        touch[direction] = false;
    }

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
});

document.getElementById("interactButton").addEventListener(
    "click",
    interact
);

// ============================================
// START GAME
// ============================================

startButton.addEventListener("click", function() {

    gameStarted = true;

    titleScreen.classList.add("leaving");

    gameHUD.classList.remove("hidden");

    if (window.matchMedia("(pointer: coarse)").matches) {
        touchControls.classList.remove("hidden");
    }

    player.x = 500;
    player.y = 1050;

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
});

// ============================================
// PLAYER MOVEMENT
// ============================================

function updatePlayer(deltaTime) {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"] || touch.up) dy--;
    if (keys["s"] || keys["arrowdown"] || touch.down) dy++;
    if (keys["a"] || keys["arrowleft"] || touch.left) dx--;
    if (keys["d"] || keys["arrowright"] || touch.right) dx++;

    player.moving = dx !== 0 || dy !== 0;

    if (!player.moving) return;

    // Prevent diagonal movement from being faster.
    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    const moveX = dx * player.speed * deltaTime;
    const moveY = dy * player.speed * deltaTime;

    if (dx > 0) player.direction = "right";
    if (dx < 0) player.direction = "left";
    if (dy > 0) player.direction = "down";
    if (dy < 0) player.direction = "up";

    // Move horizontally and vertically separately.
    if (!collides(player.x + moveX, player.y)) {
        player.x += moveX;
    }

    if (!collides(player.x, player.y + moveY)) {
        player.y += moveY;
    }

    player.x = Math.max(25, Math.min(WORLD.width - 25, player.x));
    player.y = Math.max(25, Math.min(WORLD.height - 25, player.y));
}

// ============================================
// COLLISIONS
// ============================================

function collides(x, y) {

    for (const tree of trees) {

        const distance = Math.hypot(
            x - tree.x,
            y - (tree.y + tree.size * 0.2)
        );

        if (distance < tree.size * 0.43 + 13) {
            return true;
        }
    }

    return false;
}

// ============================================
// CAMERA
// ============================================

function updateCamera() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const targetX = player.x - width / 2;
    const targetY = player.y - height / 2;

    camera.x += (targetX - camera.x) * 0.09;
    camera.y += (targetY - camera.y) * 0.09;

    camera.x = Math.max(
        0,
        Math.min(WORLD.width - width, camera.x)
    );

    camera.y = Math.max(
        0,
        Math.min(WORLD.height - height, camera.y)
    );
}

// ============================================
// DRAW THE FOREST
// ============================================

function drawGround() {

    ctx.fillStyle = "#10271f";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Subtle ground texture.
    for (let i = 0; i < 850; i++) {

        const x = (i * 173) % WORLD.width;
        const y = (i * 291) % WORLD.height;

        ctx.fillStyle = i % 3 === 0
            ? "rgba(140,180,100,0.055)"
            : "rgba(0,0,0,0.07)";

        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
    }

    // Winding forest path.
    ctx.beginPath();
    ctx.moveTo(300, 1200);
    ctx.bezierCurveTo(550, 1150, 650, 850, 900, 950);
    ctx.bezierCurveTo(1100, 1050, 1200, 850, 1400, 780);
    ctx.bezierCurveTo(1580, 710, 1680, 600, 1840, 650);

    ctx.strokeStyle = "#46352d";
    ctx.lineWidth = 145;
    ctx.stroke();

    ctx.strokeStyle = "rgba(194,151,91,0.09)";
    ctx.lineWidth = 100;
    ctx.stroke();
}

// ============================================
// DRAW TREES
// ============================================

function drawTree(tree) {

    const { x, y, size, shade } = tree;

    ctx.save();
    ctx.translate(x, y);

    // Shadow.
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(5, 10, size * 0.65, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk.
    ctx.fillStyle = "#39251d";
    ctx.fillRect(-size * 0.13, -size * 0.1, size * 0.26, size * 0.7);

    // Tree crown.
    const gradient = ctx.createRadialGradient(
        -size * 0.2, -size * 0.4, 2,
        0, -size * 0.1, size
    );

    gradient.addColorStop(0, shade > 0.5 ? "#466d45" : "#385d42");
    gradient.addColorStop(1, "#102d25");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -size * 0.35, size * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Subtle gold leaves.
    ctx.fillStyle = "rgba(212,175,55,0.22)";
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.65, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ============================================
// DRAW MOONLIT POND
// ============================================

function drawPond(time) {

    const x = 1840;
    const y = 650;

    const pulse = Math.sin(time * 0.0015) * 4;

    ctx.save();

    // Outer glow.
    const glow = ctx.createRadialGradient(
        x, y, 20,
        x, y, 230 + pulse
    );

    glow.addColorStop(0, "rgba(212,175,55,0.15)");
    glow.addColorStop(1, "rgba(212,175,55,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 230 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Water.
    ctx.fillStyle = "#142f49";
    ctx.beginPath();
    ctx.ellipse(x, y, 135, 85, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(212,175,55,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Water reflections.
    for (let i = 0; i < 7; i++) {

        const offset = (time * 0.015 + i * 25) % 100;

        ctx.strokeStyle = `rgba(212,175,55,${0.12 + i * 0.015})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.ellipse(
            x,
            y + offset - 50,
            45 + i * 7,
            8,
            0,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    ctx.restore();
}

// ============================================
// DRAW THE LANTERN
// ============================================

function drawLantern(time) {

    const object = objects[0];

    if (object.discovered) return;

    const pulse = Math.sin(time * 0.003) * 6;

    ctx.save();
    ctx.translate(object.x, object.y);

    // Golden glow.
    const glow = ctx.createRadialGradient(
        0, -15, 2,
        0, -15, 85 + pulse
    );

    glow.addColorStop(0, "rgba(255,220,120,0.35)");
    glow.addColorStop(1, "rgba(255,190,70,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -15, 85 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Lantern base.
    ctx.fillStyle = "#583b22";
    ctx.fillRect(-13, -8, 26, 34);

    // Glass.
    ctx.fillStyle = "#f7c65b";
    ctx.fillRect(-9, -23, 18, 18);

    // Flame.
    ctx.fillStyle = "#fff1ae";
    ctx.beginPath();
    ctx.arc(0, -15, 5 + pulse * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ============================================
// DRAW PLAYER
// ============================================

function drawPlayer(time) {

    ctx.save();
    ctx.translate(player.x, player.y);

    const bob = player.moving
        ? Math.sin(time * 0.018) * 2
        : Math.sin(time * 0.002) * 1;

    // Shadow.
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 17, 19, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);

    // Cloak.
    ctx.fillStyle = "#8e142d";
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(15, -4);
    ctx.lineTo(18, 22);
    ctx.lineTo(0, 29);
    ctx.lineTo(-18, 22);
    ctx.closePath();
    ctx.fill();

    // Gold cloak detail.
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 15);
    ctx.lineTo(0, 22);
    ctx.lineTo(12, 15);
    ctx.stroke();

    // Head.
    ctx.fillStyle = "#e8b995";
    ctx.beginPath();
    ctx.arc(0, -10, 12, 0, Math.PI * 2);
    ctx.fill();

    // Hair.
    ctx.fillStyle = "#271a1a";
    ctx.beginPath();
    ctx.arc(0, -14, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Small gold hair ornament.
    ctx.fillStyle = "#f5d77a";
    ctx.beginPath();
    ctx.arc(7, -19, 3, 0, Math.PI * 2);
    ctx.fill();

    // Facing direction marker.
    ctx.fillStyle = "#fff1b8";

    if (player.direction === "up") {
        ctx.fillRect(-3, -25, 6, 3);
    } else if (player.direction === "down") {
        ctx.fillRect(-3, 1, 6, 3);
    } else if (player.direction === "left") {
        ctx.fillRect(-14, -12, 3, 6);
    } else {
        ctx.fillRect(11, -12, 3, 6);
    }

    ctx.restore();
}

// ============================================
// INTERACTION DETECTION
// ============================================

function findNearbyObject() {

    let closest = null;
    let closestDistance = Infinity;

    for (const object of objects) {

        if (object.discovered) continue;

        const distance = Math.hypot(
            player.x - object.x,
            player.y - object.y
        );

        if (
            distance < object.radius &&
            distance < closestDistance
        ) {
            closest = object;
            closestDistance = distance;
        }
    }

    return closest;
}

function interact() {

    if (!gameStarted) return;

    const object = findNearbyObject();

    if (!object) return;

    activeObject = object;

    if (object.id === "lantern") {

        object.discovered = true;

        discoveries++;
        updateDiscoveryCounter();

        showMessage(
            "DISCOVERY 01",
            "The Forgotten Lantern",
            "A little light can change the way an entire world looks. Perhaps this one was waiting for you."
        );

    } else if (object.id === "pond") {

        showMessage(
            "THE MOONLIT POND",
            "Something beneath the water...",
            "The surface shimmers as though it is hiding a secret. Perhaps there is more to discover here."
        );

    }
}

// ============================================
// GAME MESSAGE
// ============================================

function showMessage(label, heading, description) {

    let overlay = document.getElementById("gameMessage");

    if (!overlay) {

        overlay = document.createElement("div");
        overlay.id = "gameMessage";

        overlay.innerHTML = `
            <div class="message-card">
                <span id="messageLabel"></span>
                <h2 id="messageHeading"></h2>
                <p id="messageDescription"></p>
                <button id="messageClose">CONTINUE</button>
            </div>
        `;

        Object.assign(overlay.style, {
            position: "absolute",
            inset: "0",
            zIndex: "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,7,17,0.82)",
            backdropFilter: "blur(9px)",
            padding: "20px"
        });

        const card = overlay.querySelector(".message-card");

        Object.assign(card.style, {
            width: "min(480px, 100%)",
            padding: "42px 30px",
            textAlign: "center",
            background: "#0b1728",
            border: "1px solid rgba(212,175,55,0.55)",
            boxShadow: "0 0 65px rgba(163,13,37,0.18)"
        });

        overlay.querySelector("#messageLabel").style.cssText =
            "color:#d4af37;letter-spacing:4px;font:11px Arial";

        overlay.querySelector("#messageHeading").style.cssText =
            "font:normal 32px Georgia;color:#fff1b8;margin:22px 0";

        overlay.querySelector("#messageDescription").style.cssText =
            "font:15px/1.9 Georgia;color:#e6ddce";

        overlay.querySelector("#messageClose").style.cssText =
            "margin-top:30px;padding:14px 28px;background:#8e142d;color:#fff5df;border:1px solid #d4af37;letter-spacing:3px;cursor:pointer";

        document.getElementById("game").appendChild(overlay);

        overlay.querySelector("#messageClose").addEventListener(
            "click",
            closeMessage
        );
    }

    overlay.querySelector("#messageLabel").textContent = label;
    overlay.querySelector("#messageHeading").textContent = heading;
    overlay.querySelector("#messageDescription").textContent = description;

    overlay.style.display = "flex";
}

function closeMessage() {

    const overlay = document.getElementById("gameMessage");

    if (overlay) {
        overlay.style.display = "none";
    }

    activeObject = null;
}

function updateDiscoveryCounter() {

    discoveryCount.textContent =
        String(discoveries).padStart(2, "0") + " / 25";
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(time) {

    if (!gameStarted) return;

    const deltaTime = Math.min(
        (time - lastTime) / 1000,
        0.05
    );

    lastTime = time;

    const overlay = document.getElementById("gameMessage");

    // Pause movement while a message is open.
    if (!overlay || overlay.style.display === "none") {

        updatePlayer(deltaTime);

    }

    updateCamera();

    ctx.clearRect(
        0,
        0,
        canvas.clientWidth,
        canvas.clientHeight
    );

    ctx.save();

    ctx.translate(-camera.x, -camera.y);

    drawGround();
    drawPond(time);
    drawLantern(time);

    // Sort trees and player by vertical position.
    const renderables = [
        ...trees.map(tree => ({
            y: tree.y,
            draw: () => drawTree(tree)
        })),
        {
            y: player.y,
            draw: () => drawPlayer(time)
        }
    ];

    renderables.sort((a, b) => a.y - b.y);

    renderables.forEach(item => item.draw());

    ctx.restore();

    // Interaction prompt.
    const nearby = findNearbyObject();

    if (nearby) {

        interactionPrompt.textContent =
            "E  ·  " + nearby.name;

        interactionPrompt.style.opacity = "1";

    } else {

        interactionPrompt.style.opacity = "0";

    }

    requestAnimationFrame(gameLoop);
}

