import { Task } from "@/types/taskType";
import TaskCard from "./TaskCard";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  bgColor: string;
  borderColor: string;
}

function TaskColumn({ title, tasks, bgColor, borderColor }: TaskColumnProps) {
  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-4 w-80 flex-shrink-0`}>
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

export default TaskColumn;