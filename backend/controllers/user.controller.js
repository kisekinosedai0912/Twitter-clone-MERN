// dependency imports
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from 'cloudinary';

// model imports
import User from "../model/user.model.js";
import Notification from './../model/notification.model.js';

// middleware imports
import { AppError } from "../utils/errorHandler.js";
import { generateTokenAndSetCookies } from "../utils/generateToken.js";


export async function getUserProfile(req, res, next) {
    const { username } = req.params;

    try {
        const user = await User.findOne({username}).select('-password');
        if (!user) return next(new AppError(404, 'User not found'));

        return res.status(200).json(user);

    } catch (error) {
        console.log('An error occurred in getUserProfile controller ', error);
        next(error);
    }
}

export async function getSuggestedUsers(req, res, next) {
    try {
        const userId = req.user._id;
        const followedUsers = await User.findById(userId).select('following');
        const users = await User.aggregate([
            { $match: { _id: {$ne: userId} }},
            { $sample: { size: 10 } }
        ]);
        const suggestedUsers = users.filter(user => !followedUsers.following.includes(user._id));

        suggestedUsers.forEach(user => (user.password = null));

        return res.status(200).json({ success: true, message: 'Users fetched.', data: suggestedUsers });

    } catch (error) {
        console.log('An error occurred in getSuggestedUsers controller: ', error.message);
        next(error)
    }
}

export async function followUnfollowUser(req, res, next) {
    const { id } = req.params;
    const userToModify = await User.findById(id); 
    const currentUser = await User.findById(req.user._id).select('-password');

    if (!id) return next(new AppError(400, 'Missing id of user to follow'));
    if (!userToModify || !currentUser) return next(new AppError(404, 'User not found'));
    if (id === currentUser._id.toString()) {
        return next(new AppError(400, 'Forbidden action! you cannot follow/unfollow your self'));
    }

    try {
        if (!currentUser?.following?.includes(id)) {
            await User.findByIdAndUpdate(currentUser?._id, {$push: { following: id }});
            await User.findByIdAndUpdate(id, {$push: {followers: currentUser?._id}});

            return res.status(200).json({
                success: true,
                message: `You followed ${userToModify.fullname}`,
            });
        }
        await User.findByIdAndUpdate(currentUser?._id, {$pull: { following: id }});
        await User.findByIdAndUpdate(id, {$pull: { followers: id }});

        const notification = new Notification({
            type: 'follow',
            from: currentUser?._id,
            to: id,
            read: false,
        });
        await notification.save();

        return res.status(200).json({
            success: true,
            message: `You unfollowed ${userToModify.fullname}`
        })

    } catch (error) {
        console.log('An error occurred in followUnfollowUser controller ', error.message);
        next(error);
    }
}

export async function changePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!currentPassword && !newPassword) {
        return next(new AppError(400, 'Please provide your current and new password.'))
    }

    if (currentPassword === newPassword) {
        return next(new AppError(400, 'Your current and new password must not be the same!'))
    }

    try {
        const user = await User.findById(userId);
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user?.password ?? "");
      
        if (!user) {
            return next(new AppError(404), 'User not found')
        }

        if (!isPasswordCorrect) {
            return next(new AppError(400, 'Current password is incorrect, cannot proceed to change your password'))
        }
        
        // hashing new password
        const salt = await bcrypt.genSalt(10);
        const hashNewPass = await bcrypt.hash(newPassword, salt);
        const updatedUser = await User.findByIdAndUpdate(user._id, { password: hashNewPass }, { new: true });
        
        generateTokenAndSetCookies(user?._id, res);

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully. Your access token has been refreshed.',
            data: {
                id: updatedUser?._id,
                email: updatedUser?.email,
            },
        });

    } catch (error) {
        console.error('An error occurred in changePassword controller ',error.message);
        next(error)
    }
}

export async function updateUserInfo(req, res, next) {
    try {
        const { fullname, email, bio, link } = req.body;
        let { profileImg, coverImg } = req.body;

        const user = await User.findById(req.user?._id);
        if (!user) return next(new AppError(404, 'User not found'));

        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
            return next(new AppError(400, 'Email is already taken!'));
        }

        if (email === user.email) {
            return next(new AppError(400, 'Email must not be the same as the old one!'));
        }

        if (profileImg) {
            try {
                if (user.profileImg) {
                    await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0]);
                }
                const uploadResponse = await cloudinary.uploader.upload(profileImg);
                profileImg = uploadResponse.secure_url;
            } catch (err) {
                console.error('Profile image upload failed:', err.message);
            }
        }

        if (coverImg) {
            try {
                if (user.coverImg) {
                    await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0]);
                }
                const uploadResponse = await cloudinary.uploader.upload(coverImg);
                coverImg = uploadResponse.secure_url;
            } catch (err) {
                console.error('Cover image upload failed:', err.message);
            }
        }

        // Update user properties with the new ones from the request
        user.fullname = fullname ?? user.fullname;
        user.email = email ?? user.email;
        user.bio = bio ?? user.bio;
        user.link = link ?? user.link;
        user.profileImg = profileImg ?? user.profileImg;
        user.coverImg = coverImg ?? user.coverImg;

        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.password;

        return res.status(200).json(updatedUser);

    } catch (error) {
        console.error('An error occurred in updateUserInfo controller', error.message);
        next(error);
    }
}