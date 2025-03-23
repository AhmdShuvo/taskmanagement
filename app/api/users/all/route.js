import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import User from "@/lib/models/User";

// GET all users with optional date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set the end date to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    console.log("Fetching users with query:", JSON.stringify(query));
    
    // Execute query with pagination - selecting only needed fields
    const users = await User.find(query, 'name email image roles clockedIn createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);
    
    // Count users currently clocked in
    const clockedInCount = await User.countDocuments({ clockedIn: true });
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalUsers,
        itemsPerPage: limit
      },
      stats: {
        totalUsers,
        clockedInUsers: clockedInCount
      }
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch users", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 