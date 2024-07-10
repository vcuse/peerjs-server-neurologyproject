const express = require("express");
const { ExpressPeerServer } = require("peer");
const app = express();

app.enable("trust proxy");

const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log("Press Ctrl+C to quit.");
});

const peerServer = ExpressPeerServer(server, {
    path: "/",
    allow_discovery: true //lets u c online users
});

app.use("/", peerServer);

module.exports = app;
