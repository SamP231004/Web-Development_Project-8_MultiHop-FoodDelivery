import { useEffect } from "react";
import { socket } from "../services/socket";

export const useSocket = (orderId: string, onUpdate: any) => {
    useEffect(() => {
        socket.emit("order:join", { orderId });

        socket.on("order:update", onUpdate);

        return () => {
            socket.off("order:update", onUpdate);
        };
    }, [orderId, onUpdate]);
};