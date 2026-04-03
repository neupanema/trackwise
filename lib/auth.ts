import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // find user in database
        const { data: user } = await supabase
          .from("User")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (!user) return null;

        // check password
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.image ?? null, // ← return image on login
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // runs right after login
      if (user) {
        token.id    = user.id;
        token.image = user.image; // ← store image in token
      }

      // runs on EVERY request — fetch latest from DB
      // so profile picture updates are reflected immediately
      if (token.id) {
        const { data: dbUser } = await supabase
          .from("User")
          .select("image, name")
          .eq("id", token.id as string)
          .maybeSingle();

        if (dbUser) {
          token.image = dbUser.image; // ← always latest image
          token.name  = dbUser.name;  // ← always latest name
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id    = token.id    as string;
        session.user.image = token.image as string; // ← image in session
        session.user.name  = token.name  as string;
      }
      return session;
    },
  },
});