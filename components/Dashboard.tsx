"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { TasksData, Task } from "@/types/taskType";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import FigmaImport from "./FigmaImport";
import ImportedFiles from "./ImportedFiles";
import Header from "./Header";

const Dashboard = () => {
  const [tasks, setTasks] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    fetchTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = Object.values(tasks || {})
      .flat()
      .find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !tasks) return;

    const taskId = active.id as string;
    const newStatus = over.id as keyof TasksData;

    // Find current task and its current status
    const currentTask = Object.values(tasks)
      .flat()
      .find((task) => task.id === taskId);
    if (!currentTask) return;

    const currentStatus = currentTask.status as keyof TasksData;

    // If dropped in same column, do nothing
    if (currentStatus === newStatus) return;

    // Optimistically update UI first (better UX)
    const updatedTasks = { ...tasks };

    // Remove from current column
    updatedTasks[currentStatus] = updatedTasks[currentStatus].filter(
      (task) => task.id !== taskId
    );

    // Add to new column with updated status
    const updatedTask = { ...currentTask, status: newStatus };
    updatedTasks[newStatus] = [...updatedTasks[newStatus], updatedTask];

    setTasks(updatedTasks);

    // Update database
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      console.log(
        `Task "${currentTask.title}" moved from ${currentStatus} to ${newStatus}`
      );
    } catch (error) {
      console.error("Failed to update task status:", error);

      // Revert optimistic update on error
      setTasks(tasks);
      setError("Failed to update task. Please try again.");

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

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

  // Render without DnD during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-8">
          <div className="max-w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Design Feedback Dashboard
            </h1>

            <FigmaImport
              onImportSuccess={() => {
                fetchTasks();
                setRefreshTrigger((prev) => prev + 1);
              }}
            />

            <ImportedFiles refreshTrigger={refreshTrigger} />

            <div className="overflow-x-auto">
              <div className="flex flex-row gap-6 min-w-max">
                <TaskColumn
                  id="backlog"
                  title="Backlog"
                  tasks={tasks.backlog}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-200"
                />
                <TaskColumn
                  id="todo"
                  title="To Do"
                  tasks={tasks.todo}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-200"
                />
                <TaskColumn
                  id="in_progress"
                  title="In Progress"
                  tasks={tasks.in_progress}
                  bgColor="bg-yellow-50"
                  borderColor="border-yellow-200"
                />
                <TaskColumn
                  id="in_review"
                  title="In Review"
                  tasks={tasks.in_review}
                  bgColor="bg-yellow-50"
                  borderColor="border-yellow-200"
                />
                <TaskColumn
                  id="blocked"
                  title="Blocked"
                  tasks={tasks.blocked}
                  bgColor="bg-red-50"
                  borderColor="border-red-200"
                />
                <TaskColumn
                  id="done"
                  title="Done"
                  tasks={tasks.done}
                  bgColor="bg-green-50"
                  borderColor="border-green-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="p-8">
          <div className="max-w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Design Feedback Dashboard
            </h1>

            <FigmaImport
              onImportSuccess={() => {
                fetchTasks();
                setRefreshTrigger((prev) => prev + 1);
              }}
            />

            <ImportedFiles refreshTrigger={refreshTrigger} />

            <div className="overflow-x-auto">
              <div className="flex flex-row gap-6 min-w-max">
                <TaskColumn
                  id="backlog"
                  title="Backlog"
                  tasks={tasks.backlog}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-200"
                />
                <TaskColumn
                  id="todo"
                  title="To Do"
                  tasks={tasks.todo}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-200"
                />
                <TaskColumn
                  id="in_progress"
                  title="In Progress"
                  tasks={tasks.in_progress}
                  bgColor="bg-yellow-50"
                  borderColor="border-yellow-200"
                />
                <TaskColumn
                  id="in_review"
                  title="In Review"
                  tasks={tasks.in_review}
                  bgColor="bg-yellow-50"
                  borderColor="border-yellow-200"
                />
                <TaskColumn
                  id="blocked"
                  title="Blocked"
                  tasks={tasks.blocked}
                  bgColor="bg-red-50"
                  borderColor="border-red-200"
                />
                <TaskColumn
                  id="done"
                  title="Done"
                  tasks={tasks.done}
                  bgColor="bg-green-50"
                  borderColor="border-green-200"
                />
              </div>
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Dashboard;
