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
import ProcessingIndicator from "./ProcessingIndicator";
import { useEventStream } from "@/hooks/useEventStream";
import { useSession } from "next-auth/react";

const Dashboard = () => {
  const { data: session } = useSession();
  const { isConnected, addEventListener } = useEventStream();
  
  const [tasks, setTasks] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Real-time processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchTasks();
  }, []);

  // Set up real-time event listeners
  useEffect(() => {
    if (!session?.user) return;

    const cleanupFunctions: (() => void)[] = [];

    // Listen for processing start
    cleanupFunctions.push(
      addEventListener('processing_started', (event) => {
        console.log('🔄 Processing started:', event);
        setIsProcessing(true);
        setProcessingProgress({
          current: 0,
          total: event.totalFeedback || 0,
          message: event.message || 'Starting processing...'
        });
      })
    );

    // Listen for processing progress
    cleanupFunctions.push(
      addEventListener('processing_progress', (event) => {
        console.log('📊 Processing progress:', event);
        setProcessingProgress({
          current: event.current || 0,
          total: event.total || 0,
          message: event.message || `Processing ${event.current}/${event.total}...`
        });
      })
    );

    // Listen for new tasks being created
    cleanupFunctions.push(
      addEventListener('task_created', (event) => {
        console.log('✅ Dashboard - New task created event received:', event);
        console.log('✅ Dashboard - Task data:', event.task);
        
        // Add new task to the tasks state
        setTasks(prevTasks => {
          console.log('✅ Dashboard - Previous tasks state:', prevTasks);
          
          if (!prevTasks) {
            console.log('✅ Dashboard - No previous tasks, initializing with new task');
            const status = event.task.status || 'backlog';
            return {
              backlog: status === 'backlog' ? [event.task] : [],
              todo: status === 'todo' ? [event.task] : [],
              in_progress: status === 'in_progress' ? [event.task] : [],
              in_review: status === 'in_review' ? [event.task] : [],
              blocked: status === 'blocked' ? [event.task] : [],
              done: status === 'done' ? [event.task] : [],
            };
          }
          
          const newTask = {
            ...event.task,
            // Ensure the task matches the expected structure
            feedback: event.task.feedback || {
              author: { name: 'Unknown', email: 'unknown@example.com' },
              designFile: { name: 'Unknown' }
            },
            createdAt: new Date(event.task.createdAt || new Date()),
          };
          
          const updatedTasks = { ...prevTasks };
          
          // Add to backlog by default (or use the task's status)
          const status = newTask.status || 'backlog';
          console.log('✅ Dashboard - Adding task to status:', status);
          console.log('✅ Dashboard - Current tasks in', status, ':', updatedTasks[status as keyof TasksData]?.length || 0);
          
          // Ensure the status column exists and is an array
          if (!updatedTasks[status as keyof TasksData]) {
            updatedTasks[status as keyof TasksData] = [];
          }
          
          updatedTasks[status as keyof TasksData] = [
            ...updatedTasks[status as keyof TasksData],
            newTask
          ];
          
          console.log('✅ Dashboard - Updated tasks in', status, ':', updatedTasks[status as keyof TasksData].length);
          console.log('✅ Dashboard - New task added:', newTask.title);
          
          return updatedTasks;
        });

        // Update progress
        if (event.progress) {
          setProcessingProgress({
            current: event.progress.current,
            total: event.progress.total,
            message: `Created task ${event.progress.tasksCreated}: "${event.task.title}"`
          });
        }
      })
    );

    // Listen for processing completion
    cleanupFunctions.push(
      addEventListener('processing_completed', (event) => {
        console.log('🎉 Processing completed:', event);
        setIsProcessing(false);
        setProcessingProgress(null);
        
        // Show completion message briefly
        setTimeout(() => {
          setError(null);
        }, 3000);
      })
    );

    // Listen for task skips
    cleanupFunctions.push(
      addEventListener('task_skipped', (event) => {
        console.log('⏭️ Task skipped:', event);
        // Optionally show skipped feedback in UI
      })
    );

    // Listen for processing errors
    cleanupFunctions.push(
      addEventListener('processing_error', (event) => {
        console.error('❌ Processing error:', event);
        setError(`Error processing comment: ${event.error}`);
      })
    );

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [session?.user, addEventListener]);

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
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Design Feedback Dashboard
              </h1>

            </div>

            <FigmaImport
              onImportSuccess={() => {
                fetchTasks();
                setRefreshTrigger((prev) => prev + 1);
              }}
            />

            <ProcessingIndicator 
              isProcessing={isProcessing}
              progress={processingProgress}
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="p-8">
          <div className="max-w-full">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Design Feedback Dashboard
              </h1>

            </div>

            <FigmaImport
              onImportSuccess={() => {
                fetchTasks();
                setRefreshTrigger((prev) => prev + 1);
              }}
            />

            <ProcessingIndicator 
              isProcessing={isProcessing}
              progress={processingProgress}
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
