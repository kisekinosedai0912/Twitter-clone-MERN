import User from '../model/user.model.js';
import { AppError } from '../utils/errorHandler.js';
import Notification from './../model/notification.model.js';

export async function getNotifications(req, res, next) {
    try {
        const notifications = await Notification.find({ to: req.user._id })
                .sort({ createdAt: -1 })
                .populate('from', 'fullname')
                .populate('to', 'fullname')
                .lean();

        if (notifications.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No notifications found',
                notifications: []
            });
        }

        await Notification.updateMany({ to: req.user?._id }, { read: true });

        return res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully!',
            notifications
        })

    } catch (error) {
        console.log('An error occurred in getNotifications Controller: ', error.message)
        next(error)
    }
}

export async function deleteNotification(req, res, next) {
    try {
        await Notification.deleteMany({ to: req.user?._id });

        return res.status(200).json({
            success: true,
            message: 'Notifications deleted successfully',
        });
        
    } catch (error) {
        console.log('An error occurred in deleteNotification controller: ', error.message)
        next(error)
    }
}

export async function deleteOneNotif(req, res, next) {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return next(new AppError(404, 'Notification not found'))
        }

        if (notification.to.toString() !== req.user?._id.toString()) {
            return next(new AppError(403, 'Unauthorized, you cannot delete this notification'))
        }

        await Notification.findByIdAndDelete(notification._id);

        return res.status(200).json({
            success: true,
            message: 'A notifcation was deleted successfully',
        })
        
    } catch (error) {
        console.log('An error occurred in deleteOneNotif controller: ', error.message);
        next(error)
    }
}