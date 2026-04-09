import { io } from "../server.js";

export const emitLocationUpdate = (orderId, data) => {
    io.to(orderId).emit("location_update", data);
};