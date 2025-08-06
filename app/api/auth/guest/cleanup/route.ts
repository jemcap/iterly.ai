import { prisma } from "@/lib/prismaClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    console.log("[Cleanup] Session data:", session);
    
    // Allow cleanup if user is guest or if no session (being called during logout)
    const isGuestSession = session?.user?.email === "guest@user.com";
    
    if (!isGuestSession && session) {
      console.log("[Cleanup] Not a guest user, skipping cleanup");
      return Response.json(
        { message: "Unauthorized - Only guest users can use this endpoint" },
        { status: 401 }
      );
    }

    const guestUser = await prisma.user.findUnique({
      where: { email: "guest@user.com" },
      select: { id: true }
    });

    if (!guestUser) {
      console.log("[Cleanup] Guest user not found in database");
      return Response.json(
        { message: "Guest user not found" },
        { status: 404 }
      );
    }

    console.log("[Cleanup] Found guest user with ID:", guestUser.id);

    // Get all design files uploaded by guest user
    const guestDesignFiles = await prisma.designFile.findMany({
      where: { uploadedById: guestUser.id },
      select: { id: true }
    });

    const designFileIds = guestDesignFiles.map(df => df.id);
    console.log("[Cleanup] Guest user has", designFileIds.length, "design files");

    // Get all feedback IDs for guest's design files
    const guestFeedback = await prisma.feedback.findMany({
      where: {
        OR: [
          { designFileId: { in: designFileIds } },
          { authorId: guestUser.id },
          { userId: guestUser.id }
        ]
      },
      select: { id: true }
    });

    const feedbackIds = guestFeedback.map(f => f.id);
    console.log("[Cleanup] Found", feedbackIds.length, "feedback items");

    // Count items before deletion for logging
    const tasksCount = await prisma.task.count({
      where: {
        OR: [
          { feedbackId: { in: feedbackIds } },
          { assigneeId: guestUser.id }
        ]
      }
    });

    console.log(`[Cleanup] Items to delete - Tasks: ${tasksCount}, Feedback: ${feedbackIds.length}, Design Files: ${designFileIds.length}`);

    // Delete all related data in the correct order to respect foreign key constraints
    const result = await prisma.$transaction(async (tx) => {
      // Delete all tasks that are either:
      // 1. Associated with feedback from guest's design files
      // 2. Assigned to the guest user
      const deletedTasks = await tx.task.deleteMany({
        where: {
          OR: [
            { feedbackId: { in: feedbackIds } },
            { assigneeId: guestUser.id }
          ]
        }
      });

      // Delete all feedback that is either:
      // 1. Associated with guest's design files
      // 2. Authored by guest
      // 3. Linked to guest user
      const deletedFeedback = await tx.feedback.deleteMany({
        where: {
          OR: [
            { designFileId: { in: designFileIds } },
            { authorId: guestUser.id },
            { userId: guestUser.id }
          ]
        }
      });

      // Delete all design files uploaded by guest user
      const deletedDesignFiles = await tx.designFile.deleteMany({
        where: {
          uploadedById: guestUser.id
        }
      });

      // Also delete any sessions for the guest user to ensure clean state
      const deletedSessions = await tx.session.deleteMany({
        where: {
          userId: guestUser.id
        }
      });

      // Delete any accounts linked to guest user
      const deletedAccounts = await tx.account.deleteMany({
        where: {
          userId: guestUser.id
        }
      });

      return {
        tasks: deletedTasks.count,
        feedback: deletedFeedback.count,
        designFiles: deletedDesignFiles.count,
        sessions: deletedSessions.count,
        accounts: deletedAccounts.count
      };
    });

    console.log(`[Cleanup] Successfully deleted:
      - Tasks: ${result.tasks}
      - Feedback: ${result.feedback}
      - Design Files: ${result.designFiles}
      - Sessions: ${result.sessions}
      - Accounts: ${result.accounts}`);

    return Response.json(
      {
        success: true,
        message: "Guest user data cleaned successfully",
        deleted: result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cleanup] Error cleaning guest data:", error);
    return Response.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}