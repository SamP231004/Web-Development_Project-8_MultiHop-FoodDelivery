import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        console.log(`\n MongoDB connected. Database HOST : ${connectionInstance.connection.host}`)
    }
    catch(error) {
        console.log("Connection Error : ", error);
        process.exit(1)
    }
}

export default connectDB