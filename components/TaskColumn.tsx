"use client"

import { useState, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Task } from '@/types/taskType'
import TaskCard from './TaskCard'

interface TaskColumnProps {
  id?: string
  title: string
  tasks: Task[]
  bgColor: string
  borderColor: string
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  id = 'default-column',
  title,
  tasks,
  bgColor,
  borderColor,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  // During SSR, render without drop functionality
  if (!isMounted) {
    return (
      <div
        className={`
          min-w-80 max-w-80 rounded-lg border-2 p-4
          ${bgColor} ${borderColor}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <span className="bg-gray-200 text-gray-600 text-sm px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {tasks.filter(t => t.priority === 'high').length} High Priority
              </span>
              <span>
                {tasks.filter(t => t.priority === 'medium').length} Medium
              </span>
              <span>
                {tasks.filter(t => t.priority === 'low').length} Low
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-80 max-w-80  rounded-lg border-2 p-4 transition-all duration-200
        ${bgColor} ${borderColor}
        ${isOver ? 'border-blue-400 bg-blue-100 scale-105' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <span className="bg-gray-200 text-gray-600 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone Indicator */}
      {isOver && (
        <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 mb-4 bg-blue-50">
          <p className="text-blue-600 text-center text-sm font-medium">
            Drop task here
          </p>
        </div>
      )}

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.length === 0 && !isOver ? (
          <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">Drag tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>

      {/* Column Footer */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {tasks.filter(t => t.priority === 'high').length} High Priority
            </span>
            <span>
              {tasks.filter(t => t.priority === 'medium').length} Medium
            </span>
            <span>
              {tasks.filter(t => t.priority === 'low').length} Low
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskColumn