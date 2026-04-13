import { generateRoute } from "../utils/generateRoute.js";
import { findIntersection } from "../utils/findIntersection.js";

export const initSocket = (io) => {
    const agents = new Map();

    const mockOrder = {
        orderId: "order-1",
        pickup: { lat: 12.9716, lng: 77.5946 }, // Bangalore
        drop: { lat: 12.9739, lng: 79.1654 },   // Vellore
    };

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // ---------------- ORDER JOIN ----------------
        socket.on("order:join", ({ orderId }) => {
            console.log("📦 Order join:", orderId);

            socket.join(orderId);

            // 🔥 send base order immediately
            socket.emit("order:update", {
                orderId: "order-1",
                pickup: { lat: 12.9716, lng: 77.5946 },
                drop: { lat: 12.9739, lng: 79.1654 },
                assignedAgents: [],
                handoffPoints: [],
                routes: {},
            });
        });

        // ---------------- AGENT JOIN ----------------
        socket.on("agent:join", ({ agentId }) => {
            agents.set(agentId, {
                socketId: socket.id,
                location: null,

                // 🔥 FULL ROUTE FOR AGENT
                route: generateRoute(agentId),
            });

            socket.agentId = agentId;

            console.log("Agent joined:", agentId);
        });

        // ---------------- LOCATION UPDATE ----------------
        socket.on("agent:location:update", ({ agentId, lat, lng }) => {
            if (!agents.has(agentId)) return;

            const agent = agents.get(agentId);

            agents.set(agentId, {
                ...agent,
                location: { lat, lng },
            });

            // 🔥 BROADCAST LOCATION
            io.emit("agent:location:broadcast", {
                agentId,
                lat,
                lng,
            });

            // ---------------- DYNAMIC MATCHING ----------------
            const allAgents = Array.from(agents.entries());

            if (allAgents.length >= 2) {
                const [id1, a1] = allAgents[0];
                const [id2, a2] = allAgents[1];

                const S = findIntersection(a1.route, a2.route);

                const dynamicOrder = {
                    orderId: "order-1",
                    pickup: mockOrder.pickup,
                    drop: mockOrder.drop,

                    assignedAgents: [id1, id2],
                    handoffPoints: [S],

                    routes: {
                        [id1]: a1.route,
                        [id2]: a2.route,
                    },
                };

                io.emit("order:update", dynamicOrder);
            }
        });

        // ---------------- DISCONNECT ----------------
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);

            const agentId = socket.agentId;

            if (agentId && agents.has(agentId)) {
                agents.delete(agentId);

                io.emit("agent:disconnected", { agentId });
            }
        });
    });
};