const socket = new WebSocket(
    `wss://${location.host}`
);


let playerId = null;

let targetX = 400;
let targetY = 250;


socket.addEventListener("open", () => {

    document.getElementById("status")
        .textContent = "Connected";

    socket.send(JSON.stringify({
        type: "join"
    }));

});


socket.addEventListener("message", event => {

    const message = JSON.parse(event.data);


    if (message.type === "joined") {

        playerId =
            message.playerId;

        console.log(
            "My player ID:",
            playerId
        );

    }

});


const controller =
    document.getElementById("controller");


controller.addEventListener(
    "touchmove",
    event => {

        event.preventDefault();

        const touch =
            event.touches[0];

        const rect =
            controller.getBoundingClientRect();


        targetX =
            touch.clientX - rect.left;

        targetY =
            touch.clientY - rect.top;


        sendMovement();

    },
    {
        passive: false
    }
);


function sendMovement() {

    if (!playerId) {
        return;
    }


    socket.send(JSON.stringify({

        type: "move",

        playerId,

        x: targetX,

        y: targetY

    }));

}