import Order from "../models/Order.js";
import { findMultiHopPath } from "../services/multiHop.service.js";

export const createOrder = async (req, res) => {
    try {
        const { restaurant, customer } = req.body;

        const hops = await findMultiHopPath(restaurant, customer);

        const order = await Order.create({
            restaurant,
            customer,
            hops: hops.map(a => ({
                agentId: a._id,
                status: "pending",
            })),
            status: "created",
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};