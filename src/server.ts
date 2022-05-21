import * as express from "express";
import e = require("express");
import * as http from "http";
import * as WebSocket from "ws";

import * as packet from "./packets"

const canvasWidth: number = 400;
const canvasHeight: number = 400;


export interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    uuid: number;
}

interface PlayerData{
    username:string;
    isPartyLeader:boolean;
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

    ws.onclose = () =>{
        delete clients[ws.uuid];

        broadcastPlayerUpdate();
    }

    //connection is up, let's add a simple simple event
    ws.on("message", (message: string) => {
        
        let jsonData;

        try{
            jsonData = JSON.parse(message);
        }
        catch(error){
            console.log("invalid json")
            return
        }

        switch(jsonData.method){
            case "connect":
                if (typeof jsonData.username == "string" && jsonData.username != ""){
                    clients[ws.uuid].username = jsonData.username;
                }
                else{
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
                }

                ws.send(JSON.stringify(data));
            case "startGame":
                if (clients[ws.uuid].isPartyLeader){
                    let data = {
                        method: "startGame",
                        data: {
                            drawTime: 60,
                            promptTime: 25,
                            gameType: "default"
                        }
                    }

                    broadcast(JSON.stringify(data));

                }

        }
    });
});


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
        isPartyLeader: false
    }

    if (Object.keys(clients).length == 0){
        data.isPartyLeader = true;
    }

    clients[uuid] = data;
}

function broadcast(message:string){
    wss.clients.forEach((_ws:WebSocket) =>{
        const ws = _ws as ExtWebSocket;

        ws.send(message);
    })
}

function broadcastPlayerUpdate(){
    let data:any = {method: "updateUsers", data: clients};

    broadcast(JSON.stringify(data));
}