"use client";

import { Task } from "@/types/taskType";
import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  if (!task) return null;

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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <DialogTitle
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    {task.title}
                  </DialogTitle>
                  <button
                    type="button"
                    className="ml-4 rounded-full p-1 hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                      {task.status.replace("_", " ")}
                    </span>
                    <span className="text-sm font-medium text-gray-600 ml-4">
                      Priority:
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* AI Analysis Tags */}
                  {task.aiAnalysis && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        AI Analysis
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                            task.aiAnalysis.category
                          )}`}
                        >
                          {task.aiAnalysis.category}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {getActionTypeIcon(task.aiAnalysis.actionType)}{" "}
                          {task.aiAnalysis.actionType}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getEffortColor(
                            task.aiAnalysis.estimatedEffort
                          )}`}
                        >
                          {task.aiAnalysis.estimatedEffort} effort
                        </span>
                        {task.aiAnalysis.urgency && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Urgency: {task.aiAnalysis.urgency}/10
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>

                  {/* Developer Notes */}
                  {task.aiAnalysis?.devNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">💡</span> Developer Notes
                      </h4>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-900">
                          {task.aiAnalysis.devNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Design File
                    </h4>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        {task.feedback.designFile.name}
                      </span>
                      <a
                        href={task.feedback.designFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Open in Figma →
                      </a>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t">
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(task.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {new Date(task.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskDetailModal;
