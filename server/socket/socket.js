export const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join_order", (orderId) => {
            socket.join(orderId);
            console.log(`Joined room: ${orderId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};