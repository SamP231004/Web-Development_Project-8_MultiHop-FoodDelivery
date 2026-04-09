import type { Location } from "./agent";

export interface Hop {
    agentId: string;
    status: "pending" | "picked" | "handoff" | "delivered";
}

export interface Order {
    _id: string;
    restaurant: Location;
    customer: Location;
    hops: Hop[];
    status: "created" | "in_progress" | "delivered";
}