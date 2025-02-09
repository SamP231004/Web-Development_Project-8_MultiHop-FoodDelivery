import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use((req, res, next) => {
    const { method, url } = req;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} - ${url}`);
    next();
});

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "3gb"}))
app.use(express.urlencoded({extended: true, limit: "3gb"}))
app.use(express.static("public"))
app.use(cookieParser())

export { app }