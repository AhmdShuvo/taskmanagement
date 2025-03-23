import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import ClockIn from "@/lib/models/ClockIn";
import User from "@/lib/models/User";
import mongoose from "mongoose";

// GET summarized clock-in data with date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const groupBy = url.searchParams.get('groupBy') || 'day'; // day, week, month
    
    // Build date range for query
    let dateRange = {};
    let start, end;
    
    if (startDate) {
      start = new Date(startDate);
      dateRange.$gte = start;
    } else {
      // Default to last 30 days if no start date
      start = new Date();
      start.setDate(start.getDate() - 30);
      dateRange.$gte = start;
    }
    
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    } else {
      // Default to today if no end date
      end = new Date();
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    }
    
    // Initialize query with date range
    const query = { time: dateRange };
    
    console.log("Fetching clock-in summary with query:", JSON.stringify(query));
    
    // Determine date format based on groupBy parameter
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = "%G-W%V"; // ISO week format: 2023-W01
        break;
      case 'month':
        dateFormat = "%Y-%m"; // Year-month format: 2023-01
        break;
      case 'day':
      default:
        dateFormat = "%Y-%m-%d"; // Year-month-day format: 2023-01-01
        break;
    }
    
    // Get summary statistics grouped by date
    const timeSeries = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: { $dateToString: { format: dateFormat, date: "$time" } },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" }
        }
      },
      { $project: {
          period: "$_id",
          count: 1,
          uniqueUserCount: { $size: "$uniqueUsers" },
          _id: 0
        }
      },
      { $sort: { period: 1 } }
    ]);
    
    // Get top clock-in locations
    const topLocations = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: "$address",
          count: { $sum: 1 },
          coordinates: { $first: "$location.coordinates" }
        }
      },
      { $project: {
          location: "$_id",
          count: 1,
          coordinates: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get top users by clock-in count
    const topUsers = await ClockIn.aggregate([
      { $match: query },
      { $group: {
          _id: "$user",
          count: { $sum: 1 },
          firstClockIn: { $min: "$time" },
          lastClockIn: { $max: "$time" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      // Lookup user details
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $project: {
          userId: "$_id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          count: 1,
          firstClockIn: 1,
          lastClockIn: 1,
          _id: 0
        }
      }
    ]);
    
    // Calculate overall statistics
    const totalClockIns = await ClockIn.countDocuments(query);
    const uniqueUserCount = await ClockIn.distinct('user', query).then(users => users.length);
    const averagePerUser = uniqueUserCount ? (totalClockIns / uniqueUserCount) : 0;
    
    // Get current clocked-in users count
    const currentlyActiveUsers = await User.countDocuments({ clockedIn: true });
    
    return NextResponse.json({
      success: true,
      summary: {
        totalClockIns,
        uniqueUserCount,
        averagePerUser: parseFloat(averagePerUser.toFixed(2)),
        currentlyActiveUsers,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          groupedBy: groupBy
        }
      },
      timeSeries,
      topLocations,
      topUsers
    });
  } catch (error) {
    console.error("Error getting clock-in summary:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch clock-in summary", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 