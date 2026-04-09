import Agent from "../models/Agent.js";

function distance(a, b) {
    return Math.sqrt(
        Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
    );
}

export const findMultiHopPath = async (restaurant, customer) => {
    const agents = await Agent.find({ isAvailable: true });

    // Step 1: sort agents near restaurant
    let current = restaurant;
    const path = [];

    const visited = new Set();

    while (true) {
        let nextAgent = null;
        let minDist = Infinity;

        for (let agent of agents) {
            if (visited.has(agent._id.toString())) continue;

            const distToCurrent = distance(current, agent.location);
            const distToCustomer = distance(agent.location, customer);

            // heuristic: move closer to customer
            const score = distToCurrent + distToCustomer;

            if (score < minDist) {
                minDist = score;
                nextAgent = agent;
            }
        }

        if (!nextAgent) break;

        path.push(nextAgent);
        visited.add(nextAgent._id.toString());
        current = nextAgent.location;

        // stop if close to customer
        if (distance(current, customer) < 0.01) break;
    }

    return path;
};