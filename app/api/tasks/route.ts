import { prisma } from "@/lib/prismaClient";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        feedback: {
          include: {
            author: true,
            designFile: true
          }
        },
        assignee: true
      },
      orderBy: [
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' }  // Recent first
      ]
    });

    // Group by status for Kanban board
    const tasksByStatus = {
      todo: tasks.filter(task => task.status === 'todo'),
      in_progress: tasks.filter(task => task.status === 'in_progress'),
      done: tasks.filter(task => task.status === 'done')
    };

    return Response.json({
      success: true,
      tasks: tasksByStatus,
      totalTasks: tasks.length
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}