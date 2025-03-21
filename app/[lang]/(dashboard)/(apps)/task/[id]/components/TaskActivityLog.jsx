"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle,
  Edit,
  MessageSquare,
  Play,
  Plus,
  Users,
  XCircle,
} from "lucide-react";

// Fetch activity log for a task
const fetchActivityLog = async (taskId) => {
  const response = await fetch(`/api/tasks/${taskId}/activity`);
  if (!response.ok) {
    throw new Error("Failed to fetch activity log");
  }
  return response.json();
};

// Map activity types to icons
const activityIcons = {
  created: <Plus className="h-4 w-4 text-green-500" />,
  updated: <Edit className="h-4 w-4 text-blue-500" />,
  status_change: <AlertCircle className="h-4 w-4 text-orange-500" />,
  comment_added: <MessageSquare className="h-4 w-4 text-purple-500" />,
  assigned: <Users className="h-4 w-4 text-indigo-500" />,
};

// Map status changes to specific icons
const statusIcons = {
  open: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  "in progress": <Play className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  blocked: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function TaskActivityLog({ taskId }) {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["taskActivity", taskId],
    queryFn: () => fetchActivityLog(taskId),
  });

  if (isLoading) {
    return <ActivityLogSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Error loading activity log: {error.message}
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Activity Log</h3>
      
      {activities.length === 0 && (
        <p className="text-center text-default-500 py-4">No activity recorded yet</p>
      )}
      
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, activities]) => (
          <div key={date} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 mb-3">{date}</h4>
            
            <div className="border-l-2 border-gray-200 dark:border-gray-700 space-y-4 pl-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 relative">
                  {/* Activity indicator dot */}
                  <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-background flex items-center justify-center border border-border">
                    {activity.type === "status_change" 
                      ? statusIcons[activity.data?.to] || activityIcons[activity.type]
                      : activityIcons[activity.type] || <Edit className="h-3 w-3 text-gray-400" />
                    }
                  </div>
                  
                  {/* Avatar */}
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarImage src={activity.user?.image || ""} />
                    <AvatarFallback>{activity.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  
                  {/* Activity content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">
                        {activity.user?.name || activity.user?.email || "Unknown User"}
                      </span>
                      <span className="text-xs text-default-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-1">
                      {renderActivityMessage(activity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Render appropriate activity message based on type
function renderActivityMessage(activity) {
  switch (activity.type) {
    case "created":
      return "created this task";
    case "updated":
      return `updated ${activity.data?.field || "task details"}`;
    case "status_change":
      return (
        <span>
          changed status from <strong>{activity.data?.from || "unknown"}</strong> to <strong>{activity.data?.to || "unknown"}</strong>
        </span>
      );
    case "comment_added":
      return "added a comment";
    case "assigned":
      if (activity.data?.added) {
        return (
          <span>
            assigned to <strong>{activity.data.added}</strong>
          </span>
        );
      } else if (activity.data?.removed) {
        return (
          <span>
            unassigned <strong>{activity.data.removed}</strong>
          </span>
        );
      }
      return "changed task assignment";
    default:
      return "performed an action";
  }
}

function ActivityLogSkeleton() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Activity Log</h3>
      
      <div className="border-l-2 border-gray-200 dark:border-gray-700 space-y-6 pl-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 