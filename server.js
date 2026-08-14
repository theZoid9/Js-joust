require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT || 3000;

const publicPath =
    path.join(__dirname, "public");


// ==========================================
// SERVE PUBLIC FILES
// ==========================================

app.use(
    express.static(publicPath)
);


// ==========================================
// SUPABASE CONFIG
// ==========================================

app.get("/config.js", (req, res) => {

    res.type(
        "application/javascript"
    );

    res.send(`
        window.SUPABASE_URL =
            ${JSON.stringify(
                process.env.SUPABASE_URL
            )};

        window.SUPABASE_KEY =
            ${JSON.stringify(
                process.env.SUPABASE_KEY
            )};
    `);

});


// ==========================================
// ROUTES
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "index.html"
        )
    );

});


app.get("/game", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "game.html"
        )
    );

});


app.get("/controller", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "controller.html"
        )
    );

});


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `JS Joust running on port ${PORT}`
        );

    }
);