// ==================================================
// ROOM
// ==================================================

function createRoomCode() {

    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

}


const roomCode =
    createRoomCode();


document.getElementById(
    "roomCode"
).textContent = roomCode;


// ==================================================
// SUPABASE CHANNEL
// ==================================================

const channel =
    supabaseClient.channel(
        `joust:${roomCode}`,
        {
            config: {

                presence: {
                    key: "game-screen"
                },

                broadcast: {
                    self: false
                }

            }
        }
    );


// ==================================================
// GAME STATE
// ==================================================

const players = {};

const arena =
    document.getElementById("arena");


// ==================================================
// SUPABASE CONNECTION
// ==================================================

channel.subscribe(async (status) => {

    console.log(
        "Supabase status:",
        status
    );


    if (status === "SUBSCRIBED") {

        console.log(
            "Game connected to Supabase"
        );


        document.getElementById(
            "status"
        ).textContent =
            "Room ready - waiting for players";


        await channel.track({

            type: "game-screen",

            roomCode

        });

    }

});


// ==================================================
// PLAYER MOVEMENT
// ==================================================

channel.on(
    "broadcast",
    {
        event: "player-movement"
    },
    ({ payload }) => {

        console.log(
            "Movement received:",
            payload
        );


        const player =
            players[payload.playerId];


        if (!player) {

            console.warn(
                "Unknown player:",
                payload.playerId
            );

            return;

        }


        player.input.x =
            Number(payload.x) || 0;


        player.input.y =
            Number(payload.y) || 0;

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

        console.log(
            "Presence sync"
        );


        const state =
            channel.presenceState();


        console.log(
            "Presence state:",
            state
        );


        rebuildPlayers(
            state
        );

    }
);


// ==================================================
// PLAYER JOIN
// ==================================================

channel.on(
    "presence",
    {
        event: "join"
    },
    ({ key, newPresences }) => {

        console.log(
            "Presence join:",
            key,
            newPresences
        );


        newPresences.forEach(
            presence => {

                if (
                    presence.type !==
                    "player"
                ) {

                    return;

                }


                createPlayer(
                    presence.playerId
                );

            }
        );

    }
);


// ==================================================
// PLAYER LEAVE
// ==================================================

channel.on(
    "presence",
    {
        event: "leave"
    },
    ({ key, leftPresences }) => {

        console.log(
            "Player left:",
            key,
            leftPresences
        );


        leftPresences.forEach(
            presence => {

                if (
                    presence.type !==
                    "player"
                ) {

                    return;

                }


                removePlayer(
                    presence.playerId
                );

            }
        );

    }
);


// ==================================================
// REBUILD PLAYERS
// ==================================================

function rebuildPlayers(state) {

    const activePlayers =
        new Set();


    Object.values(state)
        .forEach(presenceList => {

            presenceList.forEach(
                presence => {

                    if (
                        presence.type !==
                        "player"
                    ) {

                        return;

                    }


                    activePlayers.add(
                        presence.playerId
                    );


                    createPlayer(
                        presence.playerId
                    );

                }
            );

        });


    Object.keys(players)
        .forEach(playerId => {

            if (
                !activePlayers.has(
                    playerId
                )
            ) {

                removePlayer(
                    playerId
                );

            }

        });


    updatePlayerCount();

}


// ==================================================
// CREATE PLAYER
// ==================================================

function createPlayer(playerId) {

    if (
        players[playerId]
    ) {

        return;

    }


    console.log(
        "Creating player:",
        playerId
    );


    const element =
        document.createElement("div");


    element.className =
        "player";


    const playerNumber =
        Object.keys(players).length + 1;


    element.textContent =
        playerNumber;


    arena.appendChild(
        element
    );


    const arenaWidth =
        arena.clientWidth;


    const arenaHeight =
        arena.clientHeight;


    players[playerId] = {

        id: playerId,

        x:
            Math.random() *
            Math.max(
                1,
                arenaWidth - 60
            ),

        y:
            Math.random() *
            Math.max(
                1,
                arenaHeight - 60
            ),

        input: {

            x: 0,

            y: 0

        },

        speed: 4,

        element

    };


    updatePlayerCount();

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


    updatePlayerCount();

}


// ==================================================
// PLAYER COUNT
// ==================================================

function updatePlayerCount() {

    const count =
        Object.keys(players).length;


    document.getElementById(
        "playerCount"
    ).textContent =
        count;


    if (count === 0) {

        document.getElementById(
            "status"
        ).textContent =
            "Room ready - waiting for players";

    }

    else {

        document.getElementById(
            "status"
        ).textContent =
            `${count} player${
                count === 1 ? "" : "s"
            } connected`;

    }

}


// ==================================================
// UPDATE GAME
// ==================================================

function updateGame() {

    const arenaWidth =
        arena.clientWidth;


    const arenaHeight =
        arena.clientHeight;


    Object.values(players)
        .forEach(player => {

            player.x +=
                player.input.x *
                player.speed;


            player.y +=
                player.input.y *
                player.speed;


            const maxX =
                arenaWidth - 40;


            const maxY =
                arenaHeight - 40;


            player.x =
                Math.max(
                    0,
                    Math.min(
                        maxX,
                        player.x
                    )
                );


            player.y =
                Math.max(
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

    Object.values(players)
        .forEach(player => {

            player.element.style.transform =
                `translate(
                    ${player.x}px,
                    ${player.y}px
                )`;

        });

}


// ==================================================
// GAME LOOP
// ==================================================

function gameLoop() {

    updateGame();

    renderPlayers();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();