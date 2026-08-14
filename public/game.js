const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// --------------------------------------------------
// ROOM
// --------------------------------------------------

function createRoomCode() {

    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

}

const roomCode = createRoomCode();

document.getElementById("roomCode")
    .textContent = roomCode;


const channel =
    supabaseClient.channel(
        `joust:${roomCode}`,
        {
            config: {
                presence: {
                    key: "game-screen"
                }
            }
        }
    );


// --------------------------------------------------
// GAME STATE
// --------------------------------------------------

const players = {};

let gameStarted = false;


// --------------------------------------------------
// RECEIVE MOVEMENT
// --------------------------------------------------

channel.on(
    "broadcast",
    {
        event: "player-movement"
    },
    ({ payload }) => {

        const player =
            players[payload.playerId];

        if (!player) {
            return;
        }


        player.input.x =
            payload.x;

        player.input.y =
            payload.y;

    }
);


// --------------------------------------------------
// PRESENCE
// --------------------------------------------------

channel.on(
    "presence",
    {
        event: "sync"
    },
    () => {

        const state =
            channel.presenceState();

        console.log(
            "Players:",
            state
        );

        updatePlayerCount(state);

    }
);


function updatePlayerCount(state) {

    let count = 0;

    Object.values(state)
        .forEach(entries => {

            entries.forEach(entry => {

                if (
                    entry.type === "player"
                ) {
                    count++;
                }

            });

        });


    document.getElementById(
        "playerCount"
    ).textContent = count;

}


// --------------------------------------------------
// CHANNEL CONNECTION
// --------------------------------------------------

channel.subscribe(async status => {

    console.log(
        "Supabase:",
        status
    );


    if (status === "SUBSCRIBED") {

        document.getElementById("status")
            .textContent =
            "Waiting for players...";


        await channel.track({

            type: "game",

            roomCode

        });

    }

});


// --------------------------------------------------
// CREATE PLAYER WHEN PRESENCE CHANGES
// --------------------------------------------------

channel.on(
    "presence",
    {
        event: "join"
    },
    ({ key, newPresences }) => {

        newPresences.forEach(playerInfo => {

            if (
                playerInfo.type !== "player"
            ) {
                return;
            }


            createPlayer(
                playerInfo.playerId
            );

        });

    }
);


function createPlayer(playerId) {

    if (players[playerId]) {
        return;
    }


    players[playerId] = {

        id: playerId,

        x: Math.random() * 700 + 50,

        y: Math.random() * 400 + 50,

        input: {

            x: 0,

            y: 0

        },

        speed: 4,

        element: null

    };


    renderPlayer(
        players[playerId]
    );

}


// --------------------------------------------------
// RENDER
// --------------------------------------------------

function renderPlayer(player) {

    const arena =
        document.getElementById("arena");


    const element =
        document.createElement("div");


    element.className =
        "player";


    element.textContent =
        player.id.slice(-2);


    arena.appendChild(
        element
    );


    player.element =
        element;

}


function renderPlayers() {

    Object.values(players)
        .forEach(player => {

            if (!player.element) {
                return;
            }


            player.element.style.transform =
                `translate(
                    ${player.x}px,
                    ${player.y}px
                )`;

        });

}


// --------------------------------------------------
// GAME UPDATE
// --------------------------------------------------

function updateGame() {

    Object.values(players)
        .forEach(player => {

            player.x +=
                player.input.x *
                player.speed;


            player.y +=
                player.input.y *
                player.speed;


            // Keep inside arena

            player.x =
                Math.max(
                    0,
                    Math.min(
                        760,
                        player.x
                    )
                );


            player.y =
                Math.max(
                    0,
                    Math.min(
                        460,
                        player.y
                    )
                );

        });

}


// --------------------------------------------------
// GAME LOOP
// --------------------------------------------------

function gameLoop() {

    updateGame();

    renderPlayers();

    requestAnimationFrame(
        gameLoop
    );

}

gameLoop();