import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import ClockIn from "@/lib/models/ClockIn";

// GET clock-in data with date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
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
    
    // Add user filter if provided
    if (userId) {
      query.user = userId;
    }
    
    console.log("Fetching clock-in data with query:", JSON.stringify(query));
    
    // Execute query with pagination and populate user data
    const clockIns = await ClockIn.find(query)
      .populate('user', 'name email clockedIn')
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
    
    return NextResponse.json({
      success: true,
      clockIns,
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