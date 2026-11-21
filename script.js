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

// The game now contains two persistent, explorable areas.
let currentArea = "forest";
let forestReturnPosition = { x: 500, y: 840 };
const FOREST_SIZE = { width: 2600, height: 1900 };
const OBSERVATORY_SIZE = { width: 2200, height: 1600 };

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
    },
    {
        id: "memory-moon",
        x: 600,
        y: 1190,
        radius: 65,
        name: "A Piece of Moonlight",
        discovered: false
    },
    {
        id: "memory-star",
        x: 1250,
        y: 880,
        radius: 65,
        name: "A Falling Star",
        discovered: false
    },
    {
        id: "memory-heart",
        x: 1600,
        y: 700,
        radius: 65,
        name: "A Memory of the Heart",
        discovered: false
    },
    {
        id: "observatory-gate",
        x: 500,
        y: 840,
        radius: 82,
        name: "The Sealed Observatory",
        discovered: false
    }
];

// ============================================
// GAME PROGRESSION SYSTEM
// ============================================

const gameInventory = [];

const gameQuest = {
    lanternFound: false,
    pondFound: false,
    fragmentsFound: 0,
    completed: false
};

const memoryFragmentNames = {
    "memory-moon": "A Piece of Moonlight",
    "memory-star": "A Falling Star",
    "memory-heart": "A Memory of the Heart"
};

// ============================================
// AREA 2 — THE OBSERVATORY
// ============================================

const observatoryObjects = [
    { id: "observatory-return", x: 260, y: 1350, radius: 85, name: "Return to the Forest", discovered: false },
    { id: "star-fragment-one", x: 560, y: 1080, radius: 58, name: "The First Star Fragment", discovered: false },
    { id: "star-fragment-two", x: 1640, y: 500, radius: 58, name: "The Second Star Fragment", discovered: false },
    { id: "star-fragment-three", x: 1780, y: 1190, radius: 58, name: "The Third Star Fragment", discovered: false },
    { id: "observatory-telescope", x: 1100, y: 650, radius: 95, name: "The Astronomer's Telescope", discovered: false },
    { id: "observatory-console", x: 1100, y: 1050, radius: 78, name: "The Constellation Console", discovered: false },
    { id: "observatory-chamber", x: 1900, y: 800, radius: 88, name: "The Celestial Chamber", discovered: false }
];

const observatoryQuest = {
    fragmentsFound: 0,
    telescopeRead: false,
    puzzleSolved: false,
    chamberEntered: false
};

const observatoryPillars = [
    { x: 720, y: 650, r: 38 }, { x: 1480, y: 650, r: 38 },
    { x: 720, y: 950, r: 38 }, { x: 1480, y: 950, r: 38 },
    { x: 930, y: 350, r: 32 }, { x: 1270, y: 350, r: 32 },
    { x: 930, y: 1250, r: 32 }, { x: 1270, y: 1250, r: 32 }
];

const observatoryStarSequence = ["moon", "star", "heart"];

function checkForestQuest() {

    if (
        gameQuest.lanternFound &&
        gameQuest.pondFound &&
        gameQuest.fragmentsFound >= 3 &&
        !gameQuest.completed
    ) {

        gameQuest.completed = true;

        gameInventory.push("The Moonlit Memory");

        updateGameSystemsUI();

        return true;
    }

    updateGameSystemsUI();

    return false;
}

// ============================================
// FOREST GENERATION
// ============================================

const trees = [];

// ==========================================
// FOREST DECORATIONS
// ==========================================

const forestDecorations = {
    flowers: [],
    mushrooms: [],
    rocks: [],
    fireflies: []
};

