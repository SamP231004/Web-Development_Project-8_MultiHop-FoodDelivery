import { useAgentTracking } from "../hooks/useAgentTracking";

const AgentPage = () => {
    console.log("🚀 Agent page loaded");

    // 🔥 IMPORTANT: random agent for testing
    const agentId =
        Math.random() > 0.5 ? "agent-1" : "agent-2";

    useAgentTracking(agentId);

    return <h1>Agent Tracking Active ({agentId})</h1>;
};

export default AgentPage;