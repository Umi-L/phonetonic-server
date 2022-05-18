"use strict";
let socket = connect("wss://localhost:8999");
socket.onopen = function (e) {
    socket.send("handshake");
};
socket.onmessage = (ev) => {
    console.log(ev.data);
};
socket.onerror = (ev) => {
    console.error(ev);
};
function connect(url) {
    return new WebSocket(url);
}
//# sourceMappingURL=index.js.map