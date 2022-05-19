import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";

import * as packet from "./packets"

const canvasWidth: number = 400;
const canvasHeight: number = 400;

let gameStarted = false;

export interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    uuid: number;
}

interface PlayerData{
    username:string
    isPartyLeader: boolean;
}

interface IClients {
    [key: number]:PlayerData
}

const clients:IClients = {};

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on("connection", (_ws: WebSocket) => {
    let ws = _ws as ExtWebSocket

    ws.uuid = genUUID();

    newPlayer(ws.uuid);

    //connection is up, let's add a simple simple event
    ws.on("message", (message: string) => {
        let jsonData;

        try{
            jsonData = JSON.parse(message);
        }
        catch(error){
            console.error("invalid json")
            return
        }

        switch(jsonData.method){
            case "connect":
                clients[ws.uuid].username = safe_tags(jsonData.username);
                if(Object.keys(clients).length == 1){
                    clients[ws.uuid].isPartyLeader = true;
                }
            case "getPlayers":
                let data:any = {
                    method:"updateUsers",
                    data:clients
                }

                ws.send(JSON.stringify(data));

        }

        console.log(message + ` from id: ${ws.uuid}, username: ${clients[ws.uuid].username}`);
    });

    //send immediatly a feedback to the incoming connection
    ws.send("connected to game!");
});

/*
setInterval(() => {
    wss.clients.forEach((_ws: WebSocket) => {
        const ws = _ws as ExtWebSocket;

        if (!ws.isAlive) {
            console.log("termenated " + ws.uuid);
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(null, false);
    });
}, 10000);
*/

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${(<any>server.address()).port}`);
});

function genUUID():number{
    let uuid = Math.floor(Math.random() * 1000000);

    if (clients[uuid]){
        return genUUID();
    }

    return uuid;
}

function newPlayer(uuid:number): void{

    //init default data
    let data:PlayerData = {
        username: "undefined",
        isPartyLeader: false,
    }

    clients[uuid] = data;
}

function safe_tags(str:string) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}