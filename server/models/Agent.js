import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
    name: String,
    location: {
        lat: Number,
        lng: Number,
    },
    isAvailable: Boolean,
});

export default mongoose.model("Agent", agentSchema);