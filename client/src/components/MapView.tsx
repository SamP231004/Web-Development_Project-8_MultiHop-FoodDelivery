import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

// 🔧 Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

// 🔥 Auto-fit map bounds
function FitBounds({ points }: { points: Point[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) return;

        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [points, map]);

    return null;
}

export default function MapView({ agents, orderRoute }: any) {
    const [agentRoutes, setAgentRoutes] = useState<AgentRoute[]>([]);
    const [mainRoute, setMainRoute] = useState<Point[]>([]);

    // 🔥 OSRM route fetch
    const getRoute = async (start: Point, end: Point) => {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );

        const data = await res.json();

        return data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({ lat, lng })
        );
    };

    // 🔴 Agent routes
    useEffect(() => {
        const fetchRoutes = async () => {
            const updated = await Promise.all(
                agents.map(async (agent: AgentRoute) => {
                    if (agent.start && agent.end) {
                        const route = await getRoute(agent.start, agent.end);
                        return { ...agent, route };
                    }
                    return agent;
                })
            );

            setAgentRoutes(updated);
        };

        fetchRoutes();
    }, [agents]);

    // 🟢 Main route
    useEffect(() => {
        const fetchMain = async () => {
            if (orderRoute.start && orderRoute.end) {
                const route = await getRoute(orderRoute.start, orderRoute.end);
                setMainRoute(route);
            }
        };

        fetchMain();
    }, [orderRoute]);

    const allPoints = [
        ...mainRoute,
        ...agentRoutes.flatMap((a) => a.route),
    ];

    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds points={allPoints} />

            {/* 🟢 Main Route */}
            {mainRoute.length > 0 && (
                <Polyline
                    positions={mainRoute.map((p) => [p.lat, p.lng])}
                    pathOptions={{ color: "green", weight: 5 }}
                />
            )}

            {/* 🔴 Agent Routes */}
            {agentRoutes.map((agent) =>
                agent.route.length > 0 ? (
                    <Polyline
                        key={agent.id}
                        positions={agent.route.map((p) => [p.lat, p.lng])}
                        pathOptions={{ color: agent.color, weight: 4 }}
                    />
                ) : null
            )}

            {/* 📍 Agent Start Markers */}
            {agentRoutes.map(
                (agent) =>
                    agent.start && (
                        <Marker
                            key={agent.id + "start"}
                            position={[agent.start.lat, agent.start.lng]}
                        />
                    )
            )}
        </MapContainer>
    );
}