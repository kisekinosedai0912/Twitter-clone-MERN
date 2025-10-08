import { AppError } from '../utils/errorHandler.js';

export async function signup(req, res) {
    return res.json({
        data: "this is the signup endpoint"
    })
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