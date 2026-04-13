import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import LocationSearch from "../components/LocationSearch";
import MapView, {
    type MapPickTarget,
    type RelayAnalysis,
    type RelayPoint,
} from "../components/MapView";
import "./home.css";

type Point = {
    lat: number;
    lng: number;
};

type AgentRoute = {
    id: string;
    name: string;
    start: Point | null;
    end: Point | null;
    startName: string;
    endName: string;
    color: string;
    route: Point[];
};

type OrderRoute = {
    start: Point | null;
    end: Point | null;
    startName: string;
    endName: string;
    route: Point[];
};

const COLORS = ["#12b886", "#3f7df4", "#ff7f50", "#8b5cf6", "#0ea5e9", "#f59e0b"];

const createAgent = (index: number): AgentRoute => ({
    id: uuidv4(),
    name: `Agent ${index + 1}`,
    start: null,
    end: null,
    startName: "",
    endName: "",
    color: COLORS[index % COLORS.length],
    route: [],
});

function formatPoint(point: RelayPoint) {
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function formatInlineLocation(point: Point | null, name: string) {
    if (!point) {
        return "Waiting for location";
    }

    if (name) {
        return `${name} · ${formatPoint(point)}`;
    }

    return formatPoint(point);
}

function isAgentTarget(
    target: MapPickTarget | null | undefined
): target is Extract<MapPickTarget, { agentId: string }> {
    return Boolean(target && "agentId" in target);
}

export default function Home() {
    const [agents, setAgents] = useState<AgentRoute[]>([createAgent(0), createAgent(1)]);
    const [orderRoute, setOrderRoute] = useState<OrderRoute>({
        start: null,
        end: null,
        startName: "",
        endName: "",
        route: [],
    });
    const [relayAnalysis, setRelayAnalysis] = useState<RelayAnalysis>({
        agentOrderLinks: [],
        agentAgentLinks: [],
    });
    const [mapPickTarget, setMapPickTarget] = useState<MapPickTarget | null>(null);

    const [agentSearchInputs, setAgentSearchInputs] = useState<
        Record<string, { startSearch: string; endSearch: string }>
    >({});
    const [orderSearchInputs, setOrderSearchInputs] = useState({
        startSearch: "",
        endSearch: "",
    });

    const addAgent = () => {
        setAgents((prev) => [...prev, createAgent(prev.length)]);
    };

    const removeAgent = (agentId: string) => {
        setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
        setAgentSearchInputs((prev) => {
            const next = { ...prev };
            delete next[agentId];
            return next;
        });
        setMapPickTarget((prev) => (isAgentTarget(prev) && prev.agentId === agentId ? null : prev));
    };

    const configuredAgents = useMemo(
        () => agents.filter((agent) => agent.start && agent.end).length,
        [agents]
    );

    const canAnalyze = Boolean(orderRoute.start && orderRoute.end && configuredAgents > 0);

    const selectedMapHelp = useMemo(() => {
        if (!mapPickTarget) {
            return "Choose any field and then click on the map to drop exact coordinates.";
        }

        if (mapPickTarget.type === "order-start") {
            return "Map picker is active for the restaurant field.";
        }

        if (mapPickTarget.type === "order-end") {
            return "Map picker is active for the customer field.";
        }

        const agent = agents.find((item) => item.id === mapPickTarget.agentId);
        const phase = mapPickTarget.type === "agent-start" ? "start corridor" : "end corridor";
        return `Map picker is active for ${agent?.name || "the selected agent"} ${phase}.`;
    }, [agents, mapPickTarget]);

    const applyPickedLocation = (target: MapPickTarget, point: RelayPoint) => {
        const coordinateLabel = `Pinned ${formatPoint(point)}`;

        if (target.type === "order-start") {
            setOrderSearchInputs((prev) => ({
                ...prev,
                startSearch: coordinateLabel,
            }));
            setOrderRoute((prev) => ({
                ...prev,
                start: point,
                startName: coordinateLabel,
            }));
            return;
        }

        if (target.type === "order-end") {
            setOrderSearchInputs((prev) => ({
                ...prev,
                endSearch: coordinateLabel,
            }));
            setOrderRoute((prev) => ({
                ...prev,
                end: point,
                endName: coordinateLabel,
            }));
            return;
        }

        setAgentSearchInputs((prev) => ({
            ...prev,
            [target.agentId]: {
                startSearch:
                    target.type === "agent-start"
                        ? coordinateLabel
                        : prev[target.agentId]?.startSearch || "",
                endSearch:
                    target.type === "agent-end"
                        ? coordinateLabel
                        : prev[target.agentId]?.endSearch || "",
            },
        }));

        setAgents((prev) =>
            prev.map((agent) => {
                if (agent.id !== target.agentId) {
                    return agent;
                }

                if (target.type === "agent-start") {
                    return {
                        ...agent,
                        start: point,
                        startName: coordinateLabel,
                    };
                }

                return {
                    ...agent,
                    end: point,
                    endName: coordinateLabel,
                };
            })
        );
    };

    return (
        <div className="home-layout">
            <aside className="control-panel">
                <div className="panel-header card-sheen">
                    <div className="hero-topline">
                        <p className="eyebrow">Multi-Hop Food Delivery</p>
                        <span className="header-badge">Live planner</span>
                    </div>
                    <h1>Plan a multi-hop order the Zomato way.</h1>
                    <p className="panel-copy">
                        Search normally when Nominatim knows the place, or switch to map pick
                        mode and click the exact road, gate, or handoff pocket you want.
                    </p>
                    <div className="hero-stats">
                        <div className="stat-chip">
                            <strong>{agents.length}</strong>
                            <span>Agents</span>
                        </div>
                        <div className="stat-chip">
                            <strong>{relayAnalysis.agentOrderLinks.length}</strong>
                            <span>Order links</span>
                        </div>
                        <div className="stat-chip">
                            <strong>{relayAnalysis.agentAgentLinks.length}</strong>
                            <span>Relay links</span>
                        </div>
                    </div>
                </div>

                <section className="panel-section compact-section">
                    <div className="map-pick-banner">
                        <div>
                            <p className="section-kicker">Map selection</p>
                            <h3>Pin exact coordinates</h3>
                            <p>{selectedMapHelp}</p>
                        </div>
                        {mapPickTarget && (
                            <button
                                className="ghost-button"
                                type="button"
                                onClick={() => setMapPickTarget(null)}
                            >
                                Cancel map pick
                            </button>
                        )}
                    </div>
                </section>

                <section className="panel-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Agents</p>
                            <h2>Available corridors</h2>
                        </div>
                        <button className="secondary-button" onClick={addAgent} type="button">
                            Add agent
                        </button>
                    </div>

                    <div className="agent-stack">
                        {agents.map((agent, index) => {
                            const isPickingAgentStart =
                                mapPickTarget?.type === "agent-start" &&
                                isAgentTarget(mapPickTarget) &&
                                mapPickTarget.agentId === agent.id;
                            const isPickingAgentEnd =
                                mapPickTarget?.type === "agent-end" &&
                                isAgentTarget(mapPickTarget) &&
                                mapPickTarget.agentId === agent.id;

                            return (
                                <article key={agent.id} className="agent-card card-sheen">
                                    <div className="agent-card-header">
                                        <div
                                            className="agent-swatch"
                                            style={{ backgroundColor: agent.color }}
                                        />
                                        <div className="agent-card-title">
                                            <div>
                                                <h3>{agent.name}</h3>
                                                <p>
                                                    {agent.startName && agent.endName
                                                        ? `${agent.startName} to ${agent.endName}`
                                                        : "Pickup and drop corridor pending"}
                                                </p>
                                            </div>
                                            {agents.length > 1 && (
                                                <button
                                                    className="ghost-icon-button"
                                                    type="button"
                                                    onClick={() => removeAgent(agent.id)}
                                                    aria-label={`Remove ${agent.name}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="field-block">
                                        <div className="field-label-row">
                                            <span className="field-label">Start corridor</span>
                                            <button
                                                className={
                                                    isPickingAgentStart
                                                        ? "mini-button active"
                                                        : "mini-button"
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setMapPickTarget({
                                                        type: "agent-start",
                                                        agentId: agent.id,
                                                    })
                                                }
                                            >
                                                Pick from map
                                            </button>
                                        </div>
                                        <LocationSearch
                                            placeholder="Search agent pickup corridor"
                                            value={agentSearchInputs[agent.id]?.startSearch || ""}
                                            accentColor={agent.color}
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

                                                setAgents((prev) =>
                                                    prev.map((current, currentIndex) =>
                                                        currentIndex === index
                                                            ? {
                                                                ...current,
                                                                start: {
                                                                    lat: location.lat,
                                                                    lng: location.lng,
                                                                },
                                                                startName: location.name,
                                                            }
                                                            : current
                                                    )
                                                );
                                            }}
                                        />
                                        <p className="field-meta">
                                            {formatInlineLocation(agent.start, agent.startName)}
                                        </p>
                                    </div>

                                    <div className="field-block">
                                        <div className="field-label-row">
                                            <span className="field-label">End corridor</span>
                                            <button
                                                className={
                                                    isPickingAgentEnd
                                                        ? "mini-button active"
                                                        : "mini-button"
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setMapPickTarget({
                                                        type: "agent-end",
                                                        agentId: agent.id,
                                                    })
                                                }
                                            >
                                                Pick from map
                                            </button>
                                        </div>
                                        <LocationSearch
                                            placeholder="Search agent drop corridor"
                                            value={agentSearchInputs[agent.id]?.endSearch || ""}
                                            accentColor={agent.color}
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

                                                setAgents((prev) =>
                                                    prev.map((current, currentIndex) =>
                                                        currentIndex === index
                                                            ? {
                                                                ...current,
                                                                end: {
                                                                    lat: location.lat,
                                                                    lng: location.lng,
                                                                },
                                                                endName: location.name,
                                                            }
                                                            : current
                                                    )
                                                );
                                            }}
                                        />
                                        <p className="field-meta">
                                            {formatInlineLocation(agent.end, agent.endName)}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className="panel-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Order</p>
                            <h2>Main trip</h2>
                        </div>
                    </div>

                    <div className="order-card card-sheen">
                        <div className="field-block">
                            <div className="field-label-row">
                                <span className="field-label">Restaurant</span>
                                <button
                                    className={
                                        mapPickTarget?.type === "order-start"
                                            ? "mini-button active"
                                            : "mini-button"
                                    }
                                    type="button"
                                    onClick={() => setMapPickTarget({ type: "order-start" })}
                                >
                                    Pick from map
                                </button>
                            </div>
                            <LocationSearch
                                placeholder="Search restaurant"
                                value={orderSearchInputs.startSearch}
                                accentColor="#00a6a6"
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
                                        startName: location.name,
                                    }));
                                }}
                            />
                            <p className="field-meta">
                                {formatInlineLocation(orderRoute.start, orderRoute.startName)}
                            </p>
                        </div>

                        <div className="field-block">
                            <div className="field-label-row">
                                <span className="field-label">Customer</span>
                                <button
                                    className={
                                        mapPickTarget?.type === "order-end"
                                            ? "mini-button active"
                                            : "mini-button"
                                    }
                                    type="button"
                                    onClick={() => setMapPickTarget({ type: "order-end" })}
                                >
                                    Pick from map
                                </button>
                            </div>
                            <LocationSearch
                                placeholder="Search delivery address"
                                value={orderSearchInputs.endSearch}
                                accentColor="#ff5d8f"
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
                                        endName: location.name,
                                    }));
                                }}
                            />
                            <p className="field-meta">
                                {formatInlineLocation(orderRoute.end, orderRoute.endName)}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="panel-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Relay analysis</p>
                            <h2>Where handoffs can happen</h2>
                        </div>
                    </div>

                    {!canAnalyze && (
                        <div className="empty-state card-sheen">
                            Add a restaurant, customer, and at least one fully defined agent
                            route to compute relay opportunities.
                        </div>
                    )}

                    {canAnalyze && relayAnalysis.agentOrderLinks.length === 0 && (
                        <div className="empty-state card-sheen">
                            None of the current agent routes touch the order corridor yet. Try
                            adjusting one of the agent paths closer to the main route.
                        </div>
                    )}

                    {relayAnalysis.agentOrderLinks.length > 0 && (
                        <div className="summary-list">
                            {relayAnalysis.agentOrderLinks.map((link) => (
                                <article key={link.id} className="summary-card card-sheen">
                                    <span className="summary-pill">Agent meets order</span>
                                    <h3>{link.label}</h3>
                                    <p>{link.description}</p>
                                    <p className="summary-meta">
                                        Coordinates: {formatPoint(link.point)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}

                    {relayAnalysis.agentAgentLinks.length > 0 && (
                        <div className="summary-list spaced-list">
                            {relayAnalysis.agentAgentLinks.map((link) => (
                                <article key={link.id} className="summary-card card-sheen">
                                    <span className="summary-pill warm">Agent-to-agent</span>
                                    <h3>{link.label}</h3>
                                    <p>{link.description}</p>
                                    <p className="summary-meta">
                                        Coordinates: {formatPoint(link.point)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </aside>

            <main className="map-shell">
                <div className="map-header">
                    <div>
                        <p className="eyebrow">Live view</p>
                        <h2>Route overlap, pin drops, and handoff map</h2>
                    </div>
                    <div className="map-legend">
                        <span><i className="legend-dot order" />Main order path</span>
                        <span><i className="legend-dot handoff" />Handoff candidate</span>
                        <span><i className="legend-dot picker" />Map pick mode</span>
                    </div>
                </div>

                <div className="map-frame">
                    <MapView
                        agents={agents}
                        orderRoute={orderRoute}
                        activePickTarget={mapPickTarget}
                        onMapPick={(target, point) => {
                            applyPickedLocation(target, point);
                            setMapPickTarget(null);
                        }}
                        onAnalysisChange={setRelayAnalysis}
                    />
                </div>
            </main>
        </div>
    );
}
