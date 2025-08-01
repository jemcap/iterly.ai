import { prisma } from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !('id' in session.user) || !session.user.id) {
      return Response.json(
        { error: "Unauthorized - Please sign in" }, 
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // Find design files that have feedback from the current user
    const files = await prisma.designFile.findMany({
      where: {
        feedback: {
          some: {
            userId: userId // Files that have at least one feedback from current user
          }
        }
      },
      include: {
        feedback: {
          where: {
            userId: userId // Only count feedback from the current user
          },
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
      feedbackCount: file.feedback.length // Now this counts only user's feedback
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