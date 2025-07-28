import { prisma } from "@/lib/prismaClient";

export async function GET() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: "designer@example.com" },
    });

    if (existingUser) {
      return Response.json({
        success: true,
        message: "User already exists in database",
        user: existingUser,
      });
    }
    const user = await prisma.user.create({
      data: {
        email: "designer@example.com",
        name: "Test Designer",
      },
    });

    return Response.json(
      {
        success: true,
        message: "PoC database ready.",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Database error",
        details: error,
      },
      { status: 500 }
    );
  }
}
