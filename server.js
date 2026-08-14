const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

app.use(express.static("public"));

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});

const players = new Map();

let nextPlayerId = 1;

let gameState = {
    phase: "slow",
    started: false,
    players: {}
};



function broadcast(message) {

    const data = JSON.stringify(message);

    wss.clients.forEach(client => {

        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }

    });
}


function createPlayer() {

    const id = `player-${nextPlayerId++}`;

    return {
        id,
        x: Math.random() * 700 + 50,
        y: Math.random() * 400 + 50,
        alive: true
    };
}


wss.on("connection", socket => {

    console.log("Device connected");


    socket.on("message", message => {

        const data = JSON.parse(message);


        if (data.type === "join") {

            const player = createPlayer();

            players.set(player.id, socket);

            gameState.players[player.id] = player;

            socket.send(JSON.stringify({
                type: "joined",
                playerId: player.id
            }));

            broadcast({
                type: "state",
                state: gameState
            });

        }


        if (data.type === "move") {

            const player = gameState.players[data.playerId];

            if (!player || !player.alive) {
                return;
            }

            player.x = data.x;
            player.y = data.y;

            broadcast({
                type: "state",
                state: gameState
            });

        }


        if (data.type === "start") {

            gameState.started = true;

            broadcast({
                type: "state",
                state: gameState
            });

        }

    });


    socket.on("close", () => {

        for (const [playerId, playerSocket] of players) {

            if (playerSocket === socket) {

                delete gameState.players[playerId];

                players.delete(playerId);

                break;
            }

        }

        broadcast({
            type: "state",
            state: gameState
        });

    });

});


setInterval(() => {

    if (!gameState.started) {
        return;
    }

    gameState.phase =
        gameState.phase === "slow"
            ? "fast"
            : "slow";

    broadcast({
        type: "phase",
        phase: gameState.phase
    });

}, 5000);


server.listen(3000, () => {

    console.log(
        "Server running on http://localhost:3000"
    );

});