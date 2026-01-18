// packages
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
// routes
import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.route.js'
import postRoutes from './routes/post.route.js'
import notificationRoutes from './routes/notification.route.js'
// utilities
import { errorHandler } from './middleware/errorMiddleware.js';
import { mdbConnection } from './config/connection.js';

dotenv.config();
cloudinary.config({
    cloud_name: process.env?.CLOUDINARY_CLOUD_NAME,
    api_key: process.env?.CLOUDINARY_API_KEY,
    api_secret: process.env?.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env?.PORT || 5000;
const BASE_URL = process.env?.BASE_URL || 'http://localhost';

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ limit: '50mb', extended: true}));
app.use(cookieParser()); // allows you to parse the cookie from user requests

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/notification', notificationRoutes);
/*
** configuration for production
*/
const __dirname = path.resolve();

if (process.env?.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
    });
}
/** end of production configuration **/

app.use(errorHandler);
app.listen(PORT, () => {
    mdbConnection();
    console.log(`Server running at ${BASE_URL}:${PORT}` )
})