// Consistent random generator.
function forestRandom(seed) {
    let value = seed;

    return function () {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function generateForestDecorations() {
    const random = forestRandom(251225);

    forestDecorations.flowers = [];
    forestDecorations.mushrooms = [];
    forestDecorations.rocks = [];
    forestDecorations.fireflies = [];

    // Flowers.
    for (let i = 0; i < 100; i++) {
        forestDecorations.flowers.push({
            x: 100 + random() * 2400,
            y: 100 + random() * 1700,
            colour: [
                "#a30d25",
                "#d4af37",
                "#e32643",
                "#fff1b8"
            ][Math.floor(random() * 4)],
            size: 2 + Math.floor(random() * 2)
        });
    }

    // Glowing mushrooms.
    for (let i = 0; i < 28; i++) {
        forestDecorations.mushrooms.push({
            x: 100 + random() * 2400,
            y: 100 + random() * 1700,
            glow: random() * Math.PI * 2,
            colour: random() > 0.5 ? "#e32643" : "#d4af37"
        });
    }

    // Small forest rocks.
    for (let i = 0; i < 45; i++) {
        forestDecorations.rocks.push({
            x: 100 + random() * 2400,
            y: 100 + random() * 1700,
            size: 5 + random() * 7
        });
    }

    // Fireflies.
    for (let i = 0; i < 22; i++) {
        forestDecorations.fireflies.push({
            x: 100 + random() * 2400,
            y: 100 + random() * 1700,
            phase: random() * Math.PI * 2,
            speed: 0.5 + random()
        });
    }
}

// ==========================================
// DRAW FOREST DECORATIONS
// ==========================================

function drawForestDecorations(time) {

    // Rocks.
    forestDecorations.rocks.forEach(rock => {
        const x = Math.round(rock.x);
        const y = Math.round(rock.y);

        ctx.fillStyle = "#27313a";
        ctx.fillRect(x, y, rock.size, rock.size * 0.65);

        ctx.fillStyle = "#46505a";
        ctx.fillRect(x + 2, y + 1, rock.size * 0.4, 2);

        ctx.fillStyle = "#171f29";
        ctx.fillRect(x + 1, y + rock.size * 0.65, rock.size - 1, 2);
    });

    // Flowers.
    forestDecorations.flowers.forEach(flower => {
        const x = Math.round(flower.x);
        const y = Math.round(flower.y);
        const s = flower.size;

        // Stem.
        ctx.fillStyle = "#476b45";
        ctx.fillRect(x, y + s, 2, 5);

        // Petals.
        ctx.fillStyle = flower.colour;
        ctx.fillRect(x - s, y, s, s);
        ctx.fillRect(x + s, y, s, s);
        ctx.fillRect(x, y - s, s, s);
        ctx.fillRect(x, y + s, s, s);

        // Centre.
        ctx.fillStyle = "#ffe59a";
        ctx.fillRect(x, y, 2, 2);
    });

    // Mushrooms.
    forestDecorations.mushrooms.forEach(mushroom => {
        const x = Math.round(mushroom.x);
        const y = Math.round(mushroom.y);

        const pulse =
            0.5 + Math.sin(time * 0.002 + mushroom.glow) * 0.25;

        // Soft glow.
        ctx.save();
        ctx.globalAlpha = pulse * 0.25;
        ctx.fillStyle = mushroom.colour;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Stem.
        ctx.fillStyle = "#e4d6b9";
        ctx.fillRect(x - 2, y, 5, 8);

        // Cap.
        ctx.fillStyle = mushroom.colour;
        ctx.fillRect(x - 7, y - 4, 15, 5);
        ctx.fillRect(x - 4, y - 7, 9, 4);

        // Glowing spots.
        ctx.fillStyle = "#fff1b8";
        ctx.fillRect(x - 3, y - 4, 2, 2);
        ctx.fillRect(x + 3, y - 2, 2, 2);
    });

    // Fireflies.
    forestDecorations.fireflies.forEach(firefly => {
        const floatY =
            Math.sin(time * 0.001 * firefly.speed + firefly.phase) * 9;

        const x = Math.round(
            firefly.x +
            Math.sin(time * 0.0005 + firefly.phase) * 5
        );

        const y = Math.round(firefly.y + floatY);

        const glow =
            0.35 + (Math.sin(time * 0.003 + firefly.phase) + 1) * 0.3;

        ctx.save();

        ctx.globalAlpha = glow * 0.3;
        ctx.fillStyle = "#ffe59a";
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = glow;
        ctx.fillStyle = "#fff1b8";
        ctx.fillRect(x - 1, y - 1, 3, 3);

        ctx.restore();
    });
}

let seed = 12345;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}


function generateForest() {

    trees.length = 0;

    // These are woodland groves, not randomly scattered trees.
    const groves = [
        { x: 180,  y: 250,  rx: 210, ry: 170, count: 15 },
        { x: 850,  y: 230,  rx: 230, ry: 150, count: 17 },
        { x: 1450, y: 230,  rx: 230, ry: 160, count: 17 },
        { x: 2250, y: 300,  rx: 190, ry: 220, count: 16 },
        { x: 2350, y: 950,  rx: 170, ry: 250, count: 17 },
        { x: 2200, y: 1580, rx: 250, ry: 180, count: 18 },
        { x: 1450, y: 1690, rx: 260, ry: 150, count: 17 },
        { x: 650,  y: 1660, rx: 260, ry: 170, count: 17 },
        { x: 160,  y: 1250, rx: 140, ry: 280, count: 15 },
        { x: 1050, y: 1250, rx: 160, ry: 130, count: 10 }
    ];

    // Main trails and branches. Trees are kept away from these.
    const trails = [
        [[300,1200],[500,1050],[700,930],[850,900]],
        [[850,900],[1050,970],[1250,880],[1450,800],[1600,700]],
        [[1600,700],[1720,610],[1840,650]],
        [[500,1050],[500,930],[500,840]],
        [[500,1050],[600,1190]],
        [[1250,880],[1250,1050],[1100,1250]],
        [[1840,650],[2050,620],[2200,750]],
        [[1840,650],[1950,850],[2050,1050]]
    ];

    function distanceToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        const length = dx * dx + dy * dy;

        let t = length === 0 ? 0 :
            ((px - ax) * dx + (py - ay) * dy) / length;

        t = Math.max(0, Math.min(1, t));

        const nearestX = ax + t * dx;
        const nearestY = ay + t * dy;

        return Math.hypot(px - nearestX, py - nearestY);
    }

    function tooCloseToTrail(x, y) {
        for (const trail of trails) {
            for (let i = 0; i < trail.length - 1; i++) {
                const a = trail[i];
                const b = trail[i + 1];

                if (
                    distanceToSegment(x, y, a[0], a[1], b[0], b[1]) < 125
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    const landmarks = [
        { x: 500, y: 1050, r: 170 },
        { x: 850, y: 900, r: 145 },
        { x: 1840, y: 650, r: 205 },
        { x: 600, y: 1190, r: 100 },
        { x: 1250, y: 880, r: 100 },
        { x: 1600, y: 700, r: 115 },
        { x: 500, y: 840, r: 130 }
    ];

    function tooCloseToLandmark(x, y) {
        return landmarks.some(point =>
            Math.hypot(x - point.x, y - point.y) < point.r
        );
    }

    // Fill each grove with irregularly spaced trees.
    groves.forEach(grove => {

        let placed = 0;
        let attempts = 0;

        while (placed < grove.count && attempts < grove.count * 12) {
            attempts++;

            const angle = random() * Math.PI * 2;
            const spread = Math.sqrt(random());

            const x = grove.x +
                Math.cos(angle) * grove.rx * spread;

            const y = grove.y +
                Math.sin(angle) * grove.ry * spread;

            if (
                x < 70 || x > WORLD.width - 70 ||
                y < 70 || y > WORLD.height - 70 ||
                tooCloseToTrail(x, y) ||
                tooCloseToLandmark(x, y)
            ) {
                continue;
            }

            trees.push({
                x,
                y,
                size: 43 + random() * 35,
                shade: random()
            });

            placed++;
        }
    });

    // A few ancient trees at the outer edges.
    const ancientTrees = [
        [75, 500], [2500, 500], [2500, 1450],
        [400, 1800], [1100, 1820], [1800, 1820],
        [2520, 180], [80, 1650]
    ];

    ancientTrees.forEach(([x, y]) => {
        trees.push({
            x,
            y,
            size: 85 + random() * 25,
            shade: random()
        });
    });
}


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

    currentArea = "forest";
    WORLD.width = FOREST_SIZE.width;
    WORLD.height = FOREST_SIZE.height;
    player.x = 500;
    player.y = 1050;
    document.getElementById("locationName").textContent = "The Enchanted Forest";

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

    if (currentArea === "forest") {
        for (const tree of trees) {
            const distance = Math.hypot(
                x - tree.x,
                y - (tree.y + tree.size * 0.2)
            );

            if (distance < tree.size * 0.43 + 13) return true;
        }
        return false;
    }

    for (const pillar of observatoryPillars) {
        if (Math.hypot(x - pillar.x, y - pillar.y) < pillar.r + 14) {
            return true;
        }
    }

    // The outer walls and central architecture remain solid.
    if (x < 85 || y < 85 || x > WORLD.width - 85 || y > WORLD.height - 85) {
        return true;
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



function drawForestGround() {

    // Deep midnight-green forest floor.
    const ground = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
    ground.addColorStop(0, "#172b25");
    ground.addColorStop(0.5, "#10251f");
    ground.addColorStop(1, "#091b1a");

    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Organic patches of moss and woodland colour.
    for (let i = 0; i < 95; i++) {
        const x = (i * 283 + 120) % WORLD.width;
        const y = (i * 197 + 80) % WORLD.height;
        const radius = 35 + (i % 6) * 13;

        const moss = ctx.createRadialGradient(
            x, y, 2, x, y, radius
        );

        moss.addColorStop(0, "rgba(92,126,75,0.13)");
        moss.addColorStop(1, "rgba(65,105,70,0)");

        ctx.fillStyle = moss;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fine ground texture.
    for (let i = 0; i < 1400; i++) {
        const x = (i * 173) % WORLD.width;
        const y = (i * 291) % WORLD.height;

        ctx.fillStyle = i % 3 === 0
            ? "rgba(180,170,115,0.055)"
            : "rgba(0,0,0,0.09)";

        ctx.fillRect(x, y, 2 + (i % 4), 2 + (i % 3));
    }

    // Each path is drawn in several layers to give it depth.
    function drawTrail(drawShape, width, colour) {
        ctx.beginPath();
        drawShape();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = colour;
        ctx.stroke();
    }

    function layeredTrail(drawShape, width) {
        drawTrail(
            drawShape,
            width + 24,
            "rgba(3,9,12,0.38)"
        );

        drawTrail(
            drawShape,
            width,
            "#302b27"
        );

        drawTrail(
            drawShape,
            width - 15,
            "#463a30"
        );

        drawTrail(
            drawShape,
            width - 38,
            "rgba(151,112,72,0.16)"
        );

        drawTrail(
            drawShape,
            2,
            "rgba(221,183,119,0.13)"
        );
    }

    // Main trail: starting clearing to the lantern and memory trail.
    layeredTrail(() => {
        ctx.moveTo(300, 1200);
        ctx.bezierCurveTo(420, 1130, 470, 1000, 650, 940);
        ctx.bezierCurveTo(730, 910, 790, 900, 850, 900);
        ctx.bezierCurveTo(1030, 900, 1080, 1000, 1250, 880);
        ctx.bezierCurveTo(1390, 790, 1480, 720, 1600, 700);
        ctx.bezierCurveTo(1700, 680, 1760, 640, 1840, 650);
    }, 112);

    // Branch to the first moon fragment.
    layeredTrail(() => {
        ctx.moveTo(520, 1030);
        ctx.bezierCurveTo(560, 1080, 570, 1130, 600, 1190);
    }, 76);

    // Branch towards the sealed observatory.
    layeredTrail(() => {
        ctx.moveTo(500, 1050);
        ctx.bezierCurveTo(455, 990, 470, 900, 500, 840);
    }, 82);

    // A quieter trail leading deeper into the woods.
    layeredTrail(() => {
        ctx.moveTo(1250, 880);
        ctx.bezierCurveTo(1300, 1000, 1190, 1120, 1100, 1250);
        ctx.bezierCurveTo(1040, 1340, 1050, 1430, 1120, 1500);
    }, 66);

    // Pond-side trail, making the water feel like a destination.
    layeredTrail(() => {
        ctx.moveTo(1840, 650);
        ctx.bezierCurveTo(1970, 610, 2070, 650, 2180, 750);
        ctx.bezierCurveTo(2240, 810, 2250, 900, 2210, 980);
    }, 70);

    // Small stones scattered along the trails.
    for (let i = 0; i < 90; i++) {
        const x = (i * 137 + 80) % WORLD.width;
        const y = (i * 223 + 160) % WORLD.height;

        if (i % 2 === 0) {
            ctx.fillStyle = "rgba(173,151,119,0.18)";
        } else {
            ctx.fillStyle = "rgba(0,0,0,0.17)";
        }

        ctx.beginPath();
        ctx.ellipse(
            x, y,
            3 + (i % 5),
            2 + (i % 3),
            i * 0.4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Lantern's warm clearing.
    function addLight(x, y, radius, colour) {
        const light = ctx.createRadialGradient(
            x, y, 0,
            x, y, radius
        );

        light.addColorStop(0, colour);
        light.addColorStop(1, "rgba(255,220,130,0)");

        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    addLight(850, 900, 260, "rgba(255,174,65,0.18)");

    // A cool moonlit sanctuary around the pond.
    addLight(1840, 650, 340, "rgba(100,155,230,0.20)");

    // A little golden light around the observatory entrance.
    addLight(500, 840, 190, "rgba(212,175,55,0.12)");

    // Atmospheric darkness around the edges.
    const atmosphere = ctx.createRadialGradient(
        1300, 950, 300,
        1300, 950, 1550
    );

    atmosphere.addColorStop(0, "rgba(4,12,28,0.01)");
    atmosphere.addColorStop(1, "rgba(2,5,17,0.42)");

    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
}


// Select the correct ground renderer for the active area.
function drawGround() {
    if (currentArea === "forest") drawForestGround();
    else drawObservatoryGround();
}

function drawObservatoryGround() {
    const w = WORLD.width;
    const h = WORLD.height;

    ctx.fillStyle = "#071426";
    ctx.fillRect(0, 0, w, h);

    // Deep-blue stone floor and subtle tilework.
    for (let x = 90; x < w - 80; x += 90) {
        for (let y = 90; y < h - 80; y += 90) {
            ctx.fillStyle = ((x + y) / 90) % 2 === 0
                ? "rgba(70,105,145,0.075)"
                : "rgba(3,10,24,0.12)";
            ctx.fillRect(x, y, 86, 86);
            ctx.strokeStyle = "rgba(212,175,55,0.045)";
            ctx.strokeRect(x, y, 86, 86);
        }
    }

    // Star map etched into the floor.
    ctx.save();
    ctx.translate(1100, 800);
    [180, 260, 360].forEach((radius, index) => {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = index === 1
            ? "rgba(212,175,55,0.28)"
            : "rgba(130,170,220,0.16)";
        ctx.lineWidth = index === 1 ? 3 : 1.5;
        ctx.stroke();
    });

    for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        const x = Math.cos(angle) * 310;
        const y = Math.sin(angle) * 310;
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.restore();

    // Broad approach path from the forest entrance.
    ctx.beginPath();
    ctx.moveTo(260, 1350);
    ctx.bezierCurveTo(430, 1300, 500, 1180, 700, 1120);
    ctx.bezierCurveTo(850, 1080, 900, 950, 1100, 800);
    ctx.strokeStyle = "#243b55";
    ctx.lineWidth = 120;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.strokeStyle = "rgba(212,175,55,0.12)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central observatory platform.
    const platform = ctx.createRadialGradient(1100, 800, 40, 1100, 800, 430);
    platform.addColorStop(0, "#24364d");
    platform.addColorStop(0.72, "#14263d");
    platform.addColorStop(1, "rgba(7,20,38,0)");
    ctx.fillStyle = platform;
    ctx.beginPath();
    ctx.arc(1100, 800, 430, 0, Math.PI * 2);
    ctx.fill();

    // Atmospheric glows.
    const glow = ctx.createRadialGradient(1100, 800, 10, 1100, 800, 700);
    glow.addColorStop(0, "rgba(70,115,190,0.16)");
    glow.addColorStop(1, "rgba(70,115,190,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(350, 100, 1500, 1400);

    // Distant stars in the ceiling/sky.
    for (let i = 0; i < 130; i++) {
        const x = (i * 197 + 71) % (w - 160) + 80;
        const y = (i * 113 + 43) % (h - 160) + 80;
        ctx.globalAlpha = 0.25 + ((i * 7) % 60) / 100;
        ctx.fillStyle = i % 5 === 0 ? "#ffe59a" : "#a9c9f4";
        ctx.fillRect(x, y, i % 9 === 0 ? 3 : 2, i % 9 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;

    // Observatory pillars.
    observatoryPillars.forEach(p => {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(p.x + 8, p.y + 12, p.r + 8, p.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#52647a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(212,175,55,0.55)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#d4af37";
        ctx.fillRect(p.x - 5, p.y - p.r + 9, 10, 4);
    });

    // Soft dark vignette.
    const vignette = ctx.createRadialGradient(1100, 800, 300, 1100, 800, 1450);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
}

function drawForestGate(time) {
    const x = 500;
    const y = 840;
    const pulse = 0.5 + Math.sin(time * 0.002) * 0.5;

    ctx.save();
    ctx.translate(x, y);

    ctx.globalAlpha = 0.25 + pulse * 0.12;
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(0, -45, 105, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#8e6b31";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(0, -35, 58, Math.PI, 0);
    ctx.lineTo(58, 30);
    ctx.stroke();

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -35, 58, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = "#10213a";
    ctx.fillRect(-48, -36, 96, 66);
    ctx.fillStyle = `rgba(115,160,230,${0.24 + pulse * 0.22})`;
    ctx.fillRect(-39, -28, 78, 56);

    ctx.fillStyle = "#fff1b8";
    ctx.font = "22px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("✦", 0, -2);
    ctx.restore();
}

function drawObservatoryObjects(time) {
    observatoryObjects.forEach(object => {
        const { x, y, id } = object;
        const pulse = 0.75 + Math.sin(time * 0.003 + x) * 0.25;

        if (id.startsWith("star-fragment")) {
            if (object.discovered) return;
            ctx.save();
            ctx.globalAlpha = pulse * 0.35;
            const glow = ctx.createRadialGradient(x, y, 2, x, y, 48);
            glow.addColorStop(0, "#fff1b8");
            glow.addColorStop(1, "rgba(212,175,55,0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#d4af37";
            ctx.beginPath();
            ctx.moveTo(x, y - 18);
            ctx.lineTo(x + 10, y);
            ctx.lineTo(x, y + 18);
            ctx.lineTo(x - 10, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff1b8";
            ctx.fillRect(x - 2, y - 9, 4, 18);
            ctx.restore();
        } else if (id === "observatory-telescope") {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.42);
            ctx.fillStyle = "#7c5428";
            ctx.fillRect(-12, -65, 24, 130);
            ctx.fillStyle = "#d4af37";
            ctx.fillRect(-17, -67, 34, 12);
            ctx.fillRect(-17, 52, 34, 12);
            ctx.strokeStyle = "#a8b9cf";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 62);
            ctx.lineTo(-45, 115);
            ctx.moveTo(0, 62);
            ctx.lineTo(45, 115);
            ctx.moveTo(0, 62);
            ctx.lineTo(0, 125);
            ctx.stroke();
            ctx.restore();
        } else if (id === "observatory-console") {
            ctx.save();
            ctx.fillStyle = "#263b55";
            ctx.beginPath();
            ctx.arc(x, y, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = "#fff1b8";
            ctx.font = "34px Georgia";
            ctx.textAlign = "center";
            ctx.fillText("✦", x, y + 12);
            ctx.restore();
        } else if (id === "observatory-chamber" && observatoryQuest.puzzleSolved) {
            ctx.save();
            ctx.globalAlpha = 0.25 + pulse * 0.25;
            ctx.fillStyle = "#d4af37";
            ctx.beginPath();
            ctx.arc(x, y, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(x, y, 62, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "#fff1b8";
            ctx.font = "36px Georgia";
            ctx.textAlign = "center";
            ctx.fillText("✧", x, y + 12);
            ctx.restore();
        } else if (id === "observatory-return") {
            ctx.save();
            ctx.globalAlpha = 0.7 + pulse * 0.2;
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x, y, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "#fff1b8";
            ctx.font = "32px Georgia";
            ctx.textAlign = "center";
            ctx.fillText("↶", x, y + 11);
            ctx.restore();
        }
    });
}

function switchArea(area) {
    if (area === currentArea) return;

    if (area === "observatory") {
        forestReturnPosition = { x: player.x, y: player.y };
        currentArea = "observatory";
        WORLD.width = OBSERVATORY_SIZE.width;
        WORLD.height = OBSERVATORY_SIZE.height;
        player.x = 260;
        player.y = 1350;
        player.direction = "up";
        document.getElementById("locationName").textContent = "The Observatory";
        showMessage(
            "AREA 02 — THE OBSERVATORY",
            "Where the Stars Remember",
            "Beyond the forest stands an ancient observatory. Its telescope is still pointed towards the heavens, and three pieces of a constellation have fallen somewhere inside."
        );
    } else {
        currentArea = "forest";
        WORLD.width = FOREST_SIZE.width;
        WORLD.height = FOREST_SIZE.height;
        player.x = forestReturnPosition.x;
        player.y = forestReturnPosition.y + 100;
        player.direction = "down";
        document.getElementById("locationName").textContent = "The Enchanted Forest";
        showMessage(
            "THE ENCHANTED FOREST",
            "Back where the journey began",
            "The forest is still here, and everything you discovered remains yours. The Observatory will be waiting whenever you return."
        );
    }

    camera.x = 0;
    camera.y = 0;
    updateGameSystemsUI();
}


function drawTree(tree) {
    const { x, y, size, shade } = tree;

    ctx.save();
    ctx.translate(x, y);

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(5, 12, size * 0.9, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Exposed roots
    ctx.strokeStyle = "#30251f";
    ctx.lineWidth = Math.max(5, size * 0.12);
    ctx.lineCap = "round";

    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, size * 0.25);
        ctx.quadraticCurveTo(
            i * size * 0.2,
            size * 0.55,
            i * size * 0.62,
            size * 0.45
        );
        ctx.stroke();
    }

    // Main trunk
    const trunk = ctx.createLinearGradient(
        -size * 0.2, 0, size * 0.2, 0
    );

    trunk.addColorStop(0, "#251b1b");
    trunk.addColorStop(0.45, "#62402d");
    trunk.addColorStop(1, "#241b1a");

    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(-size * 0.18, size * 0.35);
    ctx.lineTo(-size * 0.12, -size * 0.45);
    ctx.lineTo(size * 0.12, -size * 0.45);
    ctx.lineTo(size * 0.2, size * 0.35);
    ctx.closePath();
    ctx.fill();

    // Branches
    ctx.strokeStyle = "#493027";
    ctx.lineWidth = size * 0.11;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.12);
    ctx.lineTo(-size * 0.48, -size * 0.65);
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(size * 0.46, -size * 0.7);
    ctx.stroke();

    // Layered canopy
    const colours = shade > 0.5
        ? ["#294c38", "#356247", "#477553", "#203e32"]
        : ["#203e32", "#2d523c", "#3b6547", "#19352c"];

    const clusters = [
        [-0.38, -0.48, 0.53],
        [0.35, -0.48, 0.55],
        [0, -0.8, 0.59],
        [-0.18, -0.18, 0.48],
        [0.28, -0.16, 0.47],
        [0, -0.48, 0.68]
    ];

    // Main canopy shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.42, size * 0.86, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    clusters.forEach((cluster, i) => {
        const [cx, cy, scale] = cluster;
        const r = size * scale;

        const gradient = ctx.createRadialGradient(
            cx * size - r * 0.3,
            cy * size - r * 0.4,
            2,
            cx * size,
            cy * size,
            r
        );

        gradient.addColorStop(0, colours[2]);
        gradient.addColorStop(0.55, colours[i % 2]);
        gradient.addColorStop(1, colours[3]);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            cx * size,
            cy * size,
            r * 0.92,
            r * 0.72,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Individual leaf highlights
    for (let i = 0; i < 13; i++) {
        const angle = i * 2.4;
        const radius = size * (0.15 + (i % 4) * 0.12);

        const lx = Math.cos(angle) * radius;
        const ly = -size * 0.48 + Math.sin(angle) * radius * 0.62;

        ctx.fillStyle = i % 3 === 0
            ? "rgba(212,175,55,0.38)"
            : "rgba(132,174,112,0.22)";

        ctx.beginPath();
        ctx.ellipse(
            lx, ly,
            size * 0.065,
            size * 0.035,
            angle,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Subtle rim lighting
    ctx.strokeStyle = "rgba(166,193,130,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
        0, -size * 0.43,
        size * 0.72,
        size * 0.55,
        0, Math.PI, Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();
}

// ============================================
// DRAW MOONLIT POND
// ============================================


function drawPond(time) {
    const x = 1840;
    const y = 650;
    const pulse = Math.sin(time * 0.0012);

    ctx.save();

    // Wide moonlit atmosphere around the pond.
    const atmosphere = ctx.createRadialGradient(x, y, 25, x, y, 310);
    atmosphere.addColorStop(0, "rgba(67,112,155,0.22)");
    atmosphere.addColorStop(0.55, "rgba(40,76,112,0.10)");
    atmosphere.addColorStop(1, "rgba(20,40,65,0)");

    ctx.fillStyle = atmosphere;
    ctx.beginPath();
    ctx.arc(x, y, 310, 0, Math.PI * 2);
    ctx.fill();

    // Shoreline shadow.
    ctx.fillStyle = "#091a25";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 173, 116, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Outer shoreline.
    const shore = ctx.createRadialGradient(x - 25, y - 35, 15, x, y, 175);
    shore.addColorStop(0, "#345044");
    shore.addColorStop(0.72, "#263e39");
    shore.addColorStop(1, "#142b30");

    ctx.fillStyle = shore;
    ctx.beginPath();
    ctx.ellipse(x, y, 163, 105, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Deep water.
    const water = ctx.createLinearGradient(x - 100, y - 80, x + 100, y + 90);
    water.addColorStop(0, "#294d69");
    water.addColorStop(0.45, "#142f4b");
    water.addColorStop(1, "#081c32");

    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 139, 84, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Moon reflection.
    const reflection = ctx.createRadialGradient(
        x - 15, y - 30, 2,
        x - 15, y - 30, 95
    );
    reflection.addColorStop(0, "rgba(255,239,190,0.42)");
    reflection.addColorStop(0.35, "rgba(212,175,55,0.17)");
    reflection.addColorStop(1, "rgba(212,175,55,0)");

    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.ellipse(x - 15, y - 25, 85, 58, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Moving moonlight ripples.
    for (let i = 0; i < 9; i++) {
        const wave = (time * 0.018 + i * 19) % 125;
        const alpha = 0.08 + (i % 3) * 0.035;

        ctx.strokeStyle = `rgba(255,226,151,${alpha})`;
        ctx.lineWidth = i % 3 === 0 ? 2 : 1;

        ctx.beginPath();
        ctx.ellipse(
            x - 18 + Math.sin(time * 0.0005 + i) * 12,
            y - 28 + wave - 62,
            23 + i * 5,
            3 + i * 0.5,
            -0.12,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    // Lily pads.
    const lilyPads = [
        [-82, -24, 17],
        [70, 24, 14],
        [37, -48, 11],
        [-48, 43, 12]
    ];

    lilyPads.forEach((pad, i) => {
        const px = x + pad[0] + Math.sin(time * 0.001 + i) * 2;
        const py = y + pad[1] + Math.cos(time * 0.0012 + i) * 2;

        ctx.fillStyle = "#173e36";
        ctx.beginPath();
        ctx.arc(px, py, pad[2], 0.2, Math.PI * 2);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(125,166,112,0.55)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = "rgba(174,193,123,0.4)";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pad[2] * 0.7, py - pad[2] * 0.45);
        ctx.stroke();
    });

    // Small flowers floating on the water.
    for (let i = 0; i < 3; i++) {
        const fx = x + [-28, 87, -100][i];
        const fy = y + [35, -30, 8][i];

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(time * 0.00025 + i);

        for (let p = 0; p < 5; p++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.fillStyle = "rgba(255,225,174,0.85)";
            ctx.beginPath();
            ctx.ellipse(0, -5, 3, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Glowing floating fireflies above the water.
    for (let i = 0; i < 7; i++) {
        const angle = time * 0.00035 + i * 0.9;
        const fx = x + Math.cos(angle) * (155 + (i % 3) * 12);
        const fy = y + Math.sin(angle * 1.4) * (85 + (i % 2) * 15);
        const glowSize = 3 + Math.sin(time * 0.004 + i) * 1.5;

        const fireflyGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 17);
        fireflyGlow.addColorStop(0, "rgba(255,224,135,0.65)");
        fireflyGlow.addColorStop(1, "rgba(255,224,135,0)");

        ctx.fillStyle = fireflyGlow;
        ctx.beginPath();
        ctx.arc(fx, fy, 17, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffe6a0";
        ctx.beginPath();
        ctx.arc(fx, fy, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Stones around the shore.
    const stones = [
        [-145, -5, 8], [-112, 76, 6], [116, 72, 9],
        [151, 4, 7], [91, -88, 6], [-68, -94, 7]
    ];

    stones.forEach((stone, i) => {
        ctx.fillStyle = i % 2 === 0 ? "#65736a" : "#455d59";
        ctx.beginPath();
        ctx.ellipse(
            x + stone[0],
            y + stone[1],
            stone[2],
            stone[2] * 0.65,
            0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Soft golden rim.
    ctx.strokeStyle = `rgba(212,175,55,${0.35 + pulse * 0.08})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 163, 105, -0.12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}



// ============================================
// DRAW THE LANTERN
// ============================================


function drawLantern(time) {
    const object = objects[0];
    if (object.discovered) return;

    const pulse = Math.sin(time * 0.003);
    const flicker = Math.sin(time * 0.018) * 2;

    ctx.save();
    ctx.translate(object.x, object.y);

    // Large golden pool of light.
    const groundGlow = ctx.createRadialGradient(0, 10, 5, 0, 10, 145);
    groundGlow.addColorStop(0, "rgba(255,190,75,0.22)");
    groundGlow.addColorStop(0.5, "rgba(212,145,45,0.10)");
    groundGlow.addColorStop(1, "rgba(212,145,45,0)");

    ctx.fillStyle = groundGlow;
    ctx.beginPath();
    ctx.ellipse(0, 12, 145, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating aura.
    const aura = ctx.createRadialGradient(0, -20, 3, 0, -20, 105 + pulse * 8);
    aura.addColorStop(0, "rgba(255,224,145,0.32)");
    aura.addColorStop(0.4, "rgba(255,190,75,0.12)");
    aura.addColorStop(1, "rgba(255,190,75,0)");

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -20, 105 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();

    // Shadow.
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hanging hook.
    ctx.strokeStyle = "#684b2d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -47);
    ctx.quadraticCurveTo(0, -64, 11, -64);
    ctx.quadraticCurveTo(22, -64, 19, -52);
    ctx.stroke();

    // Top cap.
    ctx.fillStyle = "#503820";
    ctx.beginPath();
    ctx.moveTo(-17, -37);
    ctx.lineTo(17, -37);
    ctx.lineTo(12, -27);
    ctx.lineTo(-12, -27);
    ctx.closePath();
    ctx.fill();

    // Metal frame.
    ctx.strokeStyle = "#b28a43";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -30);
    ctx.lineTo(-19, 15);
    ctx.lineTo(-13, 25);
    ctx.lineTo(13, 25);
    ctx.lineTo(19, 15);
    ctx.lineTo(14, -30);
    ctx.stroke();

    // Glass chamber.
    const glass = ctx.createLinearGradient(-15, 0, 15, 0);
    glass.addColorStop(0, "rgba(255,172,62,0.18)");
    glass.addColorStop(0.5, "rgba(255,229,150,0.75)");
    glass.addColorStop(1, "rgba(255,172,62,0.18)");

    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-13, -27);
    ctx.lineTo(13, -27);
    ctx.lineTo(16, 13);
    ctx.lineTo(-16, 13);
    ctx.closePath();
    ctx.fill();

    // Inner flame.
    ctx.fillStyle = "#ff9f36";
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.bezierCurveTo(-13, 0, -5, -13, 1, -23 + flicker);
    ctx.bezierCurveTo(3, -12, 15, -4, 0, 11);
    ctx.fill();

    ctx.fillStyle = "#fff2b8";
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-6, 0, -2, -9, 2, -15 + flicker * 0.5);
    ctx.bezierCurveTo(5, -7, 8, 1, 0, 7);
    ctx.fill();

    // Bottom cap.
    ctx.fillStyle = "#684a2b";
    ctx.beginPath();
    ctx.moveTo(-17, 20);
    ctx.lineTo(17, 20);
    ctx.lineTo(12, 30);
    ctx.lineTo(-12, 30);
    ctx.closePath();
    ctx.fill();

    // Gold details.
    ctx.strokeStyle = "#e2bd69";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -30);
    ctx.lineTo(14, -30);
    ctx.moveTo(-15, 17);
    ctx.lineTo(15, 17);
    ctx.stroke();

    // Tiny sparks.
    for (let i = 0; i < 5; i++) {
        const angle = time * 0.001 + i * 1.25;
        const sx = Math.cos(angle) * (27 + i * 3);
        const sy = -12 + Math.sin(angle * 1.4) * 28;

        ctx.globalAlpha = 0.4 + (Math.sin(time * 0.004 + i) + 1) * 0.3;
        ctx.fillStyle = "#ffe6a0";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

// ============================================
// DRAW PLAYER
// ============================================

function drawPlayer(time) {
    ctx.save();

    // Pixel-art drawing: keep all shapes aligned to a pixel grid.
    const pixel = (x, y, w, h, colour) => {
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, w, h);
    };

    ctx.translate(
        Math.round(player.x),
        Math.round(player.y)
    );

    const walking = player.moving;
    const frame = walking ? Math.floor(time / 150) % 2 : 0;
    const bob = walking ? (frame === 0 ? -1 : 1) : 0;

    const dark = "#24151b";
    const hair = "#38202a";
    const skin = "#e9b995";
    const skinShadow = "#c98e77";
    const crimson = "#a30d25";
    const brightCrimson = "#e32643";
    const deepCrimson = "#650b1b";
    const gold = "#d4af37";
    const brightGold = "#ffe59a";
    const boots = "#261a25";

    // Ground shadow.
    ctx.globalAlpha = 0.4;
    pixel(-12, 17, 24, 5, "#000000");
    pixel(-8, 22, 16, 2, "#000000");
    ctx.globalAlpha = 1;

    ctx.translate(0, bob);

    // Feet: alternate while walking.
    if (frame === 0) {
        pixel(-8, 16, 6, 7, boots);
        pixel(3, 17, 6, 6, boots);
    } else {
        pixel(-8, 17, 6, 6, boots);
        pixel(3, 16, 6, 7, boots);
    }

    // Cloak silhouette.
    pixel(-11, -2, 22, 19, deepCrimson);
    pixel(-13, 1, 26, 12, crimson);
    pixel(-10, 13, 20, 7, crimson);
    pixel(-7, 18, 14, 3, deepCrimson);

    // Cloak highlights.
    pixel(-8, 1, 5, 13, brightCrimson);
    pixel(-3, 3, 3, 10, "#c71937");
    pixel(5, 2, 4, 11, "#7f1027");

    // Arms.
    pixel(-15, 1, 4, 10, skinShadow);
    pixel(-14, 3, 3, 7, skin);
    pixel(11, 1, 4, 10, skinShadow);
    pixel(11, 3, 3, 7, skin);

    // Gold cloak clasp.
    pixel(-3, 0, 6, 4, gold);
    pixel(-2, 1, 4, 2, brightGold);

    // Cloak emblem.
    pixel(-2, 9, 4, 2, gold);
    pixel(-1, 8, 2, 4, brightGold);

    // Head and hair, adjusted for direction.
    if (player.direction === "up") {

        // Back of head.
        pixel(-7, -15, 14, 14, skinShadow);
        pixel(-9, -17, 18, 12, dark);
        pixel(-7, -18, 14, 5, hair);
        pixel(-10, -13, 3, 12, dark);
        pixel(7, -13, 3, 12, dark);

        // Hair detail.
        pixel(-5, -7, 10, 4, hair);

    } else {

        // Face.
        pixel(-7, -15, 14, 14, skin);
        pixel(-5, -3, 10, 2, skinShadow);

        // Hair.
        pixel(-9, -18, 18, 7, dark);
        pixel(-8, -16, 4, 11, dark);
        pixel(4, -16, 4, 11, dark);
        pixel(-5, -19, 10, 3, hair);

        if (player.direction === "left") {
            pixel(-10, -13, 4, 8, dark);
            pixel(-6, -11, 3, 2, "#fff1b8");
        } else if (player.direction === "right") {
            pixel(6, -13, 4, 8, dark);
            pixel(3, -11, 3, 2, "#fff1b8");
        } else {
            // Eyes when facing down.
            pixel(-5, -9, 2, 2, dark);
            pixel(3, -9, 2, 2, dark);
            pixel(-2, -3, 4, 1, skinShadow);
        }

        // Gold hair ornament.
        pixel(5, -19, 4, 3, gold);
        pixel(6, -20, 2, 2, brightGold);
    }

    // Tiny gold details on the cloak.
    pixel(-11, 5, 2, 3, gold);
    pixel(9, 5, 2, 3, gold);

    ctx.restore();
}

// ============================================
// INTERACTION DETECTION
// ============================================

function findNearbyObject() {
    let closest = null;
    let closestDistance = Infinity;

    const availableObjects = currentArea === "forest"
        ? objects
        : observatoryObjects;

    for (const object of availableObjects) {
        if (object.discovered) continue;
        if (object.id === "observatory-chamber" && !observatoryQuest.puzzleSolved) continue;

        const distance = Math.hypot(
            player.x - object.x,
            player.y - object.y
        );

        if (distance < object.radius && distance < closestDistance) {
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

    if (currentArea === "forest") {
        if (object.id === "observatory-gate") {
            if (!gameQuest.completed) {
                showMessage(
                    "A SEALED WAY",
                    "The Observatory is asleep",
                    "The arch is cold. The Moonlit Memory may be the key to waking it. Finish the forest's lost-memory quest first."
                );
                return;
            }

            switchArea("observatory");
            return;
        }

        if (object.id === "lantern") {
            object.discovered = true;
            discoveries++;
            gameQuest.lanternFound = true;
            updateDiscoveryCounter();
            checkForestQuest();
            showMessage(
                "DISCOVERY 01",
                "The Forgotten Lantern",
                "A little light can change the way an entire world looks. Perhaps this one was waiting for you."
            );
        } else if (object.id === "pond") {
            object.discovered = true;
            discoveries++;
            gameQuest.pondFound = true;
            updateDiscoveryCounter();
            const completed = checkForestQuest();
            showMessage(
                completed ? "QUEST COMPLETE" : "THE MOONLIT POND",
                completed ? "The Moonlit Memory" : "Something beneath the water...",
                completed
                    ? "The lantern, the fragments and the pond have revealed something beautiful. You have recovered the Moonlit Memory."
                    : "The water remembers things the world has forgotten. Three fragments are scattered throughout this forest. Find them, and perhaps the pond will reveal its secret."
            );
        } else if (memoryFragmentNames[object.id]) {
            object.discovered = true;
            discoveries++;
            gameQuest.fragmentsFound++;
            const itemName = memoryFragmentNames[object.id];
            gameInventory.push(itemName);
            updateDiscoveryCounter();
            const completed = checkForestQuest();
            showMessage(
                "MEMORY FRAGMENT " + gameQuest.fragmentsFound + " / 3",
                completed ? "The Last Piece" : itemName,
                completed
                    ? "Every fragment has been found. Your discoveries have unlocked the Moonlit Memory. The forest has another secret to share."
                    : "A tiny piece of something beautiful. It seems this forest has been holding onto memories."
            );
        }
        return;
    }

    // Observatory interactions.
    if (object.id === "observatory-return") {
        switchArea("forest");
    } else if (object.id.startsWith("star-fragment")) {
        object.discovered = true;
        discoveries++;
        observatoryQuest.fragmentsFound++;
        const fragmentName = "Celestial Fragment " + observatoryQuest.fragmentsFound;
        gameInventory.push(fragmentName);
        updateDiscoveryCounter();
        updateGameSystemsUI();
        showMessage(
            "OBSERVATORY DISCOVERY " + observatoryQuest.fragmentsFound + " / 3",
            "A Piece of the Constellation",
            "A star has fallen from its place in the sky. Its light feels strangely familiar. Find all three fragments, then take them to the constellation console."
        );
    } else if (object.id === "observatory-telescope") {
        object.discovered = true;
        observatoryQuest.telescopeRead = true;
        updateGameSystemsUI();
        showMessage(
            "THE ASTRONOMER'S TELESCOPE",
            "Three lights. One pattern.",
            "Through the telescope, three constellations become clear: the Moon, the Star, and the Heart. The console below appears to follow that exact order."
        );
    } else if (object.id === "observatory-console") {
        if (observatoryQuest.fragmentsFound < 3) {
            showMessage(
                "THE CONSTELLATION CONSOLE",
                "The pattern is incomplete",
                "The console has three empty places. Find all three celestial fragments before trying to restore the constellation."
            );
        } else {
            openConstellationPuzzle();
        }
    } else if (object.id === "observatory-chamber") {
        object.discovered = true;
        observatoryQuest.chamberEntered = true;
        discoveries++;
        gameInventory.push("The Observatory's Secret");
        updateDiscoveryCounter();
        updateGameSystemsUI();
        showMessage(
            "SECRET DISCOVERY",
            "The Celestial Chamber",
            "Behind the constellation is a quiet room filled with the light of a thousand distant stars. At its centre rests a message: even the smallest light can become someone's entire universe."
        );
    }
}

function openConstellationPuzzle() {
    let panel = document.getElementById("constellationPuzzle");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "constellationPuzzle";
        panel.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: rgba(2,5,11,0.94);
            color: #fff1b8;
            font-family: Georgia, serif;
            text-align: center;
            padding: 24px;
        `;

        panel.innerHTML = `
            <div style="max-width:420px;width:100%">
                <h2 style="color:#d4af37">THE CONSTELLATION</h2>
                <p>Restore the three lights in their correct order.</p>
                <div style="display:flex;justify-content:center;gap:14px;margin:28px 0">
                    <button data-star="moon">☾</button>
                    <button data-star="star">✦</button>
                    <button data-star="heart">♥</button>
                </div>
                <p id="constellationStatus">Choose the first symbol.</p>
                <button id="constellationClose" style="
                    padding:12px 30px;
                    margin-top:20px;
                    background:#8e142d;
                    color:#fff1b8;
                    border:1px solid #d4af37;
                    cursor:pointer">
                    CLOSE
                </button>
            </div>
        `;
        document.getElementById("game").appendChild(panel);

        panel.querySelectorAll("[data-star]").forEach(button => {
            button.style.cssText += `
                width:72px;height:68px;border:1px solid #d4af37;
                background:#14263d;color:#fff1b8;cursor:pointer;border-radius:8px;
            `;
            button.addEventListener("click", () => chooseConstellationSymbol(button.dataset.star));
        });

        panel.querySelector("#constellationClose").addEventListener("click", () => {
            panel.style.display = "none";
        });
    }

    panel.dataset.progress = "0";
    panel.querySelector("#constellationStatus").textContent = "Choose the first symbol.";
    panel.style.display = "flex";
}

function chooseConstellationSymbol(symbol) {
    const panel = document.getElementById("constellationPuzzle");
    if (!panel || panel.style.display === "none") return;

    let progress = Number(panel.dataset.progress || 0);

    if (symbol !== observatoryStarSequence[progress]) {
        panel.dataset.progress = "0";
        panel.querySelector("#constellationStatus").textContent =
            "The stars fall out of alignment. Try again from the Moon.";
        return;
    }

    progress++;
    panel.dataset.progress = String(progress);

    if (progress < observatoryStarSequence.length) {
        panel.querySelector("#constellationStatus").textContent =
            "Correct. " + progress + " of 3 symbols aligned.";
        return;
    }

    observatoryQuest.puzzleSolved = true;
    const consoleObject = observatoryObjects.find(o => o.id === "observatory-console");
    if (consoleObject) consoleObject.discovered = true;

    discoveries++;
    gameInventory.push("The Restored Constellation");
    updateDiscoveryCounter();
    updateGameSystemsUI();

    panel.style.display = "none";

    showMessage(
        "OBSERVATORY PUZZLE COMPLETE",
        "The Stars Remember",
        "The three fragments rise into the air and return to their places. A hidden chamber awakens on the eastern side of the observatory."
    );
}

// ============================================
// MEMORY FRAGMENT VISUALS
// ============================================


function drawMemoryFragments(time) {
    objects.forEach(object => {
        if (!object.id.startsWith("memory-") || object.discovered) return;

        const pulse = Math.sin(time * 0.003 + object.x) * 0.5 + 0.5;
        const bob = Math.sin(time * 0.002 + object.y) * 5;

        let mainColour = "#e32643";
        let glowColour = "rgba(226,38,67,";
        let highlight = "#ffd1d8";

        if (object.id === "memory-moon") {
            mainColour = "#9bc9ed";
            glowColour = "rgba(130,190,245,";
            highlight = "#f0f8ff";
        } else if (object.id === "memory-star") {
            mainColour = "#e4b94d";
            glowColour = "rgba(255,208,90,";
            highlight = "#fff2bd";
        }

        const x = object.x;
        const y = object.y + bob;

        ctx.save();
        ctx.translate(x, y);

        // Large magical aura.
        const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 65 + pulse * 12);
        aura.addColorStop(0, glowColour + "0.30)");
        aura.addColorStop(0.5, glowColour + "0.10)");
        aura.addColorStop(1, glowColour + "0)");

        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 65 + pulse * 12, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting particles.
        for (let i = 0; i < 4; i++) {
            const angle = time * 0.001 + i * Math.PI / 2;
            const orbit = 28 + Math.sin(time * 0.002 + i) * 4;
            const px = Math.cos(angle) * orbit;
            const py = Math.sin(angle) * orbit;

            ctx.fillStyle = highlight;
            ctx.globalAlpha = 0.45 + pulse * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Crystal shadow.
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 25, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main crystal body.
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(15, -7);
        ctx.lineTo(11, 16);
        ctx.lineTo(0, 24);
        ctx.lineTo(-11, 16);
        ctx.lineTo(-15, -7);
        ctx.closePath();

        const crystal = ctx.createLinearGradient(-15, -10, 15, 15);
        crystal.addColorStop(0, highlight);
        crystal.addColorStop(0.35, mainColour);
        crystal.addColorStop(1, "#47172d");

        ctx.fillStyle = crystal;
        ctx.fill();

        // Crystal facets.
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(-15, -7);
        ctx.lineTo(-3, 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(15, -7);
        ctx.lineTo(3, 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(3, 2);
        ctx.lineTo(0, 22);
        ctx.closePath();
        ctx.fill();

        // Bright centre.
        ctx.fillStyle = highlight;
        ctx.globalAlpha = 0.7 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(-3, -7, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    });
}


// ============================================
// INVENTORY AND QUEST JOURNAL UI
// ============================================

let systemsPanel;
let systemsPanelTab = "journal";

function createGameSystemsUI() {

    const hud = document.getElementById("gameHUD");
    const root = document.getElementById("game");

    if (!hud || !root) return;

    // Menu buttons.
    const menu = document.createElement("div");

    Object.assign(menu.style, {
        position: "absolute",
        top: "78px",
        right: "18px",
        display: "flex",
        gap: "8px",
        zIndex: "15",
        pointerEvents: "auto"
    });

    function makeMenuButton(label, tab) {

        const button = document.createElement("button");

        button.textContent = label;

        Object.assign(button.style, {
            padding: "11px 13px",
            background: "rgba(7,20,38,0.94)",
            color: "#fff1b8",
            border: "1px solid #d4af37",
            fontSize: "10px",
            letterSpacing: "1px",
            cursor: "pointer"
        });

        button.addEventListener("click", () => {
            openSystemsPanel(tab);
        });

        menu.appendChild(button);
    }

    makeMenuButton("INVENTORY", "inventory");
    makeMenuButton("QUESTS", "journal");

    hud.appendChild(menu);

    // Main panel.
    systemsPanel = document.createElement("div");

    systemsPanel.style.cssText = `
        position:absolute;
        inset:0;
        z-index:30;
        display:none;
        align-items:center;
        justify-content:center;
        background:rgba(2,7,17,0.88);
        backdrop-filter:blur(8px);
        padding:20px;
    `;

    systemsPanel.innerHTML = `
        <div style="
            width:min(520px,100%);
            padding:30px;
            background:#0b1728;
            border:1px solid rgba(212,175,55,0.7);
            box-shadow:0 0 60px rgba(163,13,37,0.2);
            color:#fff5df;
            box-sizing:border-box;
        ">
            <div style="
                color:#d4af37;
                font:11px Arial;
                letter-spacing:4px;
            " id="systemsSubtitle">YOUR JOURNEY</div>

            <h2 id="systemsTitle" style="
                color:#fff1b8;
                font:normal 32px Georgia;
                margin:15px 0 25px;
            ">Quest Journal</h2>

            <div id="systemsBody" style="
                font:15px/2 Georgia;
                color:#e6ddce;
                min-height:130px;
            "></div>

            <button id="systemsClose" style="
                margin-top:25px;
                padding:13px 25px;
                background:#8e142d;
                color:#fff5df;
                border:1px solid #d4af37;
                letter-spacing:2px;
                cursor:pointer;
            ">CLOSE</button>
        </div>
    `;

    root.appendChild(systemsPanel);

    systemsPanel.querySelector("#systemsClose").addEventListener(
        "click",
        closeSystemsPanel
    );

    updateGameSystemsUI();
}

function openSystemsPanel(tab) {

    systemsPanelTab = tab;

    updateGameSystemsUI();

    if (systemsPanel) {
        systemsPanel.style.display = "flex";
    }
}

function closeSystemsPanel() {

    if (systemsPanel) {
        systemsPanel.style.display = "none";
    }
}

function updateGameSystemsUI() {
    if (!systemsPanel) return;

    const title = systemsPanel.querySelector("#systemsTitle");
    const subtitle = systemsPanel.querySelector("#systemsSubtitle");
    const body = systemsPanel.querySelector("#systemsBody");

    if (systemsPanelTab === "inventory") {
        subtitle.textContent = "THINGS YOU HAVE FOUND";
        title.textContent = "Inventory";

        body.innerHTML = gameInventory.length === 0
            ? "Your inventory is empty. Explore the world and discover what it holds."
            : gameInventory.map(item =>
                `<div style="padding:9px 0;border-bottom:1px solid rgba(212,175,55,0.2)">✦ ${item}</div>`
              ).join("");
        return;
    }

    subtitle.textContent = "YOUR CURRENT ADVENTURE";
    title.textContent = "Quest Journal";

    body.innerHTML = `
        <div style="color:#d4af37;margin-bottom:12px">THE LOST MEMORIES</div>
        <div>${gameQuest.lanternFound ? "✓" : "○"} Discover the Forgotten Lantern</div>
        <div>${gameQuest.fragmentsFound >= 1 ? "✓" : "○"} Find the first memory fragment</div>
        <div>${gameQuest.fragmentsFound >= 2 ? "✓" : "○"} Find the second memory fragment</div>
        <div>${gameQuest.fragmentsFound >= 3 ? "✓" : "○"} Find the third memory fragment</div>
        <div>${gameQuest.pondFound ? "✓" : "○"} Investigate the Moonlit Pond</div>
        <div style="margin-top:12px;color:${gameQuest.completed ? "#ffe59a" : "#b7a98e"}">
            ${gameQuest.completed ? "✦ QUEST COMPLETE — MOONLIT MEMORY UNLOCKED" : "Recover the lost memories of the forest."}
        </div>

        <div style="color:#d4af37;margin:24px 0 12px">THE OBSERVATORY</div>
        <div>${observatoryQuest.fragmentsFound >= 1 ? "✓" : "○"} Recover the first celestial fragment</div>
        <div>${observatoryQuest.fragmentsFound >= 2 ? "✓" : "○"} Recover the second celestial fragment</div>
        <div>${observatoryQuest.fragmentsFound >= 3 ? "✓" : "○"} Recover the third celestial fragment</div>
        <div>${observatoryQuest.telescopeRead ? "✓" : "○"} Study the astronomer's telescope</div>
        <div>${observatoryQuest.puzzleSolved ? "✓" : "○"} Restore the constellation</div>
        <div>${observatoryQuest.chamberEntered ? "✓" : "○"} Enter the Celestial Chamber</div>
        <div style="margin-top:12px;color:${observatoryQuest.chamberEntered ? "#ffe59a" : "#b7a98e"}">
            ${observatoryQuest.chamberEntered ? "✦ OBSERVATORY COMPLETE — SECRET FOUND" : "Find the three fragments and restore the stars."}
        </div>
    `;
}

// Create the interface once.
createGameSystemsUI();

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

    const deltaTime = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    const overlay = document.getElementById("gameMessage");
    const puzzlePanel = document.getElementById("constellationPuzzle");

    if (
        (!overlay || overlay.style.display === "none") &&
        (!systemsPanel || systemsPanel.style.display === "none") &&
        (!puzzlePanel || puzzlePanel.style.display === "none")
    ) {
        updatePlayer(deltaTime);
    }

    updateCamera();

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawGround();

    if (currentArea === "forest") {
        drawForestDecorations(time);
        drawMemoryFragments(time);
        drawPond(time);
        drawLantern(time);
        drawForestGate(time);

        const renderables = [
            ...trees.map(tree => ({ y: tree.y, draw: () => drawTree(tree) })),
            { y: player.y, draw: () => drawPlayer(time) }
        ];
        renderables.sort((a, b) => a.y - b.y);
        renderables.forEach(item => item.draw());
    } else {
        drawObservatoryObjects(time);
        drawPlayer(time);
    }

    ctx.restore();

    const nearby = findNearbyObject();
    if (nearby) {
        interactionPrompt.textContent = "E  ·  " + nearby.name;
        interactionPrompt.style.opacity = "1";
    } else {
        interactionPrompt.style.opacity = "0";
    }

    requestAnimationFrame(gameLoop);
}
