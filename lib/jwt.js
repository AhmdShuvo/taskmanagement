// lib/jwt.js
import jwt from 'jsonwebtoken';

export function verifyJWT(token) {
    try {
        // console.log(token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return null; // Or throw an error if you prefer
    }
}