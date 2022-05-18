let socket = connect("wss://localhost:8999")

socket.onopen = function(e) {
    socket.send("handshake");
};

socket.onmessage = (ev: MessageEvent) => {
    console.log(ev.data);
};

socket.onerror = (ev) =>{
    console.error(ev);
}


function connect(url:string){
    return new WebSocket(url);
}