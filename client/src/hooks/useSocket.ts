import { useEffect } from "react";
import { socket } from "../services/socket";

export const useSocket = (orderId: string, onUpdate: any) => {
    useEffect(() => {
        socket.emit("join_order", orderId);

        socket.on("location_update", onUpdate);

        return () => {
            socket.off("location_update", onUpdate);
        };
    }, [orderId]);
};