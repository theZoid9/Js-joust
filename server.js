const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const publicPath = path.join(__dirname, "public");


// Serve static files
app.use(express.static(publicPath));


// Send Supabase configuration
app.get("/config.js", (req, res) => {

    res.type("application/javascript");

    res.send(`
        window.SUPABASE_URL = ${JSON.stringify(
            process.env.SUPABASE_URL
        )};

        window.SUPABASE_KEY = ${JSON.stringify(
            process.env.SUPABASE_KEY
        )};
    `);

});


// Game page
app.get("/game", (req, res) => {

    res.sendFile(
        path.join(publicPath, "game.html")
    );

});


// Controller page
app.get("/controller", (req, res) => {

    res.sendFile(
        path.join(publicPath, "controller.html")
    );

});


app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});