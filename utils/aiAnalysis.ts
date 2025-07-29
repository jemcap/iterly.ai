import OpenAI from "openai";
import { AIAnalysisResult } from "@/types/aiAnalysisType";

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Pre-filter function to determine if a comment is actionable
async function isCommentActionable(content: string): Promise<boolean> {
  // Stage 1: Quick rule-based filtering (no AI cost)
  const quickFilter = isCommentActionableQuick(content);
  if (!quickFilter) {
    return false;
  }

  // Stage 2: AI-powered validation for edge cases
  try {
    const prompt = `Analyze if this comment contains actionable feedback for UI/UX development:

Comment: "${content}"

Return ONLY "true" or "false".

Rules:
- true: Contains specific feedback about design, functionality, bugs, improvements, or user experience
- false: General encouragement, personal comments, off-topic discussion, social chatter

Examples:
- "Great work!" → false
- "Let's go team!" → false  
- "The button is too small" → true
- "This color doesn't work" → true
- "Looking good so far" → false
- "Can we make this responsive?" → true`;

    const response = await model.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.1 // Very low temperature for consistent binary decisions
    });

    const result = response.choices[0].message.content?.toLowerCase().trim();
    return result === "true";

  } catch (error) {
    console.warn("AI filtering failed, using quick filter result:", error);
    return quickFilter; // Fallback to rule-based result
  }
}

// Fast rule-based pre-filtering (no API cost)
function isCommentActionableQuick(content: string): boolean {
  const lowerContent = content.toLowerCase().trim();
  
  // Filter out obviously non-actionable patterns
  const nonActionablePatterns = [
    // Encouragement/praise only
    /^(great|good|nice|awesome|excellent|perfect|amazing|love it|looks good|looking good)[\s!.]*$/,
    
    // Social/personal comments
    /^(hi|hello|hey|thanks|thank you|lol|haha|😀|😊|👍|🎉|💪)[\s!.]*$/,
    
    // Short exclamations
    /^(yes|no|ok|okay|sure|cool|neat|sweet)[\s!.]*$/,
    
    // Team encouragement
    /let['']?s go|go team|keep it up|well done|nice work/,
    
    // Very short non-descriptive
    /^.{1,3}$/,
    
    // Just emojis or symbols
    /^[\s\p{Emoji}\p{Symbol}!.?-]+$/u
  ];

  // Check if comment matches non-actionable patterns
  for (const pattern of nonActionablePatterns) {
    if (pattern.test(lowerContent)) {
      console.log(`🚫 Quick filter: "${content}" matches non-actionable pattern`);
      return false;
    }
  }

  // Look for actionable keywords (positive indicators)
  const actionableKeywords = [
    // Design feedback
    'color', 'colour', 'font', 'size', 'spacing', 'layout', 'design', 'style',
    
    // Functionality
    'button', 'link', 'form', 'input', 'menu', 'navigation', 'click',
    
    // Issues/improvements  
    'fix', 'change', 'update', 'improve', 'should', 'could', 'needs',
    'broken', 'error', 'bug', 'issue', 'problem', 'wrong',
    
    // UX feedback
    'user', 'experience', 'usability', 'accessibility', 'responsive',
    'mobile', 'desktop', 'tablet', 'screen',
    
    // Content
    'text', 'copy', 'content', 'image', 'icon', 'logo',
    
    // Performance
    'slow', 'fast', 'loading', 'performance'
  ];

  const hasActionableKeywords = actionableKeywords.some(keyword => 
    lowerContent.includes(keyword)
  );

  // Must have actionable keywords AND reasonable length
  const hasReasonableLength = content.trim().length >= 8;
  
  return hasActionableKeywords && hasReasonableLength;
}

