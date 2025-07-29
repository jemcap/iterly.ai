import { prisma } from "@/lib/prismaClient";

function processCommentWithNLP(content: string) {
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

  let priority = "medium";
  if (urgentKeywords.some((keyword) => task.includes(keyword))) {
    priority = "high";
  } else if (mediumKeywords.some((keyword) => task.includes(keyword))) {
    priority = "medium";
  } else if (lowKeywords.some((keyword) => task.includes(keyword))) {
    priority = "low";
  }

  let summary =
    content.length > 100 ? content.substring(0, 100) + "..." : content;

  // Generate task title from first sentence
  const taskTitle = content.split(".")[0] + (content.includes(".") ? "." : "");
  return {
    title: taskTitle,
    summary,
    priority,
  };
}

export async function POST() {
  try {
    // Get unprocessed feedback
    const unprocessedFeedback = await prisma.feedback.findMany({
      where: { isProcessed: false },
      include: { author: true, designFile: true },
    });

    const generatedTasks = [];

    for (const feedback of unprocessedFeedback) {
      // Process with NLP
      const nlpResult = processCommentWithNLP(feedback.content);

      // Update feedback with AI analysis
      await prisma.feedback.update({
        where: { id: feedback.id },
        data: {
          isProcessed: true,
          aiSummary: nlpResult.summary,
          priority: nlpResult.priority,
        },
      });

      // Generate task
      const task = await prisma.task.create({
        data: {
          title: nlpResult.title,
          description: `Based on feedback: "${feedback.content}"`,
          priority: nlpResult.priority,
          status: "todo",
          feedbackId: feedback.id,
        },
      });

      generatedTasks.push(task);
    }

    return Response.json({
      success: true,
      message: `Processed ${unprocessedFeedback.length} comments and generated ${generatedTasks.length} tasks`,
      tasks: generatedTasks,
    });
  } catch (error) {
    console.error("NLP processing error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to process comments with NLP",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
