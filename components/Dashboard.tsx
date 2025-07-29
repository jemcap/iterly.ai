"use client";

import { useEffect, useState } from "react";
import { Task, TasksData } from "@/types/taskType";

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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Design Feedback Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            title="Done"
            tasks={tasks.done}
            bgColor="bg-green-50"
            borderColor="border-green-200"
          />
        </div>
      </div>
    </div>
  );
};

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  bgColor: string;
  borderColor: string;
}

function TaskColumn({ title, tasks, bgColor, borderColor }: TaskColumnProps) {
  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-4`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {title} ({tasks.length})
      </h2>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No tasks in this column
          </p>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 text-sm leading-tight">
          {task.title}
        </h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>By: {task.feedback.author.name}</span>
        <span>{task.feedback.designFile.name}</span>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {new Date(task.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export default Dashboard;
