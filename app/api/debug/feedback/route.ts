import { prisma } from "@/lib/prismaClient";

export async function GET() {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        author: true,
        designFile: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      totalFeedback: feedback.length,
      processedFeedback: feedback.filter(f => f.isProcessed).length,
      unprocessedFeedback: feedback.filter(f => f.isProcessed === false).length,
      feedbackWithTasks: feedback.filter(f => f.tasks.length > 0).length,
      feedbackWithoutTasks: feedback.filter(f => f.tasks.length === 0).length
    };

    return Response.json({
      success: true,
      stats,
      feedback: feedback.map(f => ({
        id: f.id,
        content: f.content.substring(0, 100) + (f.content.length > 100 ? '...' : ''),
        isProcessed: f.isProcessed,
        priority: f.priority,
        tasksCount: f.tasks.length,
        designFile: f.designFile.name,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    return Response.json({
      error: "Failed to fetch feedback",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
