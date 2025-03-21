"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TaskSidebar = () => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-3 items-center">
        <div className="w-full flex justify-center">
          <Badge variant="outline" className="px-4 py-2 text-base font-medium">
            Task Management
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Organize and manage your tasks efficiently
        </div>
      </div>
      
      <div className="border border-dashed border-default-300"></div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          variant="default" 
          className="w-full flex items-center gap-2"
        >
          <Icon icon="heroicons:plus-circle" className="w-5 h-5" />
          <span>Create New Task</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
        >
          <Icon icon="heroicons:document-text" className="w-5 h-5" />
          <span>View All Tasks</span>
        </Button>
      </div>
      
      <div className="border border-dashed border-default-300"></div>
      
      <div className="flex flex-col space-y-2">
        <div className="text-xs font-medium text-default-800 uppercase px-2">
          Quick Filters
        </div>
        <Button 
          variant="ghost" 
          className="justify-start text-default-600 hover:text-primary hover:bg-primary/10"
        >
          <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
          <span>Completed</span>
        </Button>
        <Button 
          variant="ghost" 
          className="justify-start text-default-600 hover:text-primary hover:bg-primary/10"
        >
          <Icon icon="heroicons:clock" className="w-4 h-4 mr-2" />
          <span>In Progress</span>
        </Button>
      </div>
    </div>
  );
};

export default TaskSidebar;
