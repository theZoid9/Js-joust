// ==================================================
// CREATE ROOM
// ==================================================

function createRoomCode() {

    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

}


const roomCode =
    createRoomCode();


document.getElementById("roomCode")
    .textContent = roomCode;


// ==================================================
// CREATE CHANNEL
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
// IMPORTANT:
// REGISTER ALL LISTENERS BEFORE subscribe()
// ==================================================


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
            "PRESENCE SYNC"
        );


        const state =
            channel.presenceState();


        console.log(
            "PRESENCE STATE:",
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
            "PLAYER JOIN:",
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
            "PLAYER LEAVE:",
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
// PLAYER MOVEMENT
// ==================================================

channel.on(
    "broadcast",
    {
        event: "player-movement"
    },
    ({ payload }) => {

        console.log(
            "MOVEMENT RECEIVED:",
            payload
        );


        const player =
            players[
                payload.playerId
            ];


        if (!player) {

            console.warn(
                "Movement for unknown player:",
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
// NOW SUBSCRIBE
// ==================================================

channel.subscribe(
    async (status) => {

        console.log(
            "SUPABASE STATUS:",
            status
        );


        if (
            status ===
            "SUBSCRIBED"
        ) {

            console.log(
                "GAME CONNECTED TO SUPABASE"
            );


            document.getElementById(
                "status"
            ).textContent =
                `Room ${roomCode} ready`;


            const result =
                await channel.track({

                    type:
                        "game-screen",

                    roomCode

                });


            console.log(
                "GAME PRESENCE TRACK RESULT:",
                result
            );

        }


        if (
            status ===
            "CHANNEL_ERROR"
        ) {

            console.error(
                "SUPABASE CHANNEL ERROR"
            );


            document.getElementById(
                "status"
            ).textContent =
                "Supabase connection failed.";

        }


        if (
            status ===
            "TIMED_OUT"
        ) {

            console.error(
                "SUPABASE CONNECTION TIMED OUT"
            );


            document.getElementById(
                "status"
            ).textContent =
                "Supabase connection timed out.";

        }

    }
);


// ==================================================
// REBUILD PLAYERS
// ==================================================

function rebuildPlayers(state) {

    console.log(
        "REBUILDING PLAYERS"
    );


    const activePlayers =
        new Set();


    Object.values(state)
        .forEach(presenceList => {

            presenceList.forEach(
                presence => {

                    console.log(
                        "Presence:",
                        presence
                    );


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
        "CREATING PLAYER:",
        playerId
    );


    const element =
        document.createElement("div");


    element.className =
        "player";


    element.textContent =
        Object.keys(players).length + 1;


    arena.appendChild(
        element
    );


    players[playerId] = {

        id: playerId,

        x:
            Math.random() *
            Math.max(
                1,
                arena.clientWidth - 60
            ),

        y:
            Math.random() *
            Math.max(
                1,
                arena.clientHeight - 60
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
            `Room ${roomCode} ready - waiting for players`;

    }

    else {

        document.getElementById(
            "status"
        ).textContent =
            `${count} player${
                count === 1
                    ? ""
                    : "s"
            } connected`;

    }

}


// ==================================================
// GAME UPDATE
// ==================================================

function updateGame() {

    const width =
        arena.clientWidth;

    const height =
        arena.clientHeight;


    Object.values(players)
        .forEach(player => {

            player.x +=
                player.input.x *
                player.speed;


            player.y +=
                player.input.y *
                player.speed;


            player.x =
                Math.max(
                    0,
                    Math.min(
                        width - 40,
                        player.x
                    )
                );


            player.y =
                Math.max(
                    0,
                    Math.min(
                        height - 40,
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