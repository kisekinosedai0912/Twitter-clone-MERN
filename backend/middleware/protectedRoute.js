import User from "../model/user.model.js";
import jwt from 'jsonwebtoken';

export async function protectedRoute(req, res, next) {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: no token detected!'});
        }
        
        const decoded = jwt.verify(token, process.env?.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized access: Invalid token!' });
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found!'});
        }

        req.user = user;
        next();

    } catch (error) {
        console.log('Error occurred in protectedRoute middleware: ', error)
        console.log('An error occurred: ', error.message)
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}