// verify-role.js
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';

const withRole = (roles) => async (req, res) => {
    const token = req.cookies.get('token')?.value || '';
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userRole = decodedToken.role;
        const response = NextResponse.json(userRole , { status: 200 });
        return response;
    }
    catch (err) {
        const response = NextResponse.json('Authentication is Needed! , No permisions ', { status: 403 });
        return response
    }
}

export default withRole