"use client";

import { useEffect, useState } from "react";
import { TasksData } from "@/types/taskType";
import TaskColumn from "./TaskColumn";

const Dashboard = () => {
  const [tasks, setTasks] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (error) {
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <div className="p-8">Loading tasks...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!tasks) return <div className="p-8">No tasks found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Design Feedback Dashboard
        </h1>

        <div className="overflow-x-auto">
          <div className="flex flex-row gap-6 min-w-max">
            <TaskColumn
              title="Backlog"
              tasks={tasks.backlog}
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
            <TaskColumn
              title="To Do"
              tasks={tasks.todo}
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
            <TaskColumn
              title="In Progress"
              tasks={tasks.in_progress}
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
            />
            <TaskColumn
              title="In Review"
              tasks={tasks.in_review}
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
            />
            <TaskColumn
              title="Blocked"
              tasks={tasks.blocked}
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
            <TaskColumn
              title="Done"
              tasks={tasks.done}
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
