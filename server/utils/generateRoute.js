export const generateRoute = (agentId) => {
    // 🔥 Bangalore realistic delivery paths

    // 🛵 Agent X → West → Central → East
    if (agentId === "agent-1") {
        return [
            { lat: 12.9716, lng: 77.5946 }, // MG Road (start)
            { lat: 12.9725, lng: 77.6050 }, // Indiranagar
            { lat: 12.9750, lng: 77.6200 }, // Domlur
            { lat: 12.9780, lng: 77.6400 }, // Marathahalli
        ];
    }

    // 🛵 Agent Y → South → Central → East
    if (agentId === "agent-2") {
        return [
            { lat: 12.9600, lng: 77.5800 }, // Jayanagar
            { lat: 12.9650, lng: 77.6000 }, // Richmond Town
            { lat: 12.9725, lng: 77.6200 }, // Domlur (INTERSECTION ZONE)
            { lat: 12.9785, lng: 77.6450 }, // Marathahalli
        ];
    }

    // 🛵 fallback (random nearby)
    return [
        { lat: 12.9716 + Math.random() * 0.01, lng: 77.5946 + Math.random() * 0.01 },
        { lat: 12.975 + Math.random() * 0.01, lng: 77.60 + Math.random() * 0.01 },
    ];
};