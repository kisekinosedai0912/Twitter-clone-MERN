import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path';
import authRoutes from './routes/auth.routes.js'
import { errorHandler } from './middleware/errorMiddleware.js';
import { mdbConnection } from './config/connection.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env?.PORT || 5000;
const BASE_URL = process.env?.BASE_URL || 'http://localhost';

app.use(express.json());
app.use(express.urlencoded({extended: true})) // used to pass form data encoded in url (usage in postman);
app.use(cors());
app.use(cookieParser()); // allows you to parse the cookie from user requests

app.use('/api/auth', authRoutes);
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
