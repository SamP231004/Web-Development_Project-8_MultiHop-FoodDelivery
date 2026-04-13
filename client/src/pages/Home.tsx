import { useState } from "react";
import MapView from "../components/MapView";
import LocationSearch from "../components/LocationSearch";
import { v4 as uuidv4 } from "uuid";

type Point = {
    lat: number;
    lng: number;
};

type AgentRoute = {
    id: string;
    start: Point | null;
    end: Point | null;
    color: string;
    route: Point[];
};

const COLORS = ["red", "yellow", "orange", "purple"];

export default function Home() {
    const [agents, setAgents] = useState<AgentRoute[]>([
        {
            id: uuidv4(),
            start: null,
            end: null,
            color: "red",
            route: [],
        },
        {
            id: uuidv4(),
            start: null,
            end: null,
            color: "yellow",
            route: [],
        },
    ]);

    const [orderRoute, setOrderRoute] = useState<{
        start: Point | null;
        end: Point | null;
        route: Point[];
    }>({
        start: null,
        end: null,
        route: [],
    });

    const [agentSearchInputs, setAgentSearchInputs] = useState<
        Record<string, { startSearch: string; endSearch: string }>
    >({});
    const [orderSearchInputs, setOrderSearchInputs] = useState<{
        startSearch: string;
        endSearch: string;
    }>({
        startSearch: "",
        endSearch: "",
    });

    // ➕ Add new agent
    const addAgent = () => {
        setAgents((prev) => [
            ...prev,
            {
                id: uuidv4(),
                start: null,
                end: null,
                color: COLORS[prev.length % COLORS.length],
                route: [],
            },
        ]);
    };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw" }}>

            {/* LEFT PANEL */}
            <div
                style={{
                    width: "320px",
                    padding: "15px",
                    overflowY: "auto",
                    borderRight: "1px solid #ccc",
                    background: "#f9f9f9",
                }}
            >
                <h2>Agents</h2>

                {agents.map((agent, index) => (
                    <div key={agent.id} style={{ marginBottom: "20px" }}>
                        <h4>Agent {index + 1}</h4>

                        <LocationSearch
                            placeholder="🔍 Search pickup location..."
                            value={agentSearchInputs[agent.id]?.startSearch || ""}
                            onChange={(text) => {
                                setAgentSearchInputs((prev) => ({
                                    ...prev,
                                    [agent.id]: {
                                        startSearch: text,
                                        endSearch: prev[agent.id]?.endSearch || "",
                                    },
                                }));
                            }}
                            onSelect={(location) => {
                                setAgentSearchInputs((prev) => ({
                                    ...prev,
                                    [agent.id]: {
                                        startSearch: location.name,
                                        endSearch: prev[agent.id]?.endSearch || "",
                                    },
                                }));
                                const updated = [...agents];
                                updated[index].start = {
                                    lat: location.lat,
                                    lng: location.lng,
                                };
                                setAgents(updated);
                            }}
                        />

                        <LocationSearch
                            placeholder="🔍 Search dropoff location..."
                            value={agentSearchInputs[agent.id]?.endSearch || ""}
                            onChange={(text) => {
                                setAgentSearchInputs((prev) => ({
                                    ...prev,
                                    [agent.id]: {
                                        startSearch: prev[agent.id]?.startSearch || "",
                                        endSearch: text,
                                    },
                                }));
                            }}
                            onSelect={(location) => {
                                setAgentSearchInputs((prev) => ({
                                    ...prev,
                                    [agent.id]: {
                                        startSearch: prev[agent.id]?.startSearch || "",
                                        endSearch: location.name,
                                    },
                                }));
                                const updated = [...agents];
                                updated[index].end = {
                                    lat: location.lat,
                                    lng: location.lng,
                                };
                                setAgents(updated);
                            }}
                        />
                    </div>
                ))}

                <button onClick={addAgent} style={{ marginBottom: "20px" }}>
                    ➕ Add Agent
                </button>

                <hr />

                <h2>Main Order</h2>

                <LocationSearch
                    placeholder="🔍 Search restaurant..."
                    value={orderSearchInputs.startSearch}
                    onChange={(text) => {
                        setOrderSearchInputs((prev) => ({
                            ...prev,
                            startSearch: text,
                        }));
                    }}
                    onSelect={(location) => {
                        setOrderSearchInputs((prev) => ({
                            ...prev,
                            startSearch: location.name,
                        }));
                        setOrderRoute((prev) => ({
                            ...prev,
                            start: { lat: location.lat, lng: location.lng },
                        }));
                    }}
                />

                <LocationSearch
                    placeholder="🔍 Search delivery address..."
                    value={orderSearchInputs.endSearch}
                    onChange={(text) => {
                        setOrderSearchInputs((prev) => ({
                            ...prev,
                            endSearch: text,
                        }));
                    }}
                    onSelect={(location) => {
                        setOrderSearchInputs((prev) => ({
                            ...prev,
                            endSearch: location.name,
                        }));
                        setOrderRoute((prev) => ({
                            ...prev,
                            end: { lat: location.lat, lng: location.lng },
                        }));
                    }}
                />
            </div>

            {/* MAP */}
            <div style={{ flex: 1 }}>
                <MapView agents={agents} orderRoute={orderRoute} />
            </div>
        </div>
    );
}