"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
} from "@/components/ui/avatar";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Edit,
  MessageSquare,
  User,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import TaskComments from "./components/TaskComments";
import TaskStatusUpdate from "./components/TaskStatusUpdate";
import TaskActivityLog from "./components/TaskActivityLog";
import useUserRoles from "@/hooks/useUserRoles";
import { api } from "@/config/axios.config";
import EditTask from "../components/edit-task";

// Status icons mapping
const statusIcons = {
  todo: <Clock className="h-4 w-4 mr-1 text-slate-500" />,
  "in-progress": <Play className="h-4 w-4 mr-1 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 mr-1 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 mr-1 text-red-500" />,
  blocked: <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />,
};

// Priority colors
const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

// Fetch task details
const fetchTaskDetails = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw new Error("Failed to load task details");
  }
};

// Simple loading component to replace all skeletons
const TaskDetailLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading task details...</p>
    </div>
  </div>
);

export default function TaskDetailPageClient() {
  const { id, lang } = useParams();
  const queryClient = useQueryClient();
  const { isCEO, isEngineer, isProjectLead, canManageTasks, isLoading: rolesLoading } = useUserRoles();
  const [isReady, setIsReady] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Wait for roles to be loaded before rendering
  useEffect(() => {
    if (!rolesLoading) {
      // Minimal delay - just for state transitions
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [rolesLoading]);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", id],
    queryFn: () => fetchTaskDetails(id),
    staleTime: 60000, // Cache data for 1 minute to improve subsequent loads
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  const handleTaskUpdated = (updatedTask) => {
    queryClient.invalidateQueries(["task", id]);
    toast.success("Task updated successfully");
  };

  // Single loading state for all scenarios
  if (isLoading || !isReady) {
    return <TaskDetailLoader />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium text-red-600">Error loading task</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
      </div>
    );
  }

  // Determine if user can interact with the task
  const canInteract = !isCEO() && canManageTasks();
  const canEditAssignments = isProjectLead ? isProjectLead() : false;

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main task details */}
        <div className="md:w-2/3">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-default-900">
                    {task.title}
                  </CardTitle>
                  <CardDescription className="text-default-500 mt-1">
                    Created {format(new Date(task.createdAt), "PPP")}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={`${priorityColors[task.priority]} border px-3 py-1 text-xs font-medium capitalize`}
                  >
                    {task.priority} priority
                  </Badge>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
                    {statusIcons[task.status]}
                    <span className="text-xs font-medium capitalize">{task.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="py-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-default-700 whitespace-pre-line">
                  {task.description || "No description provided"}
                </p>
              </div>

              {task.dueDate && (
                <div className="flex items-center mt-4 text-default-700">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>
                    Due: {format(new Date(task.dueDate), "PPP")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="comments" className="mt-6">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              {/* <TabsTrigger value="subtasks">Subtasks</TabsTrigger> */}
            </TabsList>
            <TabsContent value="comments">
              {/* Only show comment input for authorized users */}
              {canInteract ? (
                <TaskComments taskId={id} />
              ) : (
                <div className="p-4 bg-primary-50 rounded-md text-primary-600">
                  <p>You can view but not add comments on this task.</p>
                  <TaskComments taskId={id} readOnly={true} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="activity">
              <TaskActivityLog taskId={id} />
            </TabsContent>
            {/* <TabsContent value="subtasks">
              <div className="p-4 bg-card text-center rounded-md">
                Subtasks management will be available soon.
              </div>
            </TabsContent> */}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="md:w-1/3 space-y-6">
          {/* Task Status Section - Only visible to authorized users */}
          {canInteract ? (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Status</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <TaskStatusUpdate task={task} taskId={id} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Status</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-md">
                  {statusIcons[task.status]}
                  <span className="text-sm font-medium capitalize">{task.status}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional details */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Details</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {/* Created By */}
              <div className="space-y-1">
                <div className="text-sm text-default-500 font-medium flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Created By
                </div>
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={task.createdBy?.image} />
                    <AvatarFallback className="text-xs">
                      {task.createdBy?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {task.createdBy?.name || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Assigned To */}
              <div className="space-y-1">
                <div className="text-sm text-default-500 font-medium flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Assigned To
                  {!canEditAssignments && (
                    <span className="text-xs ml-2 text-muted-foreground">(Only Project Leads can change)</span>
                  )}
                </div>
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.assignedTo.map((user) => (
                      <div key={user._id} className="flex items-center">
                        <Avatar className="h-6 w-6 mr-1">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-default-400">Unassigned</p>
                )}
              </div>

              {/* Only show edit button for Project Leads */}
              {canEditAssignments && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Assignments
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Dialog */}
      {task && (
        <EditTask 
          open={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          task={task}
          onTaskUpdated={handleTaskUpdated}
          canEditAssignments={canEditAssignments}
        />
      )}
    </div>
  );
} 