import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        return valid ? user : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Blocked accounts can't sign in, by password or by Google.
    async signIn({ user }) {
      if (!user.email) return true;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      return !dbUser?.isBlocked;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      // Re-read from the database on every request, so role changes and
      // blocks take effect immediately instead of at the next login.
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) token.role = dbUser.role;
        token.blocked = Boolean(dbUser?.isBlocked);
      }
      return token;
    },
    async session({ session, token }) {
      // A blocked client gets a session with no user, so every existing
      // `session?.user` check in the app treats them as logged out.
      if (token.blocked) {
        return { expires: session.expires } as typeof session;
      }
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});