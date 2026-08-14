// ==================================================
// VARIABLES
// ==================================================

let channel = null;

let playerId = null;

let motionEnabled = false;


// ==================================================
// ELEMENTS
// ==================================================

const roomInput =
    document.getElementById(
        "roomInput"
    );


const joinButton =
    document.getElementById(
        "joinButton"
    );


const motionButton =
    document.getElementById(
        "motionButton"
    );


const status =
    document.getElementById(
        "status"
    );


const sensorStatus =
    document.getElementById(
        "sensorStatus"
    );


// ==================================================
// JOIN ROOM
// ==================================================

joinButton.addEventListener(
    "click",
    joinRoom
);


async function joinRoom() {

    const roomCode =
        roomInput.value
            .trim()
            .toUpperCase();


    if (
        roomCode.length !== 6
    ) {

        status.textContent =
            "Room code must be 6 characters.";

        return;

    }


    playerId =
        crypto.randomUUID();


    console.log(
        "Player ID:",
        playerId
    );


    channel =
        supabaseClient.channel(
            `joust:${roomCode}`,
            {
                config: {

                    presence: {

                        key: playerId

                    },

                    broadcast: {

                        self: false

                    }

                }

            }
        );


    channel.subscribe(
        async statusValue => {

            console.log(
                "Supabase:",
                statusValue
            );


            if (
                statusValue ===
                "SUBSCRIBED"
            ) {

                status.textContent =
                    "Connected to room.";


                await channel.track({

                    type: "player",

                    playerId

                });


                console.log(
                    "Presence tracked"
                );


                motionButton.disabled =
                    false;


                status.textContent =
                    "Connected. Enable motion.";

            }

        }
    );

}


// ==================================================
// ENABLE MOTION
// ==================================================

motionButton.addEventListener(
    "click",
    enableMotion
);


async function enableMotion() {

    console.log(
        "ENABLE MOTION CLICKED"
    );


    try {

        // ==========================================
        // DEVICE MOTION PERMISSION
        // ==========================================

        if (
            typeof DeviceMotionEvent !==
            "undefined" &&

            typeof DeviceMotionEvent
                .requestPermission ===
            "function"
        ) {

            console.log(
                "Requesting DeviceMotion permission..."
            );


            const permission =
                await DeviceMotionEvent
                    .requestPermission();


            console.log(
                "DeviceMotion permission:",
                permission
            );


            if (
                permission !==
                "granted"
            ) {

                status.textContent =
                    "Motion permission denied.";

                sensorStatus.textContent =
                    "Denied";

                return;

            }

        }


        // ==========================================
        // DEVICE ORIENTATION PERMISSION
        // ==========================================

        if (
            typeof DeviceOrientationEvent !==
            "undefined" &&

            typeof DeviceOrientationEvent
                .requestPermission ===
            "function"
        ) {

            console.log(
                "Requesting orientation permission..."
            );


            const permission =
                await DeviceOrientationEvent
                    .requestPermission();


            console.log(
                "Orientation permission:",
                permission
            );


            if (
                permission !==
                "granted"
            ) {

                status.textContent =
                    "Orientation permission denied.";

                sensorStatus.textContent =
                    "Denied";

                return;

            }

        }


        // ==========================================
        // ADD LISTENERS
        // ==========================================

        window.addEventListener(
            "deviceorientation",
            handleOrientation
        );


        window.addEventListener(
            "devicemotion",
            handleMotion
        );


        motionEnabled = true;


        motionButton.textContent =
            "Motion Enabled";


        motionButton.disabled =
            true;


        status.textContent =
            "Motion enabled. Move your phone!";


        sensorStatus.textContent =
            "Waiting for sensor data";


        console.log(
            "Motion sensors enabled"
        );

    }

    catch (error) {

        console.error(
            "Motion permission error:",
            error
        );


        status.textContent =
            "Motion error: " +
            error.message;


        sensorStatus.textContent =
            "Error";

    }

}


// ==================================================
// ORIENTATION
// ==================================================

function handleOrientation(event) {

    if (!motionEnabled) {

        return;

    }


    const beta =
        event.beta || 0;


    const gamma =
        event.gamma || 0;


    console.log(
        "Orientation:",
        beta,
        gamma
    );


    document.getElementById(
        "beta"
    ).textContent =
        beta.toFixed(1);


    document.getElementById(
        "gamma"
    ).textContent =
        gamma.toFixed(1);


    sensorStatus.textContent =
        "Working";


    // ==============================================
    // CONVERT PHONE TILT TO MOVEMENT
    // ==============================================

    let x =
        gamma / 30;


    let y =
        (beta - 45) / 30;


    // Clamp

    x =
        Math.max(
            -1,
            Math.min(
                1,
                x
            )
        );


    y =
        Math.max(
            -1,
            Math.min(
                1,
                y
            )
        );


    // Dead zone

    if (
        Math.abs(x) < 0.15
    ) {

        x = 0;

    }


    if (
        Math.abs(y) < 0.15
    ) {

        y = 0;

    }


    document.getElementById(
        "movement"
    ).textContent =
        `${x.toFixed(2)}, ${y.toFixed(2)}`;


    sendMovement(
        x,
        y
    );

}


// ==================================================
// RAW MOTION DEBUG
// ==================================================

function handleMotion(event) {

    if (!motionEnabled) {

        return;

    }


    const acceleration =
        event.accelerationIncludingGravity;


    if (!acceleration) {

        return;

    }


    console.log(
        "Motion:",
        acceleration.x,
        acceleration.y,
        acceleration.z
    );

}


// ==================================================
// SEND MOVEMENT
// ==================================================

function sendMovement(
    x,
    y
) {

    if (!channel) {

        return;

    }


    if (
        channel.state !==
        "joined"
    ) {

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