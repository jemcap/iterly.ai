export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "backlog" | "todo" | "in_progress" | "in_review" | "blocked" | "done";
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
  // Add AI analysis fields
  aiAnalysis?: {
    category: "visual" | "functional" | "content" | "usability" | "performance";
    actionType: "fix" | "improve" | "add" | "remove";
    estimatedEffort: "low" | "medium" | "high";
    devNotes: string;
    urgency: number;
    reasoning: string;
  };
}

export interface TasksData {
  backlog: Task[];
  todo: Task[];
  in_progress: Task[];
  in_review: Task[];
  blocked: Task[];
  done: Task[];
}
