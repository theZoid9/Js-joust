const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let channel = null;

let playerId = null;

let motionEnabled = false;


// --------------------------------------------------
// ELEMENTS
// --------------------------------------------------

const roomInput =
    document.getElementById("roomInput");

const joinButton =
    document.getElementById("joinButton");

const motionButton =
    document.getElementById("motionButton");

const status =
    document.getElementById("status");


// --------------------------------------------------
// JOIN ROOM
// --------------------------------------------------

joinButton.addEventListener(
    "click",
    joinRoom
);


async function joinRoom() {

    const roomCode =
        roomInput.value
            .trim()
            .toUpperCase();


    if (roomCode.length !== 6) {

        status.textContent =
            "Enter a 6-character room code.";

        return;
    }


    playerId =
        crypto.randomUUID();


    channel =
        supabaseClient.channel(
            `joust:${roomCode}`,
            {
                config: {
                    presence: {
                        key: playerId
                    }
                }
            }
        );


    // Listen for connection

    channel.subscribe(async statusValue => {

        console.log(
            "Supabase:",
            statusValue
        );


        if (
            statusValue ===
            "SUBSCRIBED"
        ) {

            status.textContent =
                "Joined room!";


            // Tell the room
            // that we're a player.

            await channel.track({

                type: "player",

                playerId

            });


            motionButton.disabled =
                false;

        }

    });

}


// --------------------------------------------------
// MOTION PERMISSION
// --------------------------------------------------

motionButton.addEventListener(
    "click",
    enableMotion
);


async function enableMotion() {

    try {

        // iOS

        if (
            typeof DeviceOrientationEvent
                .requestPermission ===
            "function"
        ) {

            const permission =
                await DeviceOrientationEvent
                    .requestPermission();


            if (
                permission !==
                "granted"
            ) {

                status.textContent =
                    "Motion permission denied.";

                return;
            }

        }


        motionEnabled = true;


        window.addEventListener(
            "deviceorientation",
            handleOrientation
        );


        motionButton.textContent =
            "Motion Enabled";


        status.textContent =
            "Move your phone.";

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "Motion could not be enabled.";

    }

}


// --------------------------------------------------
// PHONE MOVEMENT
// --------------------------------------------------

function handleOrientation(event) {

    if (!motionEnabled) {
        return;
    }


    const beta =
        event.beta || 0;

    const gamma =
        event.gamma || 0;


    document.getElementById("beta")
        .textContent =
        beta.toFixed(1);


    document.getElementById("gamma")
        .textContent =
        gamma.toFixed(1);


    // --------------------------------
    // Convert tilt to movement
    // --------------------------------

    let x = gamma / 30;

    let y = (beta - 45) / 30;


    // Limit values between -1 and 1

    x =
        Math.max(
            -1,
            Math.min(1, x)
        );


    y =
        Math.max(
            -1,
            Math.min(1, y)
        );


    // Small dead zone

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


// --------------------------------------------------
// SEND MOVEMENT
// --------------------------------------------------

function sendMovement(x, y) {

    if (!channel) {
        return;
    }


    channel.send({

        type: "broadcast",

        event: "player-movement",

        payload: {

            playerId,

            x,

            y

        }

    });

}