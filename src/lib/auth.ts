import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!usuario?.senha) return null;

        // A senha era gravada e comparada em texto puro. Contas antigas
        // continuam entrando e são migradas para hash no primeiro login.
        const senhaEmHash = usuario.senha.startsWith("$2");
        const confere = senhaEmHash
          ? await compare(credentials.password, usuario.senha)
          : usuario.senha === credentials.password;

        if (!confere) return null;

        if (!senhaEmHash) {
          await prisma.user.update({
            where: { id: usuario.id },
            data: { senha: await hash(credentials.password, 12) },
          });
        }

        return {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          admin: usuario.admin,
        };
      },
    }),
  ],
  // Sem fallback: um segredo público no código permitia forjar JWT com
  // admin:true quando a env faltasse. Se faltar, o NextAuth falha alto.
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.admin = (user as any).admin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).admin = token.admin || false;
      }
      return session;
    },
  },
};
