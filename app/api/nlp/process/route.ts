import { prisma } from "@/lib/prismaClient";
import { analyseFeedback } from "@/utils/aiAnalysis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session as any).user?.id) {
      return Response.json(
        { error: "Unauthorized - Please sign in" }, 
        { status: 401 }
      );
    }

    const userId = (session as any).user.id;

    // Get unprocessed feedback for the authenticated user
    const unprocessedFeedback = await prisma.feedback.findMany({
      where: { 
        isProcessed: false,
        userId: userId // Only process feedback for the current user
      },
      include: {
        author: true,
        designFile: true,
      },
    });

    if (unprocessedFeedback.length === 0) {
      return Response.json({
        success: true,
        message: "No unprocessed feedback found",
        tasks: [],
      });
    }

    console.log(
      `🔄 Processing ${unprocessedFeedback.length} feedback items with AI...`
    );

    const generatedTasks = [];
    const processingResults = {
      successful: 0,
      failed: 0,
      aiAnalyzed: 0,
      fallbackAnalyzed: 0,
      skippedNonActionable: 0, // Track filtered comments
    };

    for (let feedback of unprocessedFeedback) {
      try {
        // Process with AI analysis (now includes filtering)
        const analysis = await analyseFeedback(
          feedback.content,
          feedback?.figmaNodeId || undefined,
          feedback.designFile.name
        );

        // Mark feedback as processed regardless of whether it generated a task
        await prisma.feedback.update({
          where: { id: feedback.id },
          data: {
            isProcessed: true,
            aiSummary: analysis?.summary || "Non-actionable comment - skipped",
            priority: analysis?.priority || "low",
          },
        });

        // If analysis is null, the comment was filtered out as non-actionable
        if (!analysis) {
          processingResults.skippedNonActionable++;
          console.log(
            `⏭️  Skipped non-actionable feedback: "${feedback.content.substring(
              0,
              30
            )}..."`
          );
          continue;
        }

        // Track analysis method
        if (analysis.reasoning?.includes("keyword-based fallback")) {
          processingResults.fallbackAnalyzed++;
        } else {
          processingResults.aiAnalyzed++;
        }

        // Generate enhanced task with AI insights
        const task = await prisma.task.create({
          data: {
            title: analysis.title,
            description: `${analysis.summary}

📋 Category: ${analysis.category}
🎯 Action Type: ${analysis.actionType}
⏱️ Estimated Effort: ${analysis.estimatedEffort}
Developer Notes: ${analysis.devNotes}

Original Feedback: "${feedback.content}"

AI Reasoning: ${analysis.reasoning}`,
            priority: analysis.priority,
            status: "backlog",
            feedbackId: feedback.id,
            assigneeId: userId, // Assign task to the authenticated user
          },
        });

        generatedTasks.push({
          ...task,
          aiAnalysis: analysis, 
        });

        processingResults.successful++;

        // Add small delay to respect OpenAI rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process feedback ${feedback.id}:`, error);
        processingResults.failed++;
      }
    }

    generatedTasks.sort((a, b) => {
      const urgencyA = a.aiAnalysis?.urgency || 5;
      const urgencyB = b.aiAnalysis?.urgency || 5;
      return urgencyB - urgencyA; // Higher urgency first
    });

    return Response.json({
      success: true,
      message: `AI processed ${unprocessedFeedback.length} comments: ${generatedTasks.length} tasks created, ${processingResults.skippedNonActionable} non-actionable comments filtered`,
      tasks: generatedTasks,
      analytics: {
        ...processingResults,
        totalProcessed: unprocessedFeedback.length,
        tasksCreated: generatedTasks.length,
        highPriority: generatedTasks.filter((t) => t.priority === "high")
          .length,
        mediumPriority: generatedTasks.filter((t) => t.priority === "medium")
          .length,
        lowPriority: generatedTasks.filter((t) => t.priority === "low").length,
        categories: generatedTasks.reduce((acc, task) => {
          const category = task.aiAnalysis?.category || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error("AI NLP processing error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to process comments with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
