"use client";

import { useState, useEffect } from "react";
import { getTasks } from "@/config/project-config";
import { getContacts } from "../chat/chat-config";
import ViewTask from "./view-task";
import { Loader2 } from "lucide-react";

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, contactsData] = await Promise.all([
          getTasks(),
          getContacts()
        ]);
        
        setTasks(tasksData);
        setContacts(contactsData);
      } catch (error) {
        console.error("Error loading task page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ViewTask contacts={contacts} tasks={tasks} />;
};

export default TaskPage;
