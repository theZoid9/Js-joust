const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==================================================
// ROOM
// ==================================================

const roomCode = createRoomCode();

document.getElementById("roomCode").textContent = roomCode;

const channel = supabaseClient.channel(
    `joust:${roomCode}`,
    {
        config: {
            presence: {
                key: "game-screen"
            }
        }
    }
);


// ==================================================
// GAME STATE
// ==================================================

const players = {};


// ==================================================
// CREATE ROOM CONNECTION
// ==================================================

channel.subscribe(async (status) => {

    console.log("Supabase:", status);

    if (status === "SUBSCRIBED") {

        document.getElementById("status").textContent =
            "Room ready - waiting for players";

        await channel.track({
            type: "game-screen"
        });

    }

});


// ==================================================
// RECEIVE PLAYER MOVEMENT
// ==================================================

channel.on(
    "broadcast",
    {
        event: "player-movement"
    },
    ({ payload }) => {

        console.log("Movement received:", payload);

        const player = players[payload.playerId];

        if (!player) {

            console.log(
                "Movement received for unknown player:",
                payload.playerId
            );

            return;
        }

        player.input.x = payload.x;
        player.input.y = payload.y;

    }
);


// ==================================================
// PRESENCE SYNC
// ==================================================

channel.on(
    "presence",
    {
        event: "sync"
    },
    () => {

        console.log("Presence sync");

        const state = channel.presenceState();

        console.log("Current presence:", state);

        rebuildPlayers(state);

    }
);


// ==================================================
// PLAYER JOINED
// ==================================================

channel.on(
    "presence",
    {
        event: "join"
    },
    ({ key, newPresences }) => {

        console.log(
            "Player joined:",
            key,
            newPresences
        );

        newPresences.forEach((presence) => {

            if (presence.type !== "player") {
                return;
            }

            createPlayer(
                presence.playerId
            );

        });

    }
);


// ==================================================
// PLAYER LEFT
// ==================================================

channel.on(
    "presence",
    {
        event: "leave"
    },
    ({ key }) => {

        console.log(
            "Player left:",
            key
        );

        removePlayer(key);

    }
);


// ==================================================
// REBUILD PLAYERS FROM PRESENCE
// ==================================================

function rebuildPlayers(state) {

    const activePlayers = new Set();


    Object.values(state).forEach((presences) => {

        presences.forEach((presence) => {

            if (presence.type !== "player") {
                return;
            }

            activePlayers.add(
                presence.playerId
            );

            createPlayer(
                presence.playerId
            );

        });

    });


    // Remove players no longer present

    Object.keys(players).forEach((playerId) => {

        if (!activePlayers.has(playerId)) {

            removePlayer(playerId);

        }

    });


    document.getElementById("playerCount")
        .textContent =
        Object.keys(players).length;


    if (Object.keys(players).length > 0) {

        document.getElementById("status")
            .textContent =
            "Players connected!";

    }

}


// ==================================================
// CREATE PLAYER
// ==================================================

function createPlayer(playerId) {

    if (players[playerId]) {
        return;
    }


    console.log(
        "Creating player:",
        playerId
    );


    const arena =
        document.getElementById("arena");


    const element =
        document.createElement("div");


    element.className =
        "player";


    element.textContent =
        Object.keys(players).length + 1;


    arena.appendChild(element);


    players[playerId] = {

        id: playerId,

        x: Math.random() * 700 + 30,

        y: Math.random() * 400 + 30,

        input: {
            x: 0,
            y: 0
        },

        speed: 4,

        element

    };

}


// ==================================================
// REMOVE PLAYER
// ==================================================

function removePlayer(playerId) {

    const player =
        players[playerId];

    if (!player) {
        return;
    }


    player.element.remove();

    delete players[playerId];


    document.getElementById("playerCount")
        .textContent =
        Object.keys(players).length;

}


// ==================================================
// GAME LOOP
// ==================================================

function updateGame() {

    Object.values(players).forEach(player => {

        player.x +=
            player.input.x *
            player.speed;


        player.y +=
            player.input.y *
            player.speed;


        // Arena boundaries

        const maxX =
            document.getElementById("arena")
                .clientWidth - 40;

        const maxY =
            document.getElementById("arena")
                .clientHeight - 40;


        player.x = Math.max(
            0,
            Math.min(
                maxX,
                player.x
            )
        );


        player.y = Math.max(
            0,
            Math.min(
                maxY,
                player.y
            )
        );

    });

}


// ==================================================
// RENDER
// ==================================================

function renderPlayers() {

    Object.values(players).forEach(player => {

        player.element.style.transform =
            `translate(
                ${player.x}px,
                ${player.y}px
            )`;

    });

}


// ==================================================
// MAIN LOOP
// ==================================================

function gameLoop() {

    updateGame();

    renderPlayers();

    requestAnimationFrame(gameLoop);

}

gameLoop();


// ==================================================
// ROOM CODE
// ==================================================

function createRoomCode() {

    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

}

function handleMotion(event) {

    console.log("Device motion event fired");

    const acceleration =
        event.accelerationIncludingGravity;

    if (!acceleration) {
        console.log("No acceleration data");
        return;
    }


    console.log(
        "Acceleration:",
        acceleration.x,
        acceleration.y,
        acceleration.z
    );

}
async function enableMotion() {

    console.log("Enable Motion clicked");

    try {

        // iPhone / iPad
        if (
            typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {

            const motionPermission =
                await DeviceMotionEvent.requestPermission();

            console.log(
                "Motion permission:",
                motionPermission
            );

            if (motionPermission !== "granted") {

                status.textContent =
                    "Motion permission denied";

                return;
            }
        }


        // Orientation permission
        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {

            const orientationPermission =
                await DeviceOrientationEvent.requestPermission();

            console.log(
                "Orientation permission:",
                orientationPermission
            );

            if (orientationPermission !== "granted") {

                status.textContent =
                    "Orientation permission denied";

                return;
            }
        }


        // Start listening

        window.addEventListener(
            "devicemotion",
            handleMotion
        );

        window.addEventListener(
            "deviceorientation",
            handleOrientation
        );


        motionEnabled = true;

        motionButton.textContent =
            "Motion Enabled";

        status.textContent =
            "Move your phone!";


        console.log(
            "Motion sensors enabled"
        );

    } catch (error) {

        console.error(
            "Motion permission error:",
            error
        );

        status.textContent =
            `Motion error: ${error.message}`;

    }
}


function handleOrientation(event) {

    console.log(
        "Orientation:",
        event.beta,
        event.gamma
    );

    const beta = event.beta || 0;
    const gamma = event.gamma || 0;


    document.getElementById("beta")
        .textContent =
        beta.toFixed(1);

    document.getElementById("gamma")
        .textContent =
        gamma.toFixed(1);


    // Phone tilted left/right
    let x = gamma / 30;

    // Phone tilted forward/backward
    let y = (beta - 45) / 30;


    x = Math.max(
        -1,
        Math.min(1, x)
    );

    y = Math.max(
        -1,
        Math.min(1, y)
    );


    // Dead zone

    if (Math.abs(x) < 0.15) {
        x = 0;
    }

    if (Math.abs(y) < 0.15) {
        y = 0;
    }


    document.getElementById("movement")
        .textContent =
        `${x.toFixed(2)}, ${y.toFixed(2)}`;


    sendMovement(x, y);
}