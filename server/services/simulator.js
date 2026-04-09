import { emitLocationUpdate } from "./socket.service.js";

export const startSimulation = () => {
    setInterval(() => {
        emitLocationUpdate("test_order", {
            agents: [
                {
                    id: "agent1",
                    location: {
                        lat: 12.97 + Math.random() * 0.01,
                        lng: 77.59 + Math.random() * 0.01,
                    },
                },
            ],
        });
    }, 2000);
};