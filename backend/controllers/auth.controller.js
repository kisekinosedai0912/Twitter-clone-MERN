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
                followers: newUser?.followers,
            });
        } 
        return next(new AppError(400, 'Invalid user data.'));

    } catch (error) {
        console.log('Error in signup controller ', error);
        console.error(error.message);
        next(new AppError(500, 'Internal Server Error'));
    }
}

export async function login(req, res, next) {
    const { username, password } = req.body;

    try {
        const user = await User?.findOne({ username });
        const isValidPassword = await bcrypt.compare(password, user?.password ?? ''); 

        if (!username || !password) {
            return next(new AppError(400, 'Invalid empty fields!, kindly fill in a valid username & password'));
        }

        if (!user || !isValidPassword) {
            return next(new AppError(400, 'Invalid username or password'));
        }

        generateTokenAndSetCookies(user?._id, res);

        return res.status(201).json({
            _id: user?._id, 
            fullname: user?.fullname,
            username: user?.username,
            email: user?.email,
            profileImg: user?.profileImg,
            coverImg: user?.coverImg,
            following: user?.following,
            followers: user?.followers,
        });

    } catch (error) {
        console.log('Error in signup controller ', error);
        console.error(error.message);
        next(error)
    }
}

export async function logout(req, res, next) {
    try {
        res.cookie('jwt', '', {maxAge: 0});
        return res.status(200).json({message: 'Loggedout successfully' })
    } catch (error) {
        next(error);
    }
}

export async function validateAccess(req, res, next) {
    try {
        const user = await User.findById(req.user._id).select('-password');
        return res.status(200).json(user);
    } catch (error) {
        next(error)
    }
}