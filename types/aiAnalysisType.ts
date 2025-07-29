export interface AIAnalysisResult {
  title: string;
  priority: "low" | "medium" | "high";
  urgency: number;
  category: "visual" | "functional" | "content" | "usability" | "performance";
  actionType: "fix" | "improve" | "add" | "remove";
  estimatedEffort: "low" | "medium" | "high";
  summary: string;
  reasoning: string;
  devNotes: string;
}