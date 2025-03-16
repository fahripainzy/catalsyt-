const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const { platform } = require("os");
const { watchFile, unwatchFile } = require("fs");

const app = express();
const PORT = process.env.PORT || 3000; // Port harus dari Render

var isRunning = false;

function start(file) {
    if (isRunning) return;
    isRunning = true;

    let args = [path.join(__dirname, file), ...process.argv.slice(2)];
    let p = spawn(process.argv[0], args, {
        stdio: ["inherit", "inherit", "inherit", "ipc"]
    });

    p.on("message", (data) => {
        switch (data) {
            case "reset":
                platform() == "win32" ? p.kill("SIGINT") : p.kill();
                isRunning = false;
                start.apply(this, arguments);
                break;
        }
    });

    p.on("exit", (code) => {
        isRunning = false;
        if (code === 0) return;
        watchFile(args[0], () => {
            unwatchFile(args[0]);
            start(file);
        });
    });
}

// **Menjalankan server Express untuk membuka port**
app.get("/", (req, res) => {
    res.send("Bot is running!");
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

start("main.js");