"use client";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Play,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useUserRoles from "@/hooks/useUserRoles";

// Update task status
const updateTaskStatus = async ({ taskId, status }) => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Add the token
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update task status");
    }
    return response.json();
  } catch (error) {
    console.error("Error in updateTaskStatus:", error);
    throw error;
  }
};

export default function TaskStatusUpdate({ task, taskId }) {
  const [status, setStatus] = useState(task.status);
  const queryClient = useQueryClient();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const { isEngineer, canManageTasks, isCEO } = useUserRoles();

  // Check if user can update the task status
  const canUpdateStatus = !isCEO() && canManageTasks() && isEngineer();

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(["task", taskId]);
      toast.success("Task status updated successfully");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error(`Error updating status: ${error.message}`);
      // Reset to previous value on error
      setStatus(task.status);
    },
  });

  const handleStatusChange = (newStatus) => {
    if (!currentUser) {
      toast.error("You must be logged in to update task status");
      return;
    }
    
    if (!canUpdateStatus) {
      toast.error("You don't have permission to update task status");
      return;
    }
    
    setStatus(newStatus);
    statusMutation.mutate({
      taskId,
      status: newStatus,
    });
  };

  const statusOptions = [
    { value: "open", label: "Open", icon: <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" /> },
    { value: "in progress", label: "In Progress", icon: <Play className="h-4 w-4 text-blue-500 mr-2" /> },
    { value: "completed", label: "Completed", icon: <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> },
    { value: "blocked", label: "Blocked", icon: <XCircle className="h-4 w-4 text-red-500 mr-2" /> },
  ];

  // If user doesn't have permission to update status, show a read-only view
  if (!canUpdateStatus) {
    return (
      <div className="space-y-4">
        <div className="flex items-center p-3 bg-muted/20 rounded-md">
          {statusOptions.find(opt => opt.value === status)?.icon}
          <span className="text-sm font-medium capitalize">{status}</span>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-gray-800/30 rounded-md text-orange-700 dark:text-orange-400 text-sm">
          You don't have permission to update the task status.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={statusMutation.isLoading || !canUpdateStatus}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="flex items-center">
              <div className="flex items-center">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {statusMutation.isLoading && (
        <div className="flex items-center justify-center text-sm text-default-500">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating status...
        </div>
      )}

      <div className="p-3 bg-default-50 dark:bg-gray-800/30 rounded-md">
        <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {status !== "in progress" && (
            <Button 
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => handleStatusChange("in progress")}
              disabled={statusMutation.isLoading}
            >
              <Play className="h-3 w-3 mr-1" />
              Start Working
            </Button>
          )}
          
          {status !== "completed" && (
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full text-xs"
              onClick={() => handleStatusChange("completed")}
              disabled={statusMutation.isLoading}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          
          {status !== "blocked" && (
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full text-xs"
              onClick={() => handleStatusChange("blocked")}
              disabled={statusMutation.isLoading}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Block
            </Button>
          )}
          
          {status !== "open" && (
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full text-xs"
              onClick={() => handleStatusChange("open")}
              disabled={statusMutation.isLoading}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Reopen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 