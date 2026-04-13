import {
    CircleMarker,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";

export type RelayPoint = {
    lat: number;
    lng: number;
};

type AgentRoute = {
    id: string;
    name: string;
    start: RelayPoint | null;
    end: RelayPoint | null;
    startName: string;
    endName: string;
    color: string;
    route: RelayPoint[];
};

type OrderRoute = {
    start: RelayPoint | null;
    end: RelayPoint | null;
    startName: string;
    endName: string;
};

export type RelayLink = {
    id: string;
    label: string;
    description: string;
    point: RelayPoint;
    color?: string;
};

export type RelayAnalysis = {
    agentOrderLinks: RelayLink[];
    agentAgentLinks: RelayLink[];
};

export type MapPickTarget =
    | { type: "order-start" }
    | { type: "order-end" }
    | { type: "agent-start"; agentId: string }
    | { type: "agent-end"; agentId: string };

type MapViewProps = {
    agents: AgentRoute[];
    orderRoute: OrderRoute;
    activePickTarget?: MapPickTarget | null;
    onMapPick?: (target: MapPickTarget, point: RelayPoint) => void;
    onAnalysisChange?: (analysis: RelayAnalysis) => void;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const HANDOFF_THRESHOLD_METERS = 180;
const routeCache = new Map<string, RelayPoint[]>();

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FitBounds({ points }: { points: RelayPoint[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) {
            return;
        }

        const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
        map.fitBounds(bounds, { padding: [48, 48] });
    }, [map, points]);

    return null;
}

function MapCursorMode({ isPicking }: { isPicking: boolean }) {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        container.classList.toggle("map-pick-active", isPicking);

        return () => {
            container.classList.remove("map-pick-active");
        };
    }, [isPicking, map]);

    return null;
}

function MapPicker({
    activePickTarget,
    onMapPick,
}: {
    activePickTarget?: MapPickTarget | null;
    onMapPick?: (target: MapPickTarget, point: RelayPoint) => void;
}) {
    useMapEvents({
        click(event) {
            if (!activePickTarget || !onMapPick) {
                return;
            }

            onMapPick(activePickTarget, {
                lat: Number(event.latlng.lat.toFixed(6)),
                lng: Number(event.latlng.lng.toFixed(6)),
            });
        },
    });

    return null;
}

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

function distanceMeters(a: RelayPoint, b: RelayPoint) {
    const earthRadius = 6371000;
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);

    const haversine =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function midpoint(a: RelayPoint, b: RelayPoint): RelayPoint {
    return {
        lat: (a.lat + b.lat) / 2,
        lng: (a.lng + b.lng) / 2,
    };
}

function findClosestSharedPoint(routeA: RelayPoint[], routeB: RelayPoint[]) {
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPoint: RelayPoint | null = null;

    for (const pointA of routeA) {
        for (const pointB of routeB) {
            const currentDistance = distanceMeters(pointA, pointB);

            if (currentDistance < bestDistance) {
                bestDistance = currentDistance;
                bestPoint = midpoint(pointA, pointB);
            }
        }
    }

    if (!bestPoint || bestDistance > HANDOFF_THRESHOLD_METERS) {
        return null;
    }

    return {
        point: bestPoint,
        distanceMeters: Math.round(bestDistance),
    };
}

function createRouteKey(start: RelayPoint, end: RelayPoint) {
    return `${start.lat},${start.lng}:${end.lat},${end.lng}`;
}

async function getRoute(start: RelayPoint, end: RelayPoint) {
    const cacheKey = createRouteKey(start, end);
    const cached = routeCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (!response.ok || !data.routes?.[0]?.geometry?.coordinates) {
        throw new Error("Unable to fetch route from OSRM");
    }

    const route = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
    }));

    routeCache.set(cacheKey, route);
    return route;
}

function getMapPickLabel(target: MapPickTarget | null | undefined, agents: AgentRoute[]) {
    if (!target) {
        return null;
    }

    if (target.type === "order-start") {
        return "Click anywhere on the map to pin the restaurant.";
    }

    if (target.type === "order-end") {
        return "Click anywhere on the map to pin the customer location.";
    }

    const agent = agents.find((item) => item.id === target.agentId);
    const suffix = target.type === "agent-start" ? "start corridor" : "end corridor";
    return `Click anywhere on the map to pin ${agent?.name || "the agent"} ${suffix}.`;
}

