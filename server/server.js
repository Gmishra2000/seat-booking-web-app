import dotenv from 'dotenv'
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js"
import logger from './config/logger.js';

// Import Routes
import authRoutes from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Log requests
app.use((req, res, next) =>{
    logger.info(`${req.method} ${req.path}`);
    next();
})

// Health check

app.get('/health', (req,res)=>{
    res.json({
        status:'Ok',
        message:'Server is running'
    })
})

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

//404 handler

app.use((req,res,next)=>{
    res.status(404).json({
        error:'Route not found'
    });
})

// start server

const PORT = process.env.PORT || 5000;

const startServer = async ()=> {
    try{
        // connect to database
        await connectDB();

        //start listening
        app.listen(PORT, ()=>{
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info(`📚 API Base URL: http://localhost:${PORT}/api`);
            logger.info(`💚 Health check: http://localhost:${PORT}/health`)
         })
    }catch(err){
        logger.error(`Failed to start the server: ${err.message}`);
        process.exit(1);
    }
}



startServer();

