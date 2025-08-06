export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "backlog" | "todo" | "in_progress" | "in_review" | "blocked" | "done";
  createdAt: Date;
  updatedAt: Date;
  feedback: {
    author: {
      name: string;
      email: string;
    };
    createdAt: Date;
    text: string;
    designFile: {
      name: string;
      url: string;
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