function RouteLine({
    positions,
    color,
    dashArray,
    weight = 5,
}: {
    positions: [number, number][];
    color: string;
    dashArray?: string;
    weight?: number;
}) {
    return (
        <>
            <Polyline
                positions={positions}
                pathOptions={{
                    color: "#ffffff",
                    weight: weight + 4,
                    opacity: 0.95,
                }}
            />
            <Polyline
                positions={positions}
                pathOptions={{
                    color,
                    weight,
                    opacity: 0.98,
                    dashArray,
                    lineCap: "round",
                    lineJoin: "round",
                }}
            />
        </>
    );
}

export default function MapView({
    agents,
    orderRoute,
    activePickTarget,
    onMapPick,
    onAnalysisChange,
}: MapViewProps) {
    const [agentRoutes, setAgentRoutes] = useState<AgentRoute[]>([]);
    const [mainRoute, setMainRoute] = useState<RelayPoint[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchRoutes = async () => {
            const updated = await Promise.all(
                agents.map(async (agent) => {
                    if (!agent.start || !agent.end) {
                        return { ...agent, route: [] };
                    }

                    try {
                        const route = await getRoute(agent.start, agent.end);
                        return { ...agent, route };
                    } catch {
                        return { ...agent, route: [] };
                    }
                })
            );

            if (!cancelled) {
                setAgentRoutes(updated);
            }
        };

        fetchRoutes();

        return () => {
            cancelled = true;
        };
    }, [agents]);

    useEffect(() => {
        let cancelled = false;

        const fetchMainRoute = async () => {
            if (!orderRoute.start || !orderRoute.end) {
                setMainRoute([]);
                return;
            }

            try {
                const route = await getRoute(orderRoute.start, orderRoute.end);

                if (!cancelled) {
                    setMainRoute(route);
                }
            } catch {
                if (!cancelled) {
                    setMainRoute([]);
                }
            }
        };

        fetchMainRoute();

        return () => {
            cancelled = true;
        };
    }, [orderRoute.end, orderRoute.start]);

    const relayAnalysis = useMemo<RelayAnalysis>(() => {
        const agentOrderLinks: RelayLink[] = [];
        const agentAgentLinks: RelayLink[] = [];

        if (mainRoute.length > 0) {
            for (const agent of agentRoutes) {
                if (agent.route.length === 0) {
                    continue;
                }

                const closest = findClosestSharedPoint(mainRoute, agent.route);

                if (!closest) {
                    continue;
                }

                agentOrderLinks.push({
                    id: `order-${agent.id}`,
                    label: `${agent.name} touches the main order route`,
                    description: `${agent.name} can meet the order corridor near this point. Approximate route gap: ${closest.distanceMeters} m.`,
                    point: closest.point,
                    color: agent.color,
                });
            }
        }

        for (let index = 0; index < agentRoutes.length; index += 1) {
            const current = agentRoutes[index];

            if (current.route.length === 0) {
                continue;
            }

            for (let nextIndex = index + 1; nextIndex < agentRoutes.length; nextIndex += 1) {
                const next = agentRoutes[nextIndex];

                if (next.route.length === 0) {
                    continue;
                }

                const closest = findClosestSharedPoint(current.route, next.route);

                if (!closest) {
                    continue;
                }

                agentAgentLinks.push({
                    id: `${current.id}-${next.id}`,
                    label: `${current.name} can hand off to ${next.name}`,
                    description: `Their planned paths come within ${closest.distanceMeters} m, so this is a practical relay point.`,
                    point: closest.point,
                    color: current.color,
                });
            }
        }

        return {
            agentOrderLinks,
            agentAgentLinks,
        };
    }, [agentRoutes, mainRoute]);

    useEffect(() => {
        onAnalysisChange?.(relayAnalysis);
    }, [onAnalysisChange, relayAnalysis]);

    const allPoints = useMemo(() => {
        const points: RelayPoint[] = [...mainRoute];

        for (const agent of agentRoutes) {
            points.push(...agent.route);
            if (agent.start) {
                points.push(agent.start);
            }
            if (agent.end) {
                points.push(agent.end);
            }
        }

        if (orderRoute.start) {
            points.push(orderRoute.start);
        }
        if (orderRoute.end) {
            points.push(orderRoute.end);
        }

        for (const link of relayAnalysis.agentOrderLinks) {
            points.push(link.point);
        }
        for (const link of relayAnalysis.agentAgentLinks) {
            points.push(link.point);
        }

        return points;
    }, [agentRoutes, mainRoute, orderRoute.end, orderRoute.start, relayAnalysis]);

    const mapPickLabel = useMemo(
        () => getMapPickLabel(activePickTarget, agentRoutes),
        [activePickTarget, agentRoutes]
    );

    return (
        <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds points={allPoints} />
            <MapCursorMode isPicking={Boolean(activePickTarget)} />
            <MapPicker activePickTarget={activePickTarget} onMapPick={onMapPick} />

            {mainRoute.length > 0 && (
                <RouteLine
                    positions={mainRoute.map((point) => [point.lat, point.lng])}
                    color="#ef4f5f"
                    weight={6}
                />
            )}

            {agentRoutes.map((agent) =>
                agent.route.length > 0 ? (
                    <RouteLine
                        key={agent.id}
                        positions={agent.route.map((point) => [point.lat, point.lng])}
                        color={agent.color}
                        weight={5}
                        dashArray="14 10"
                    />
                ) : null
            )}

            {orderRoute.start && (
                <Marker position={[orderRoute.start.lat, orderRoute.start.lng]}>
                    <Popup>
                        <div className="marker-popup">
                            <h4>Restaurant</h4>
                            <p>{orderRoute.startName || "Pickup point"}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {orderRoute.end && (
                <Marker position={[orderRoute.end.lat, orderRoute.end.lng]}>
                    <Popup>
                        <div className="marker-popup">
                            <h4>Customer</h4>
                            <p>{orderRoute.endName || "Drop-off point"}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {agentRoutes.map((agent) =>
                agent.start ? (
                    <CircleMarker
                        key={`${agent.id}-start`}
                        center={[agent.start.lat, agent.start.lng]}
                        radius={8}
                        pathOptions={{
                            color: "#ffffff",
                            weight: 3,
                            fillColor: agent.color,
                            fillOpacity: 1,
                        }}
                    >
                        <Popup>
                            <div className="marker-popup">
                                <h4>{agent.name} start</h4>
                                <p>{agent.startName || "Agent pickup corridor"}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ) : null
            )}

            {agentRoutes.map((agent) =>
                agent.end ? (
                    <CircleMarker
                        key={`${agent.id}-end`}
                        center={[agent.end.lat, agent.end.lng]}
                        radius={8}
                        pathOptions={{
                            color: agent.color,
                            weight: 3,
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                        }}
                    >
                        <Popup>
                            <div className="marker-popup">
                                <h4>{agent.name} end</h4>
                                <p>{agent.endName || "Agent drop corridor"}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ) : null
            )}

            {relayAnalysis.agentOrderLinks.map((link) => (
                <CircleMarker
                    key={link.id}
                    center={[link.point.lat, link.point.lng]}
                    radius={10}
                    pathOptions={{
                        color: "#ffffff",
                        fillColor: "#ffb300",
                        fillOpacity: 1,
                        weight: 4,
                    }}
                >
                    <Popup>
                        <div className="handoff-popup">
                            <h4>{link.label}</h4>
                            <p>{link.description}</p>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {relayAnalysis.agentAgentLinks.map((link) => (
                <CircleMarker
                    key={link.id}
                    center={[link.point.lat, link.point.lng]}
                    radius={9}
                    pathOptions={{
                        color: "#ffffff",
                        fillColor: "#3f7df4",
                        fillOpacity: 1,
                        weight: 4,
                    }}
                >
                    <Popup>
                        <div className="handoff-popup">
                            <h4>{link.label}</h4>
                            <p>{link.description}</p>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {activePickTarget && mapPickLabel && (
                <div className="map-picker-overlay leaflet-top leaflet-right">
                    <div className="map-picker-card">
                        <span className="pulse-dot" />
                        <p>{mapPickLabel}</p>
                    </div>
                </div>
            )}
        </MapContainer>
    );
}
