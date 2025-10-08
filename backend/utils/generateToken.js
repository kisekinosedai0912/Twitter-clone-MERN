import jwt from 'jsonwebtoken'

export function generateTokenAndSetCookies(userId, res) {
    const token = jwt.sign({userId}, process.env?.JWT_SECRET, { expiresIn: '15d' });

    return res.cookie('jwt', token, {
        maxAge: 15*24*60*60*1000, // 15 days in milleseconds, jwt will only be accessible for 15 days
        httpOnly: true, // handles/prevenets XSS attacks (cross-site scripting)
        sameSite: 'strict', // handles/prevents CSRF attacks (cross-site request forgery)
        secure: process.env?.JWT_SECRET === 'production',
    });
}