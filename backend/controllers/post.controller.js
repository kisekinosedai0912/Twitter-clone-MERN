import mongoose from 'mongoose';
import Post from '../model/post.model.js';
import User from '../model/user.model.js';
import Notification from '../model/notification.model.js';
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
            data: { user: user.fullname, text, img }
        })
        
    } catch (error) {
        console.log('An error occurred in Post controller: ', error.message);
        next(500, 'Internal server error')
    }
}

export async function reactions(req, res, next) {
    const { postId } = req.params
    const userId = req.user?._id;
    const post = await Post.findById(postId)
    if (!post) return res.status(400).json({ message: 'Post not found' })

    try {
        const notification = new Notification({
            type: 'like',
            from: userId,
            to: post.user,
            read: false
        });

        if (!post.likes.some(id => id.equals(userId))) {
            await Post.findByIdAndUpdate(postId, { $push: { likes: userId }})
            await User.findByIdAndUpdate(userId, { $push: { likedPosts: postId }});
            await notification.save();

            return res.status(200).json({
                success: true,
                message: `A user liked your post`,
            })
        }
        await Post.findByIdAndUpdate(postId, { $pull: { likes: userId }})
        await User.findByIdAndUpdate(userId, { $pull: { likedPosts: postId }})
       
        return res.status(200).json({
            success: true,
            message: `A user unliked your post`,
        })
    } catch (error) {
        console.log('An error occurred in reactions controller: ', error.message)
        next(error)
    }
}

export async function comments(req, res, next) {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!postId || !text) return next(new AppError(400, 'No comment provided'))

    try {
        const post = await Post.findById(postId)
        if (!post) return res.status(404).json({ message: 'Post not found' })

        await Post.findByIdAndUpdate(postId, { $push: { comments: { text, user: userId } }})

        return res.status(200).json({ 
            success: true, 
            message: 'A new comment was added',
            post
        })

    } catch (error) {
        console.log('An error occurred in comments controller: ', error.message)
        next(error)
    }
}

export async function deletePost(req, res, next) {
    const { postId } = req.params
    const post = await Post.findBypostId(postId);

    try {
        if (!post) return next(new AppError(404, 'Post not found'))
            
        if (post.user.toString() !== req.user?._id.toString()) {
            return next(new AppError(400, "You cannot delete other's post"))
        }

        if (post.img) {
            await cloudinary.uploader.destroy(post.img.split('/').pop().split('.')[0])
        }

        await Post.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Post deleted',
        })

    } catch (error) {
        console.log('An error occurred in deletePost controller: ', error.message)
        next(error)
    }
}

export async function getAllPosts(req, res, next) {
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor 
                    ? new mongoose.Types.ObjectId(req.query.cursor)
                    : null;

    const query = cursor ? { _id: { $lt: cursor } } : {};

    try {
        const posts = await Post.find(query)
            .sort({ _id: -1 })
            .populate('user', 'fullname username profileImg')
            .populate({ path: 'comments.user', select: 'username profileImg fullname' })
            .limit(limit + 1)
            .lean()

        if (posts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No posts available. Find new friends.',
                posts: [],
                nextCursor: null
            })
        }

        const hasNext = posts.length > limit;
        const result = hasNext ? posts.slice(0, limit) : posts;

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            posts: result,
            nextCursor: hasNext ? result[result.length - 1]._id : null,
        })
        
    } catch (error) {
        console.log('An error occurred in getAllPosts controller: ', error.message)
        next(error);
    }
}

