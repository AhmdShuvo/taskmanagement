import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import User from "@/lib/models/User";
import ClockIn from "@/lib/models/ClockIn";

// GET user activity data with date filtering
export async function GET(request) {
  await dbConnect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    
    // Build date query
    let dateQuery = {};
    
    if (startDate || endDate) {
      dateQuery.time = {};
      
      if (startDate) {
        dateQuery.time.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set the end date to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateQuery.time.$lte = endOfDay;
      }
    }
    
    // Add user filter if provided
    if (userId) {
      dateQuery.user = userId;
    }
    
    console.log("Fetching user activity with query:", JSON.stringify(dateQuery));
    
    // Get all clock-in records for the specified date range and user
    const clockInRecords = await ClockIn.find(dateQuery)
      .populate('user', 'name email image roles')
      .sort({ time: -1 })
      .lean();
    
    // Get currently active users (clocked in)
    const activeUsers = await User.find({ clockedIn: true }, 'name email image roles')
      .lean();
    
    // Get user count by role
    const usersByRole = await User.aggregate([
      {
        $unwind: '$roles' // Flatten the roles array
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $isObject: '$roles' },
              then: '$roles.name',
              else: '$roles'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Get daily activity counts
    let dailyActivity = [];
    
    if (startDate && endDate) {
      // Calculate date range for daily activity
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dailyActivity = await ClockIn.aggregate([
        {
          $match: {
            time: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$time' } 
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            _id: 0
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);
    }
    
    return NextResponse.json({
      success: true,
      activity: {
        clockInRecords,
        activeUsers: {
          count: activeUsers.length,
          users: activeUsers
        },
        usersByRole,
        dailyActivity
      },
      summary: {
        totalClockIns: clockInRecords.length,
        activeUsersCount: activeUsers.length,
        dateRange: {
          from: startDate || 'all time',
          to: endDate || 'present'
        }
      }
    });
  } catch (error) {
    console.error("Error getting user activity:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch user activity", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 