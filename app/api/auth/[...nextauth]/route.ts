import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Check if user exists
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Generate a unique playerId
          let playerId: number;
          let isUnique = false;

          while (!isUnique) {
            playerId = Math.floor(10000 + Math.random() * 90000);
            const existing = await prisma.user.findUnique({
              where: { playerId },
            });
            if (!existing) {
              isUnique = true;
            }
          }

          // Create new user
          existingUser = await prisma.user.create({
            data: {
              name: user.name || "Google User",
              email: user.email,
              age: 0,
              gender: "OTHER",
              password: "", // No password for Google users
              playerId: playerId!,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Get playerId from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.playerId = dbUser.playerId;
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).playerId = token.playerId;
        (session.user as any).id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to live page after sign in
      return `${baseUrl}/cricket/live`;
    },
  },
  pages: {
    signIn: "/cricket/live/login",
    error: "/cricket/live/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };