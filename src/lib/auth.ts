import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { readFileSync, existsSync } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src/data/usuarios.json");

interface Usuario {
  nome: string;
  email: string;
  senha: string;
  admin: boolean;
  criadoEm: string;
}

function lerUsuarios(): Usuario[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export const authOptions: NextAuthOptions = {
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

        const usuarios = lerUsuarios();
        const usuario = usuarios.find(
          (u) =>
            u.email === credentials.email && u.senha === credentials.password
        );

        if (usuario) {
          return {
            id: usuario.email,
            name: usuario.nome,
            email: usuario.email,
            admin: usuario.admin,
          };
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "carcrew-dev-secret",
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
