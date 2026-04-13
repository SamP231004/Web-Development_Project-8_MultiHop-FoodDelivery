import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("agent:join", { agentId: "agent-1" });

    setInterval(() => {
        socket.emit("agent:location:update", {
            agentId: "agent-1",
            lat: 12.9716 + Math.random() * 0.01,
            lng: 77.5946 + Math.random() * 0.01,
        });
    }, 2000);
});

socket.on("agent:location:broadcast", (data) => {
    console.log("Broadcast:", data);
});