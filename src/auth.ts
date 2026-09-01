import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function getOrCreateUser(userId: string, email: string, name?: string | null, image?: string | null) {
  // First, try to find by email (Google OAuth may have different ID)
  if (email) {
    const existingByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingByEmail[0]) {
      // User exists with this email, update their info if needed
      const [updated] = await db
        .update(users)
        .set({
          name: name ?? existingByEmail[0].name,
          image: image ?? existingByEmail[0].image,
          emailVerified: new Date(),
        })
        .where(eq(users.id, existingByEmail[0].id))
        .returning();
      return updated;
    }
  }
  
  // Fallback: check by ID (for credentials users)
  const existingById = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existingById[0]) return existingById[0];
  
  // Create user if not exists
  const [newUser] = await db.insert(users).values({
    id: userId,
    email,
    name: name ?? '',
    image: image ?? '',
    emailVerified: new Date(),
  }).returning();
  return newUser;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validated = credentialsSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (!user[0] || !user[0].passwordHash) return null;

        const isValid = await bcrypt.compare(password, user[0].passwordHash);
        if (!isValid) return null;

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          image: user[0].image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create user in database for Google OAuth if not exists
      if (account?.provider === 'google' && user?.email && user.id) {
        await getOrCreateUser(user.id, user.email, user.name ?? '', user.image ?? '');
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
});
