import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import MapView from "./MapView";

export default function OrderTracker({ orderId }: { orderId: string }) {
    const [agents, setAgents] = useState<any[]>([]);

    useSocket(orderId, (data: any) => {
        setAgents(data.agents);
    });

    const normalizedAgents = agents.map((agent, index) => ({
        id: agent.id || agent.agentId || `agent-${index}`,
        name: agent.name || `Agent ${index + 1}`,
        start: agent.start || agent.location || null,
        end: agent.end || null,
        startName: agent.startName || "Live location",
        endName: agent.endName || "Awaiting end point",
        color: agent.color || "#d84f3d",
        route: Array.isArray(agent.route) ? agent.route : [],
    }));

    return (
        <div>
            <h2>Live Tracking</h2>
            <MapView
                agents={normalizedAgents}
                orderRoute={{
                    start: null,
                    end: null,
                    startName: "",
                    endName: "",
                }}
            />
        </div>
    );
}
