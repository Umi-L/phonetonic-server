import * as express from "express";
import * as http from "http";
import { send } from "vite";
import * as WebSocket from "ws";

import * as packet from "./packets"

const canvasWidth: number = 400;
const canvasHeight: number = 400;


export interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    uuid: number;
}

interface PlayerData{
    username:string
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
            console.log("invalid json")
            return
        }

        switch(jsonData.method){
            case "connect":
                clients[ws.uuid].username = jsonData.username;
                break;
            case "getPlayers":
                let data:any = {method: "updateUsers", data: clients};

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
        username: "undefined"
    }

    clients[uuid] = data;
}

function broadcast(message:string){
    wss.clients.forEach((_ws:WebSocket) =>{
        const ws = _ws as ExtWebSocket;

        ws.send(message);
    })
}