export async function getCurrentUserLikes(req, res, next) {
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor 
                    ? new mongoose.Types.ObjectId(req.query.cursor)
                    : null;

    try {
        const likedPosts = await User.find(req.user?._id)
            .select('fullname username email')
            .populate({
                path: 'likedPosts',
                match: cursor ? { _id: { $lt: cursor } } : {},
                options: { 
                    sort: { _id: -1 }, 
                    limit: limit + 1 
                },
                populate: [
                    {
                        path: 'user',
                        select: 'fullname username profileImg'
                    },
                    {
                        path: 'comments.user',
                        select: 'fullname username profileImg'
                    }
                ]
            })
            .lean()
        
        const hasNext = likedPosts.length > limit;
        const result = hasNext ? likedPosts.slice(0, limit) : likedPosts;

        return res.status(200).json({
            success: true,
            message: 'Liked posts fetched successfully',
            likedPosts: result,
            nextCursor: hasNext ? likedPosts[likedPosts.length - 1]._id : null
        })
        
    } catch (error) {
        console.log('An error occurred in getLikedPosts controller: ', error.message)
        next(error)
    }
}

export async function getLikedPosts(req, res, next) {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor 
            ? new mongoose.Types.ObjectId(req.query.cursor) 
            : null

    try {
        const user = await User.findById(userId);
        if (!user) return next(new AppError(404, 'User not found'))

        const likedPost = await Post.find({ _id: { $in: user.likedPosts } })
            .populate('user', 'fullname username profileImg')
            .populate('comments.user', 'fullname username profileImg')
            .lean();

        if (!likedPost) {
            return res.status(200).json({
                success: true,
                message: 'This user has no liked posts yet.'
            })
        }

        const hasNext = likedPost.length > limit;
        const result = hasNext ? likedPost.slice(0, limit) : likedPost;

        return res.status(200).json({
            success: true,
            message: "Fetched all user's liked posts",
            likedPost: result,
            nextCursor: hasNext ? likedPost[likedPost.length - 1]._id : null
        })
        
    } catch (error) {
        console.log('An error occurred in getLikedPosts controller: ', error.message);
        next(error)
    }
}

export async function getFollowingPosts(req, res, next) {
    const user = await User.findById(req.user?._id);
    if (!user) return next(new AppError(404, 'User not found'));

    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor 
            ? new mongoose.Types.ObjectId(req.query.cursor)
            : null;
    
    const query = {
        user: { $in: user.following },
        ...(cursor && { _id: { $lt: cursor } })
    };

    try {
        const followedUsersPost = await Post.find(query)
                .sort({ _id: -1 })
                .populate('user', 'username fullname profileImg')
                .populate('comments.user', 'fullname username profileImg')
                .limit(limit + 1)
                .lean();

        if (!followedUsersPost) {
            return res.status(200).json({
                success: true,
                message: 'No posts to view. Follow new users to view their posts'
            });
        }

        const hasNext = followedUsersPost.length > limit;
        const result = hasNext ? followedUsersPost.slice(0, limit) : followedUsersPost;

        return res.status(200).json({
            success: true,
            message: "Fetched all followed user's post",
            followingPosts: result,
            nextCursor: hasNext ? followedUsersPost[followedUsersPost.length - 1]._id : null
        });
        
    } catch (error) {
        console.log('An error occurred in getFollowingPosts controller: ', error.message);
        next(error)
    }
}

export async function getPostsForYou(req, res, next) {
    const limit = parseInt(req.query.limit) || 5;
    const cursor = req.query.cursor 
            ? new mongoose.Types.ObjectId(req.query.cursor)
            : null;
    
    const query = {
        user: { $ne: req.user?._id },
        ...(cursor && { _id: { $lt: cursor } })
    }

    try {
        const posts = await Post.find(query)
            .sort({ _id: -1 })
            .populate('user', 'fullname username profileImg')
            .populate('comments.user', 'fullname username profileImg')
            .limit(limit + 1)
            .lean();
        
        if (posts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No posts available',
                posts: [],
                nextCursor: null
            });
        }

        const hasNext = posts.length > limit;
        const result = hasNext ? posts.slice(0, limit) : posts;

        return res.status(200).json({
            success: true,
            message: 'Fetched posts for you',
            posts: result,
            nextCursor: hasNext ? posts[posts.length - 1]._id : null,
        })

    } catch (error) {
        console.log('An error occurred in getPostsForYou controller: ', error.message);
        next(error);
    }
}