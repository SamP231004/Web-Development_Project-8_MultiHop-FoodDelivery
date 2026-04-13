import { useEffect, useState } from "react";
import { socket } from "../socket";

export const useOrder = (orderId: string) => {
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (!orderId) return;

        socket.emit("order:join", { orderId });

        socket.on("order:update", (data) => {
            console.log("📦 Order received:", data);
            setOrder(data);
        });

        return () => {
            socket.off("order:update");
        };
    }, [orderId]);

    return order;
};