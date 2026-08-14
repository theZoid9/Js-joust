const protocol =
    window.location.protocol === "https:"
        ? "wss:"
        : "ws:";

const socket = new WebSocket(
    `${protocol}//${window.location.host}`
);

let playerId = null;
let motionEnabled = false;


// -------------------------
// WebSocket
// -------------------------

socket.addEventListener("open", () => {

    console.log("Connected");

    document.getElementById("status")
        .textContent = "Connected";

    socket.send(JSON.stringify({
        type: "join"
    }));

});


socket.addEventListener("message", (event) => {

    const message = JSON.parse(event.data);

    console.log("Server:", message);

    if (message.type === "joined") {

        playerId = message.playerId;

        console.log(
            "My player ID:",
            playerId
        );
    }

});


socket.addEventListener("error", (error) => {

    console.error(
        "WebSocket error:",
        error
    );

});


// -------------------------
// Enable phone motion
// -------------------------

const enableButton =
    document.getElementById("enableMotion");


enableButton.addEventListener(
    "click",
    async () => {

        try {

            // iPhone requires permission
            if (
                typeof DeviceOrientationEvent !==
                "undefined" &&
                typeof DeviceOrientationEvent.requestPermission ===
                "function"
            ) {

                const permission =
                    await DeviceOrientationEvent
                        .requestPermission();

                if (permission !== "granted") {

                    alert(
                        "Motion permission was denied."
                    );

                    return;
                }
            }


            motionEnabled = true;

            enableButton.textContent =
                "Motion Enabled";

            document.getElementById("status")
                .textContent =
                "Tilt your phone to move";


            window.addEventListener(
                "deviceorientation",
                handleMotion
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not enable motion."
            );

        }

    }
);


// -------------------------
// Read phone movement
// -------------------------

function handleMotion(event) {

    if (!motionEnabled) {
        return;
    }


    const beta =
        event.beta || 0;

    const gamma =
        event.gamma || 0;


    // Show values on screen
    document.getElementById("beta")
        .textContent =
        beta.toFixed(1);

    document.getElementById("gamma")
        .textContent =
        gamma.toFixed(1);


    // Convert tilt into movement

    let moveX = 0;
    let moveY = 0;


    const deadZone = 8;


    // LEFT / RIGHT

    if (gamma > deadZone) {

        moveX = 1;

    } else if (gamma < -deadZone) {

        moveX = -1;

    }


    // FORWARD / BACKWARD

    if (beta > 60 + deadZone) {

        moveY = 1;

    } else if (beta < 60 - deadZone) {

        moveY = -1;

    }


    sendMovement(
        moveX,
        moveY
    );

}


// -------------------------
// Send movement
// -------------------------

function sendMovement(x, y) {

    if (!playerId) {
        return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }


    socket.send(JSON.stringify({

        type: "movement",

        playerId,

        x,

        y

    }));

}