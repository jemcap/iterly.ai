import { prisma } from "@/lib/prismaClient";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const { id: taskId } = await params;

    // Validate status
    const validStatuses = [
      "backlog",
      "todo",
      "in_progress",
      "in_review",
      "blocked",
      "done",
    ];
    if (!validStatuses.includes(status)) {
      return Response.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        feedback: {
          include: {
            author: true,
            designFile: true,
          },
        },
      },
    });

    console.log(`Task ${taskId} status updated to: ${status}`);

    return Response.json({
      success: true,
      message: `Task status updated to ${status}`,
      task: updatedTask,
    });
  } catch (error) {
    console.error("Failed to update task status:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(
      {
        error: "Failed to update task status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
