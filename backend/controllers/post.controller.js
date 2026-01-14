import Post from '../model/post.model.js';
import User from '../model/user.model.js';
import { v2 as cloudinary } from 'cloudinary'
import { AppError } from '../utils/errorHandler.js';

export async function createPost(req, res, next) {
    const { text } = req.body;
    let { img } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) return next(new AppError(400, 'User not found!'));

    try {
        if (!img || !text) return next(new AppError(400, 'Post must have an image content or text in it'))

        const uploadResponse = await cloudinary.uploader.upload(img)
        img = uploadResponse.secure_url;

        const newPost = new Post({ user, text, img });
        await newPost.save();

        user.password = null;

        return res.status(201).json({
            success: true,
            message: 'New post was created succesfully',
            data: { user, text, img }
        })
        
    } catch (error) {
        console.log('An error occurred in Post controller: ', error.message);
        next(500, 'Internal server error')
    }
}

export async function reactions(req, res, next) {
    const { id } = req.params
    const userId = req.user?._id;
    const post = await Post.find(id)
    if (!post) return res.status(400).json({ message: 'Post not found' })

    try {
        const user = await User.findById(userId);

        if (!post.likes.includes(userId) || !post.comments.includes(userId)) {
            await Post.findByIdAndUpdate(id, { $push: { likes: userId }})

            return res.status(200).json({
                success: true,
                message: `${user} liked your post`,
            })
        }
        await Post.findByIdAndUpdate(id, { $pull: { likes: userId }})

        return res.status(200).json({
            success: true,
            message: `${user} unliked your post`,
        })
    } catch (error) {
        console.log('An error occurred in reactions controller: ', error.message)
    }
}

export async function comments(req, res, next) {
    const { text } = req.body;
    const { id } = req.params;
    const userId = req.user?._id;

    if (!id || !text) return next(new AppError(400, 'No comment provided'))

    try {
        const post = await Post.findById(id)
        if (!post) return res.status(400).json({ message: 'Post not found' })

        await Post.findByIdAndUpdate(id, { $push: { comments: { text, user: userId } }})

        return res.status(200).json({ 
            success: true, 
            message: 'A new comment was added',

        })

    } catch (error) {
        console.log('An error occurred in comments controller: ', error.message)
        next(error)
    }
}
