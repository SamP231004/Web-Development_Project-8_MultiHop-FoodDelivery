import { useEffect, useState } from "react";
import { socket } from "../socket";

export const useAgentLocations = () => {
    const [agents, setAgents] = useState<Record<string, any>>({});

    useEffect(() => {
        console.log("📡 Listening for agents...");

        const handleUpdate = (data: any) => {
            console.log("📡 Received:", data);

            setAgents((prev) => ({
                ...prev,
                [data.agentId]: {
                    id: data.agentId,
                    location: { lat: data.lat, lng: data.lng },
                },
            }));
        };

        socket.on("agent:location:broadcast", handleUpdate);

        socket.on("connect", () => {
            console.log("📡 Socket connected (listener side)");
        });

        return () => {
            socket.off("agent:location:broadcast", handleUpdate);
        };
    }, []);

    return Object.values(agents);
};