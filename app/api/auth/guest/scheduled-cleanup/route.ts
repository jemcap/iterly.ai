import { prisma } from "@/lib/prismaClient";

export async function POST(request: Request) {
  try {
    // Verify the request is from an authorized source (e.g., cron job)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const guestUser = await prisma.user.findUnique({
      where: { email: "guest@user.com" },
      select: { id: true }
    });

    if (!guestUser) {
      return Response.json(
        { message: "Guest user not found" },
        { status: 404 }
      );
    }

    // Find and delete old guest sessions (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all expired sessions for the guest user
    const expiredSessions = await prisma.session.findMany({
      where: {
        userId: guestUser.id,
        expires: {
          lt: twentyFourHoursAgo
        }
      },
      select: { id: true }
    });

    if (expiredSessions.length === 0) {
      return Response.json(
        { 
          success: true,
          message: "No expired guest sessions found" 
        },
        { status: 200 }
      );
    }

    // Clean up data for expired guest sessions
    await prisma.$transaction(async (tx) => {
      // Delete expired sessions
      await tx.session.deleteMany({
        where: {
          id: {
            in: expiredSessions.map(s => s.id)
          }
        }
      });

      // Get design files that were created more than 24 hours ago by guest
      const oldDesignFiles = await tx.designFile.findMany({
        where: {
          uploadedById: guestUser.id,
          createdAt: {
            lt: twentyFourHoursAgo
          }
        },
        select: { id: true }
      });

      if (oldDesignFiles.length > 0) {
        // Delete tasks associated with old design files
        await tx.task.deleteMany({
          where: {
            feedback: {
              designFileId: {
                in: oldDesignFiles.map(df => df.id)
              }
            }
          }
        });

        // Delete feedback associated with old design files
        await tx.feedback.deleteMany({
          where: {
            designFileId: {
              in: oldDesignFiles.map(df => df.id)
            }
          }
        });

        // Delete old design files
        await tx.designFile.deleteMany({
          where: {
            id: {
              in: oldDesignFiles.map(df => df.id)
            }
          }
        });
      }
    });

    return Response.json(
      {
        success: true,
        message: `Cleaned up ${expiredSessions.length} expired guest sessions and associated data`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in scheduled guest cleanup:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}