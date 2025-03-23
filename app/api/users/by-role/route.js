import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import User from "@/lib/models/User";

// GET users filtered by role with optional date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
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
    
    // Add role filter if provided
    if (role) {
      // Match if the role is in the roles array
      // This handles both string roles and object roles with a name property
      query.$or = [
        { 'roles': role },
        { 'roles.name': role }
      ];
    }
    
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
      const searchQuery = { $regex: search, $options: 'i' };
      
      // If we already have a role query, add search within that context
      if (query.$or && query.$or.length > 0) {
        // Need to restructure the query to include both role and search criteria
        const roleConditions = query.$or;
        delete query.$or;
        
        query.$and = [
          { $or: roleConditions },
          { $or: [
            { name: searchQuery },
            { email: searchQuery }
          ]}
        ];
      } else {
        // Simple search if no role filtering
        query.$or = [
          { name: searchQuery },
          { email: searchQuery }
        ];
      }
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    console.log("Fetching users by role with query:", JSON.stringify(query));
    
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
    
    // Count users currently clocked in with this role
    const clockedInWithRoleQuery = { ...query, clockedIn: true };
    const clockedInCount = await User.countDocuments(clockedInWithRoleQuery);
    
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
    console.error("Error getting users by role:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch users by role", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 