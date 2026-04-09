import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    restaurant: {
        lat: Number,
        lng: Number,
    },
    customer: {
        lat: Number,
        lng: Number,
    },
    hops: [
        {
            agentId: String,
            status: String,
        },
    ],
    status: String,
});

export default mongoose.model("Order", orderSchema);