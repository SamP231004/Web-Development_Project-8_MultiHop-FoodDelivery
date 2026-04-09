import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import MapView from "./MapView";

export default function OrderTracker({ orderId }: { orderId: string }) {
    const [agents, setAgents] = useState<any[]>([]);

    useSocket(orderId, (data: any) => {
        setAgents(data.agents);
    });

    return (
        <div>
            <h2>Live Tracking</h2>
            <MapView agents={agents} />
        </div>
    );
}