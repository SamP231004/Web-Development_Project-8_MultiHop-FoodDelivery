import { useEffect } from "react";
import { socket } from "../socket";

export const useAgentTracking = (agentId: string) => {
    useEffect(() => {
        if (!agentId) return;

        socket.emit("agent:join", { agentId });

        const interval = setInterval(() => {
            const lat = 12.9716 + Math.random() * 0.01;
            const lng = 77.5946 + Math.random() * 0.01;

            console.log("📍 Sending:", lat, lng);

            socket.emit("agent:location:update", {
                agentId,
                lat,
                lng,
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [agentId]);
};