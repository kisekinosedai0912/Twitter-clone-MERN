import User from "../model/user.model.js";
import Notification from './../model/notification.model.js';
import { AppError } from "../utils/errorHandler.js";

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