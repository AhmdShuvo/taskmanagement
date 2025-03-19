// lib/auth.js
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    // Remove Credentials Provider since we will use custom api for this
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {  // Correct destructuring
      //console.log("SignIn callback", { user, account, profile });
      // Check email domain (if needed) for social logins
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user?.email?.endsWith(process.env.ALLOWED_DOMAIN)) {
          throw new Error("You are not allowed to access this platform");
        }
      }
      return true;  // Allow sign-in
    },
  },
  // Remove pages to avoid redirect
  pages: {},
};