import { Task } from "@/types/taskType";
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect } from "react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "visual":
        return "bg-purple-100 text-purple-800";
      case "functional":
        return "bg-blue-100 text-blue-800";
      case "content":
        return "bg-green-100 text-green-800";
      case "usability":
        return "bg-orange-100 text-orange-800";
      case "performance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case "fix":
        return "🔧";
      case "improve":
        return "✨";
      case "add":
        return "➕";
      case "remove":
        return "🗑️";
      default:
        return "📝";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // During SSR, render without drag functionality
  if (!isMounted) {
    return (
      <div 
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        {/* Header with title and priority */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2">
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

        {/* AI Analysis Tags */}
        {task.aiAnalysis && (
          <div className="flex flex-wrap gap-1 mb-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                task.aiAnalysis.category
              )}`}
            >
              {task.aiAnalysis.category}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {getActionTypeIcon(task.aiAnalysis.actionType)}{" "}
              {task.aiAnalysis.actionType}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(
                task.aiAnalysis.estimatedEffort
              )}`}
            >
              {task.aiAnalysis.estimatedEffort} effort
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {task.description.split("\n")[0]}
        </p>

        {/* Developer Notes */}
        {task.aiAnalysis?.devNotes && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
            <span className="font-medium text-blue-800">💡 Dev Notes:</span>
            <p className="text-blue-700 mt-1">{task.aiAnalysis.devNotes}</p>
          </div>
        )}

        {/* Footer with file and date */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="truncate">{task.feedback.designFile.name}</span>
          {task.aiAnalysis?.urgency && (
            <span className="ml-2 px-1 py-0.5 bg-gray-200 rounded text-xs">
              Urgency: {task.aiAnalysis.urgency}/10
            </span>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {new Date(task.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Details →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md 
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 rotate-2 shadow-xl z-50' : ''}
      `}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick?.();
      }}
    >
      {/* Header with title and priority */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2">
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

      {/* AI Analysis Tags */}
      {task.aiAnalysis && (
        <div className="flex flex-wrap gap-1 mb-3">
          {/* Category */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
              task.aiAnalysis.category
            )}`}
          >
            {task.aiAnalysis.category}
          </span>

          {/* Action Type */}
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {getActionTypeIcon(task.aiAnalysis.actionType)}{" "}
            {task.aiAnalysis.actionType}
          </span>

          {/* Estimated Effort */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(
              task.aiAnalysis.estimatedEffort
            )}`}
          >
            {task.aiAnalysis.estimatedEffort} effort
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
        {task.description.split("\n")[0]} {/* Show only the summary part */}
      </p>

      {/* Developer Notes */}
      {task.aiAnalysis?.devNotes && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
          <span className="font-medium text-blue-800">💡 Dev Notes:</span>
          <p className="text-blue-700 mt-1">{task.aiAnalysis.devNotes}</p>
        </div>
      )}

      {/* Footer with file and date */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="truncate">{task.feedback.designFile.name}</span>
        {task.aiAnalysis?.urgency && (
          <span className="ml-2 px-1 py-0.5 bg-gray-200 rounded text-xs">
            Urgency: {task.aiAnalysis.urgency}/10
          </span>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {new Date(task.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
        <button 
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick?.();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
