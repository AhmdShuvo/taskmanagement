"use client";
import React from "react";
import TaskBreadCrumbs from "./components/bread-crumbs";
import { Card, CardContent } from "@/components/ui/card";
import TaskTable from "./components/task-table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import CreateTask from "./components/create-task";
import EditTask from "./components/edit-task";
import { Icon } from "@iconify/react";
import useUserRoles from "@/hooks/useUserRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Single, clean loading screen for tasks instead of skeleton
const TaskDashboardLoader = () => {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    </div>
  );
};

const ViewTask = ({ tasks: initialTasks }) => {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { isCEO, isEngineer, isProjectLead, canManageTasks, canCreateTasks, isLoading: rolesLoading } = useUserRoles();
  
  // Wait for roles to be fully loaded before rendering the actual content
  useEffect(() => {
    if (!rolesLoading) {
      // Minimal delay - just enough to prevent flickering
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [rolesLoading]);
  
  const handleSheetOpen = () => {
    setOpen(!open);
  };
  
  const handleEditSheetOpen = (task = null) => {
    setSelectedTask(task);
    setOpenEdit(!openEdit);
  };
  
  // Handler for when a task is created
  const handleTaskCreated = (newTask) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };
  
  // Handler for when a task is updated
  const handleTaskUpdated = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };

  // Show clean loading screen instead of complex skeleton
  if (!isReady) {
    return <TaskDashboardLoader />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-default-900">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your team's tasks</p>
        </div>
        <TaskBreadCrumbs />
      </div>

      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 shadow-md">
        <CardContent className="flex flex-col md:flex-row justify-between items-center p-8 gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Task Management Dashboard</h2>
            <p className="text-muted-foreground mt-2">Create, assign and track tasks with your team</p>
          </div>
          {canCreateTasks() && (
            <Button 
              onClick={handleSheetOpen}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg px-6 py-5 text-base rounded-xl"
              size="lg"
            >
              <Icon icon="heroicons:plus-circle" className="w-5 h-5" />
              <span>Add New Task</span>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Icon icon="heroicons:clipboard-document-list" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your Tasks</h3>
                <p className="text-sm text-muted-foreground">View and manage all your tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canCreateTasks() && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSheetOpen}
                  className="hidden sm:flex items-center gap-1 border-border"
                >
                  <Icon icon="heroicons:plus-sm" className="w-4 h-4" />
                  <span>Quick Add</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <TaskTable
          data={tasks}
          openSheet={handleEditSheetOpen}
        />
      </Card>
      
      {canCreateTasks() && (
        <>
          <CreateTask open={open} onClose={handleSheetOpen} onTaskCreated={handleTaskCreated} />
          <EditTask 
            open={openEdit} 
            onClose={() => handleEditSheetOpen()} 
            task={selectedTask} 
            onTaskUpdated={handleTaskUpdated}
            canEditAssignments={isProjectLead ? isProjectLead() : false}
          />
        </>
      )}
    </div>
  );
};

export default ViewTask;
