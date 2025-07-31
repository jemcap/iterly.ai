import { prisma } from "@/lib/prismaClient";
import bcrypt from "bcryptjs";

export async function POST() {
  const guestEmail = "guest@user.com";
  const guestPassword = "guestpassword";
  try {
    let guestUser = await prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!guestUser) {
      const hashedPassword = await bcrypt.hash(guestPassword, 10);
      guestUser = await prisma.user.create({
        data: {
          email: guestEmail,
          name: "Guest User",
          password: hashedPassword,
        },
      });

      return Response.json(
        {
          success: true,
          message: "Guest user created successfully",
          guestEmail: guestUser.email,
        },
        { status: 201 }
      );
    } else {
      return Response.json(
        {
          success: true,
          message: "Guest user already exists",
          guestEmail: guestUser.email,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
