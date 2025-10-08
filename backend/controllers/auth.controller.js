import { AppError } from '../utils/errorHandler.js';
import User from './../model/user.model.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookies } from '../utils/generateToken.js'

export async function signup(req, res, next) {
    const {username, password, fullname, email} = req.body;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        return next(new AppError(400, 'Invalid email format!'));
    }

    if (!username || !password || !fullname || !email) {
        return next(new AppError(400, 'Please fill all required fields.'));
    }

    try {
        const existingUser = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });

        if (existingUser) {
            return next(new AppError(400, 'Username choice is already taken.'));
        }

        if (existingEmail) {
            return next(new AppError(400, 'Email choice is already taken.'));
        }

        if (password.length < 6) {
            return next(new AppError(400, 'Password is invalid, must be 6 or more characters!'));
        }

        // hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ fullname, username, password: hashPassword, email });

        if (newUser) {
            generateTokenAndSetCookies(newUser._id, res);
            await newUser.save();

            return res.status(201).json({
                _id: newUser?._id, 
                fullname: newUser?.fullname,
                username: newUser?.username,
                email: newUser?.email,
                profileImg: newUser?.profileImg,
                coverImg: newUser?.coverImg,
                following: newUser?.following,
                followers: newUser?.followers
            });
        } 
        return next(new AppError(400, 'Invalid user data.'));

    } catch (error) {
        console.log('Error in signup controller ', error);
        console.error(error.message);
        next(new AppError(500, 'Internal Server Error'));
    }
}

export async function login(req, res) {
    return res.json({
        data: "this is the login endpoint"
    })
}

export async function logout(req, res) {
    return res.json({
        data: "this is the logout endpoint"
    })
}