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
    ws.onclose = () => {
        delete clients[ws.uuid];
        broadcastPlayerUpdate();
    };
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
                if (typeof jsonData.username == "string" && jsonData.username != "") {
                    clients[ws.uuid].username = jsonData.username;
                }
                else {
                    ws.close();
                }
                break;
            case "getPlayers":
                broadcastPlayerUpdate();
                break;
            case "getSelf":
                let data = {
                    method: "sendSelf",
                    data: clients[ws.uuid]
                };
                ws.send(JSON.stringify(data));
            case "startGame":
                if (clients[ws.uuid].isPartyLeader) {
                    let data = {
                        method: "startGame",
                        data: {
                            drawTime: 60,
                            promptTime: 25,
                            gameType: "default"
                        }
                    };
                    broadcast(JSON.stringify(data));
                }
        }
    });
});
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
        username: "undefined",
        isPartyLeader: false
    };
    if (Object.keys(clients).length == 0) {
        data.isPartyLeader = true;
    }
    clients[uuid] = data;
}
function broadcast(message) {
    wss.clients.forEach((_ws) => {
        const ws = _ws;
        ws.send(message);
    });
}
function broadcastPlayerUpdate() {
    let data = { method: "updateUsers", data: clients };
    broadcast(JSON.stringify(data));
}
//# sourceMappingURL=server.js.map