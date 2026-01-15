import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./database/connectDB.js";

import issueRoutes from "./routes/issueRoutes.js";
import itemRoutes from "./routes/itemRouter.js";
import requestRoutes from "./routes/requestRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";

const app = express();
dotenv.config();

app.use(cors({
    origin: true, // Allow all origins in development, or specify your frontend URL
    credentials: true, // Enable credentials (cookies, authorization headers)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/maintenance', maintenanceRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send("App is working");
})

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})