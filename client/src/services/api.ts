import axios from "axios";
import type { Order } from "../types/order";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const createOrder = async (): Promise<Order> => {
    const res = await API.post("/orders", {
        restaurant: { lat: 12.9716, lng: 77.5946 },
        customer: { lat: 12.9352, lng: 77.6245 },
    });

    return res.data;
};