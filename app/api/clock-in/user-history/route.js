import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import ClockIn from "@/lib/models/ClockIn";
import User from "@/lib/models/User";
import { authenticateRequest } from '@/lib/authUtils';

// GET clock-in history for a specific user with date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      // Allow unauthenticated requests but they will need to specify a userId
      console.log("Unauthenticated request to user-history endpoint");
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    // Determine which user ID to use - if not authenticated and no userId provided, return error
    let targetUserId;
    
    if (userId) {
      targetUserId = userId;
    } else if (auth.success) {
      targetUserId = auth.user._id;
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "User ID is required for unauthenticated requests" 
      }, { status: 400 });
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = { user: targetUserId };
    
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
    
    console.log("Fetching user clock-in history with query:", JSON.stringify(query));
    
    // Get user info
    const userInfo = await User.findById(targetUserId, 'name email image roles clockedIn').lean();
    
    if (!userInfo) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    // Execute query with pagination
    const clockIns = await ClockIn.find(query)
      .sort({ time: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const totalClockIns = await ClockIn.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalClockIns / limit);
    
    // Calculate statistics
    const firstClockIn = await ClockIn.findOne(query).sort({ time: 1 }).lean();
    const lastClockIn = await ClockIn.findOne(query).sort({ time: -1 }).lean();
    
    // Get locations this user has clocked in from
    const locations = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: "$address",
          count: { $sum: 1 },
          lastUsed: { $max: "$time" },
          coordinates: { $first: "$location.coordinates" }
        }
      },
      { $project: {
          location: "$_id",
          count: 1,
          lastUsed: 1,
          coordinates: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get daily clock-in pattern
    const dailyPattern = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
          count: { $sum: 1 },
          earliest: { $min: "$time" },
          latest: { $max: "$time" }
        }
      },
      { $project: {
          date: "$_id",
          count: 1,
          earliestTime: { $dateToString: { format: "%H:%M", date: "$earliest" } },
          latestTime: { $dateToString: { format: "%H:%M", date: "$latest" } },
          _id: 0
        }
      },
      { $sort: { date: -1 } },
      { $limit: 30 }
    ]);
    
    return NextResponse.json({
      success: true,
      user: userInfo,
      clockIns,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalClockIns,
        itemsPerPage: limit
      },
      statistics: {
        totalClockIns,
        clockedInStatus: userInfo.clockedIn,
        firstClockIn: firstClockIn ? firstClockIn.time : null,
        lastClockIn: lastClockIn ? lastClockIn.time : null,
        locations,
        dailyPattern
      }
    });
  } catch (error) {
    console.error("Error getting user clock-in history:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch user clock-in history", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 