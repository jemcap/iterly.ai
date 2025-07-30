import { prisma } from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session as any).user?.id) {
      return Response.json(
        { error: "Unauthorized - Please sign in" }, 
        { status: 401 }
      );
    }

    const userId = (session as any).user.id;

    const tasks = await prisma.task.findMany({
      where: {
        feedback: {
          userId: userId
        }
      },
      include: {
        feedback: {
          include: {
            user: true,
            designFile: true,
          },
        },
        assignee: true,
      },
      orderBy: [
        { priority: "desc" }, // High priority first
        { createdAt: "desc" }, // Recent first
      ],
    });

    // Group by status for Kanban board
    const tasksByStatus = {
      backlog: tasks.filter((task: any) => task.status === "backlog"),
      todo: tasks.filter((task: any) => task.status === "todo"),
      in_progress: tasks.filter((task: any) => task.status === "in_progress"),
      in_review: tasks.filter((task: any) => task.status === "in_review"),
      blocked: tasks.filter((task: any) => task.status === "blocked"),
      done: tasks.filter((task: any) => task.status === "done"),
    };

    return Response.json({
      success: true,
      tasks: tasksByStatus,
      totalTasks: tasks.length,
      userId: userId,
      userName: (session as any).user?.name || 'Unknown User',
    });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return Response.json(
      { 
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