export async function analyseFeedback(
  content: string,
  figmaNodeId?: string,
  designFileName?: string
): Promise<AIAnalysisResult | null> {
  try {
    // Stage 1: Pre-filter to check if comment is actionable
    const isActionable = await isCommentActionable(content);
    
    if (!isActionable) {
      console.log(`⏭️  Skipping non-actionable comment: "${content.substring(0, 50)}..."`);
      return null; // Return null for non-actionable comments
    }

    console.log(`✅ Comment is actionable, proceeding with AI analysis: "${content.substring(0, 50)}..."`);

    const systemPrompt = `You are an expert product manager and design systems analyst with over 20 years of experience in the field, and have worked and managed several teams in agile methodologies. Your job is to analyze design feedback and convert it into actionable tasks for developers.
    
    Context:
    - You are analyzing feedback and suggestions on UI/UX designs.
    - The feedback comes from designers, stakeholders, or users.
    - You need to create clear, prioritized tasks for developers.
    - Consider both user impact and technical feasibility.

    Always respond with valid JSON in the following format:
    {
      "title": "Task title summarizing the feedback",
      "priority": "low" | "medium" | "high",
      "urgency": 1-10, // 1 being least urgent, 10 being most urgent
      "category": "visual" | "functional" | "content" | "usability" | "performance",
      "actionType": "fix" | "improve" | "add" | "remove",
      "estimatedEffort": "low" | "medium" | "high",
      "summary": "One sentence summary of the task",
      "reasoning": "Brief explanation of why this task is needed",
      "devNotes": "Any additional notes for the development team"
  
    }`;

    const userPrompt = `Analyze the following design feedback and convert it into actionable tasks for developers. Use the context provided above.

    Feedback: "${content}"
    ${figmaNodeId ? `Figma Node ID: ${figmaNodeId}` : ""}
    ${designFileName ? `Design File Name: ${designFileName}` : ""}

    Guidelines:
    - Use clear, concise language.
    - "broken", : "error", "bug", "urgent" always indicate high priority.
    - "should", "improve", "update" indicate medium priority.
    - "nice to have", "could be better" indicate low priority.
    - Always keep title concise but descriptive enough to understand the task.
    - devNotes should include any technical considerations or dependencies.
    - Consider mobile/responsive design implications if applicable.
    - Consider accessibility and usability best practices.
    - Consider performance implications of the task.
    - Think about user experience and how this task impacts it.

    Return only the JSON response, do not include any additional text or explanations.`;

    console.log("🔍 Analyzing feedback with AI model...");
    const response = await model.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent || typeof responseContent !== "string") {
      throw new Error("Invalid response format from AI model");
    }

    const analysis = JSON.parse(responseContent) as AIAnalysisResult;
    if (!analysis || typeof analysis !== "object") {
      throw new Error("AI model did not return a valid analysis object");
    }
    console.log("✅ Analysis complete:", analysis);

    // Parse the analysis result (assuming it's in JSON format)
    return analysis;
  } catch (error) {
    console.error("Error analyzing feedback:", error);
    
    // Check if comment is actionable before falling back
    const isActionable = isCommentActionableQuick(content);
    if (!isActionable) {
      console.log(`⏭️  Skipping non-actionable comment in fallback: "${content.substring(0, 50)}..."`);
      return null;
    }
    
    // Use fallback only for actionable comments
    console.log("🔄 Using keyword-based fallback for actionable comment");
    return keywordAnalysisFallback(content);
  }
}

function keywordAnalysisFallback(content: string): AIAnalysisResult {
  const urgentKeywords = [
    "broken",
    "error",
    "bug",
    "urgent",
    "critical",
    "not working",
    "fix",
    "must",
  ];
  const mediumKeywords = [
    "should",
    "improve",
    "update",
    "consider",
    "please",
    "recommend",
    "suggest",
  ];
  const lowKeywords = [
    "nice to have",
    "could be better",
    "optional",
    "suggestion",
    "like to see",
  ];

  const task = content.toLowerCase();
  let urgency = 5;
  let priority: "low" | "medium" | "high" = "medium";
  if (urgentKeywords.some((keyword) => task.includes(keyword))) {
    priority = "high";
    urgency = 10;
  } else if (mediumKeywords.some((keyword) => task.includes(keyword))) {
    priority = "medium";
    urgency = 7;
  } else if (lowKeywords.some((keyword) => task.includes(keyword))) {
    priority = "low";
    urgency = 3;
  }

  let summary =
    content.length > 100 ? content.substring(0, 100) + "..." : content;
  const taskTitle = content.split(".")[0] + (content.includes(".") ? "." : "");
  return {
    title: taskTitle,
    priority,
    urgency,
    summary,
    category: "functional", // Default category, can be improved later
    actionType: "improve", // Default action type, can be improved later
    estimatedEffort: "medium", // Default effort, can be improved later
    reasoning: "Fallback analysis based on keyword detection",
    devNotes:
      "This analysis was generated using a keyword-based fallback method due to AI model limitations.",
  };
}

