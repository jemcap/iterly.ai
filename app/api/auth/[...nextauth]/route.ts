import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prismaClient";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        }) as any;

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours for guest users
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };