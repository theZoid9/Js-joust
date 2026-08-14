const arena = document.getElementById("arena");
const phaseDisplay = document.getElementById("phase");
const playersDisplay = document.getElementById("players");
const restartButton = document.getElementById("restart");

const arenaWidth = 800;
const arenaHeight = 500;

let phase = "slow";
let gameOver = false;

const keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


const players = [
    {
        id: "player1",
        x: 100,
        y: 250,
        speed: 3,
        alive: true,
        isHuman: true
    },

    {
        id: "player2",
        x: 600,
        y: 100,
        speed: 2,
        alive: true,
        isHuman: false,
        directionX: -1,
        directionY: 1
    },

    {
        id: "player3",
        x: 600,
        y: 400,
        speed: 2,
        alive: true,
        isHuman: false,
        directionX: -1,
        directionY: -1
    },

    {
        id: "player4",
        x: 400,
        y: 250,
        speed: 2,
        alive: true,
        isHuman: false,
        directionX: 1,
        directionY: -1
    }
];


function getPlayerElement(player) {
    return document.getElementById(player.id);
}


function moveHuman(player) {

    if (!player.alive) {
        return;
    }

    let speed = player.speed;

    // Slow phase makes movement much slower
    if (phase === "slow") {
        speed *= 0.3;
    }

    if (keys["w"] || keys["arrowup"]) {
        player.y -= speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        player.y += speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        player.x -= speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        player.x += speed;
    }

    keepInsideArena(player);
}


function moveAI(player) {

    if (!player.alive) {
        return;
    }

    let speed = player.speed;

    if (phase === "slow") {
        speed *= 0.3;
    }

    player.x += player.directionX * speed;
    player.y += player.directionY * speed;

    if (player.x <= 0 || player.x >= arenaWidth - 40) {
        player.directionX *= -1;
    }

    if (player.y <= 0 || player.y >= arenaHeight - 40) {
        player.directionY *= -1;
    }
}


function keepInsideArena(player) {

    player.x = Math.max(
        0,
        Math.min(player.x, arenaWidth - 40)
    );

    player.y = Math.max(
        0,
        Math.min(player.y, arenaHeight - 40)
    );
}


function render() {

    players.forEach((player) => {

        const element = getPlayerElement(player);

        element.style.left = `${player.x}px`;
        element.style.top = `${player.y}px`;

    });
}


function distance(playerA, playerB) {

    const dx = playerA.x - playerB.x;
    const dy = playerA.y - playerB.y;

    return Math.sqrt(
        dx * dx + dy * dy
    );
}


function checkCollisions() {

    if (phase !== "fast") {
        return;
    }

    players.forEach((attacker) => {

        if (!attacker.alive) {
            return;
        }

        players.forEach((target) => {

            if (attacker === target || !target.alive) {
                return;
            }

            if (distance(attacker, target) < 35) {

                target.alive = false;

                const element = getPlayerElement(target);

                element.classList.add("dead");

                console.log(
                    `${attacker.id} eliminated ${target.id}`
                );

            }

        });

    });
}


function updatePlayerCount() {

    const alivePlayers = players.filter(
        player => player.alive
    );

    playersDisplay.textContent =
        `Players: ${alivePlayers.length}`;

    if (alivePlayers.length <= 1) {

        gameOver = true;

        const winner = alivePlayers[0];

        if (winner?.isHuman) {
            phaseDisplay.textContent = "YOU WIN!";
        } else {
            phaseDisplay.textContent = "GAME OVER";
        }
    }
}


function changePhase() {

    phase = phase === "slow"
        ? "fast"
        : "slow";

    phaseDisplay.textContent =
        phase.toUpperCase();
}


let phaseTimer = 0;

function gameLoop(timestamp) {

    if (gameOver) {
        return;
    }

    if (!phaseTimer) {
        phaseTimer = timestamp;
    }

    const elapsed = timestamp - phaseTimer;

    // Change phase every 3 seconds
    if (elapsed > 3000) {

        changePhase();

        phaseTimer = timestamp;
    }

    const human = players.find(
        player => player.isHuman
    );

    moveHuman(human);

    players
        .filter(player => !player.isHuman)
        .forEach(moveAI);

    checkCollisions();

    updatePlayerCount();

    render();

    requestAnimationFrame(gameLoop);
}


function restartGame() {

    location.reload();

}


restartButton.addEventListener(
    "click",
    restartGame
);


render();

requestAnimationFrame(gameLoop);