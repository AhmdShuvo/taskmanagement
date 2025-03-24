import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import ClockIn from "@/lib/models/ClockIn";
import User from "@/lib/models/User";
import { authenticateRequest } from '@/lib/authUtils';

// GET clock-in data with date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    // Get the current user from the authentication
    const currentUser = auth.user;
    
    // Check if user is a CEO
    const isCEO = currentUser.roles.some(role => 
      (typeof role === 'string' && role === 'CEO') || 
      (typeof role === 'object' && role.name === 'CEO')
    );
    
    console.log(`User ${currentUser.name} is CEO: ${isCEO}`);
    
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Initialize the query object
    let query = {};
    
    // Build search query if provided
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search, $options: 'i' };
      
      // First, find users matching the search term
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }, '_id').lean();
      
      const userIds = matchingUsers.map(user => user._id);
      
      if (userIds.length > 0 || search.trim() !== '') {
        // Add OR condition to match either users or address
        query.$or = [];
        
        // Add user IDs to the query if any found
        if (userIds.length > 0) {
          query.$or.push({ user: { $in: userIds } });
        }
        
        // Add address search
        query.$or.push({ address: searchRegex });
        
        console.log(`Search found ${userIds.length} matching users`);
      }
    }
    
    // If the user is not a CEO, apply restrictions
    if (!isCEO) {
      // Find all users where current user is the senior person
      const subordinateUsers = await User.find({ seniorPerson: currentUser._id }, '_id').lean();
      
      // Extract just the IDs from the subordinate users
      const subordinateUserIds = subordinateUsers.map(user => user._id);
      
      // Add the current user's ID to the list (so they can see their own data)
      const allowedUserIds = [currentUser._id, ...subordinateUserIds];
      
      console.log(`Found ${subordinateUserIds.length} subordinate users for ${currentUser.name}`);
      
      // Only show data for allowed users
      query.user = { $in: allowedUserIds };
      
      // If a specific user is requested, make sure they're allowed
      if (userId) {
        // Check if the requested user is the current user or one of their subordinates
        if (userId === currentUser._id.toString() || subordinateUserIds.some(id => id.toString() === userId)) {
          query.user = userId;
        } else {
          return NextResponse.json(
            { success: false, message: "You don't have permission to view this user's clock-in data" },
            { status: 403 }
          );
        }
      }
    } else {
      // For CEOs, no user restrictions
      console.log("CEO access - no user restrictions applied");
      
      // If a specific user is requested, filter by that user
      if (userId) {
        query.user = userId;
      }
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.time = {};
      
      if (startDate) {
        query.time.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set the end date to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.time.$lte = endOfDay;
      }
    }
    
    console.log("Fetching clock-in data with query:", JSON.stringify(query));
    
    // Execute query with pagination and populate user data
    const clockIns = await ClockIn.find(query)
      .populate('user', 'name email image roles clockedIn')
      .sort({ time: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const totalClockIns = await ClockIn.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalClockIns / limit);
    
    // Get location statistics
    const locationStats = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: "$address",
          count: { $sum: 1 },
          users: { $addToSet: "$user" }
        }
      },
      { $project: {
          location: "$_id",
          count: 1,
          uniqueUsers: { $size: "$users" },
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get daily clock-in statistics
    const dailyStats = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
          count: { $sum: 1 },
          users: { $addToSet: "$user" }
        }
      },
      { $project: {
          date: "$_id",
          count: 1,
          uniqueUsers: { $size: "$users" },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // For CEOs, get count of all users as subordinateCount
    let subordinateCount = 0;
    if (isCEO) {
      subordinateCount = await User.countDocuments({});
      // Subtract 1 to exclude the CEO themselves
      if (subordinateCount > 0) subordinateCount -= 1;
    } else {
      // For regular users, count their subordinates
      subordinateCount = await User.countDocuments({ seniorPerson: currentUser._id });
    }
    
    return NextResponse.json({
      success: true,
      clockIns,
      userInfo: {
        currentUser: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          isCEO: isCEO
        },
        subordinateCount: subordinateCount
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalClockIns,
        itemsPerPage: limit
      },
      statistics: {
        totalClockIns,
        byLocation: locationStats,
        byDate: dailyStats
      }
    });
  } catch (error) {
    console.error("Error getting clock-in data:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch clock-in data", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 