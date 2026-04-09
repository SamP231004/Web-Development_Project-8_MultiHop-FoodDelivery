import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ FIX marker icon issue (PUT HERE)
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

export default function MapView({ agents }: any) {
    useEffect(() => {
        const map = L.map("map").setView([12.9716, 77.5946], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        agents.forEach((agent: any) => {
            L.marker([agent.location.lat, agent.location.lng]).addTo(map);
        });

        return () => {
            map.remove();
        };
    }, [agents]);

    return <div id="map" style={{ height: "500px" }} />;
}