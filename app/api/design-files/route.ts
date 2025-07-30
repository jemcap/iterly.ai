import { prisma } from "@/lib/prismaClient";

export async function GET() {
  try {
    const files = await prisma.designFile.findMany({
      include: {
        feedback: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const filesWithCounts = files.map(file => ({
      id: file.id,
      name: file.name,
      figmaFileUrl: file.figmaFileUrl,
      createdAt: file.createdAt.toISOString(),
      feedbackCount: file.feedback.length
    }));

    return Response.json({
      success: true,
      files: filesWithCounts
    });
  } catch (error) {
    console.error("Failed to fetch design files:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch design files"
      },
      { status: 500 }
    );
  }
}