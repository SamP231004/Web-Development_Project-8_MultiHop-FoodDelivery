import { connectDB } from "./config/db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import orderRoutes from "./routes/order.routes.js";
import { initSocket } from "./socket/socket.js";
import { startSimulation } from "./services/simulator.js";

dotenv.config();
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

initSocket(io);
startSimulation();

export { io };