export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  createdAt: Date;
  feedback: {
    author: {
      name: string;
      email: string;
    };
    designFile: {
      name: string;
    };
  };
}

export interface TasksData {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}
