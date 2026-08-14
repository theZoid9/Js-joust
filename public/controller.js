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