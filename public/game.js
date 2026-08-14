const socket = new WebSocket(
    `wss://${location.host}`
);


const arena = document.getElementById("arena");
const phaseDisplay = document.getElementById("phase");
const startButton = document.getElementById("start");


const players = {};


socket.addEventListener("open", () => {

    console.log("Connected to server");

});


socket.addEventListener("message", event => {

    const message = JSON.parse(event.data);


    if (message.type === "state") {

        renderGame(message.state);

    }


    if (message.type === "phase") {

        phaseDisplay.textContent =
            message.phase.toUpperCase();

    }

});


function renderGame(state) {

    phaseDisplay.textContent =
        state.phase.toUpperCase();


    Object.values(state.players).forEach(player => {

        let element = players[player.id];


        if (!element) {

            element = document.createElement("div");

            element.className = "player";

            element.textContent =
                player.id;

            arena.appendChild(element);

            players[player.id] = element;

        }


        element.style.left =
            `${player.x}px`;

        element.style.top =
            `${player.y}px`;


        if (!player.alive) {

            element.style.display = "none";

        }

    });

}


startButton.addEventListener("click", () => {

    socket.send(JSON.stringify({
        type: "start"
    }));

});


socket.addEventListener(
    "message",
    event => {

        const message =
            JSON.parse(event.data);


        if (message.type === "state") {

            renderGame(
                message.state
            );

        }

    }
);


function renderGame(state) {

    Object.values(state.players)
        .forEach(player => {

            let element =
                players[player.id];


            if (!element) {

                element =
                    document.createElement("div");

                element.className =
                    "player";

                arena.appendChild(element);

                players[player.id] =
                    element;

            }


            element.style.transform =
                `translate(
                    ${player.x}px,
                    ${player.y}px
                )`;

        });

}