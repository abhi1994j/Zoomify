import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';

import roomHandler from './socket/roomHandler.js';
import authRoutes from './routes/auth.js';

dotenv.config();

/* ------------------ APP INIT ------------------ */
const app = express();

/* ------------------ MIDDLEWARE ------------------ */
app.use(express.json());
app.use(bodyParser.json({ limit: "30mb", extended: true }));

// app.use(
//     cors({
//         origin: process.env.FRONTEND_URL,
//         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//     })
// );

// IMPORTANT: handle preflight
// app.options("*",
//     cors({
//         origin: process.env.FRONTEND_URL,
//         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//     }));
const ALLOWED_ORIGINS = [
    // "http://localhost:3000",
    "https://zoomify-ruddy.vercel.app"
];
const corsOptions = {
    origin: 'https://zoomify-ruddy.vercel.app',  // Allow requests from this origin
    methods: ['GET', 'POST'],  // Allow specific methods (adjust as needed)
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers (if necessary)
};
app.use(cors(corsOptions));
// app.use(
//     cors({


        // origin: "http://localhost:3000",
        // function (origin, callback) {
        //     // allow REST tools like Postman
        //     if (!origin) return callback(null, true);

        //     if (ALLOWED_ORIGINS.includes(origin)) {
        //         callback(null, true);
        //     } else {
        //         callback(new Error("CORS not allowed"));
        //     }
        // },
        // methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        // allowedHeaders: ["Content-Type", "Authorization"],
    // })
// );

// app.options("*", cors());

/* ------------------ ROUTES ------------------ */
app.use('/auth', authRoutes);

/* ------------------ SERVER ------------------ */
const server = http.createServer(app);

/* ------------------ SOCKET.IO ------------------ */
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        // credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("User connected");
    roomHandler(socket);

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

/* ------------------ DB + LISTEN ------------------ */
const PORT = process.env.PORT || 6001;

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("DB connection error:", err);
    });
