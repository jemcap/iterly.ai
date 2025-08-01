import { prisma } from "@/lib/prismaClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== "guest@user.com") {
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
      return Response.json(
        { message: "Guest user not found" },
        { status: 404 }
      );
    }

    // Delete all related data in the correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete tasks first (they reference feedback)
      await tx.task.deleteMany({
        where: {
          feedback: {
            designFile: {
              uploadedById: guestUser.id
            }
          }
        }
      });

      // Delete feedback (references design files)
      await tx.feedback.deleteMany({
        where: {
          designFile: {
            uploadedById: guestUser.id
          }
        }
      });

      // Delete design files uploaded by guest user
      await tx.designFile.deleteMany({
        where: {
          uploadedById: guestUser.id
        }
      });
    });

    return Response.json(
      {
        success: true,
        message: "Guest user data cleaned successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cleaning guest data:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}