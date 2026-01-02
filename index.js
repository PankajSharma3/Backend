import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./database/connectDB.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use('/api/auth',authRoutes);

const PORT = process.env.PORT || 5000;

app.get('/',(req,res)=>{
    res.send("App is working");
})

app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})