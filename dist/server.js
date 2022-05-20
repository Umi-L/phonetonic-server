"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const canvasWidth = 400;
const canvasHeight = 400;
const clients = {};
const app = express();
//initialize a simple http server
const server = http.createServer(app);
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
wss.on("connection", (_ws) => {
    let ws = _ws;
    ws.uuid = genUUID();
    newPlayer(ws.uuid);
    //connection is up, let's add a simple simple event
    ws.on("message", (message) => {
        let jsonData;
        try {
            jsonData = JSON.parse(message);
        }
        catch (error) {
            console.log("invalid json");
            return;
        }
        switch (jsonData.method) {
            case "connect":
                clients[ws.uuid].username = jsonData.username;
                break;
            case "getPlayers":
                let data = { method: "updateUsers", data: clients };
                broadcast(JSON.stringify(data));
                break;
        }
    });
});
// setInterval(() => {
//     wss.clients.forEach((_ws: WebSocket) => {
//         const ws = _ws as ExtWebSocket;
//         if (!ws.isAlive) {
//             console.log("termenated " + ws.uuid);
//             return ws.terminate();
//         }
//         ws.isAlive = false;
//         ws.ping(null, false);
//     });
// }, 10000);
//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port}`);
});
function genUUID() {
    let uuid = Math.floor(Math.random() * 1000000);
    if (clients[uuid]) {
        return genUUID();
    }
    return uuid;
}
function newPlayer(uuid) {
    //init default data
    let data = {
        username: "undefined"
    };
    clients[uuid] = data;
}
function broadcast(message) {
    wss.clients.forEach((_ws) => {
        const ws = _ws;
        ws.send(message);
    });
}
//# sourceMappingURL=server.js.map