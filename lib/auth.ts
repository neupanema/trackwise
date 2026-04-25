import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [

    // ── Google ──
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email + Password ──
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user } = await supabase
          .from("User")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.image ?? null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/login" },

  callbacks: {
    // runs when someone signs in with Google
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const name  = user.name  ?? "User";
        const image = user.image ?? null;

        // check if user already exists
        const { data: existing } = await supabase
          .from("User")
          .select("id, onboarded")
          .eq("email", email)
          .maybeSingle();

        if (!existing) {
          // new Google user → create account
          const { data: newUser } = await supabase
            .from("User")
            .insert([{
              name,
              email,
              image,
              password:  "",
              onboarded: false,
            }])
            .select()
            .single();

          if (newUser) user.id = newUser.id;
        } else {
          user.id = existing.id;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.image = user.image;
      }

      if (token.id) {
        const { data: dbUser } = await supabase
          .from("User")
          .select("image, name, onboarded")
          .eq("id", token.id as string)
          .maybeSingle();

        if (dbUser) {
          token.image     = dbUser.image;
          token.name      = dbUser.name;
          token.onboarded = dbUser.onboarded;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id    = token.id    as string;
        session.user.image = token.image as string;
        session.user.name  = token.name  as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
});