import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/lib/nodemailer/reset-password";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }

    const authConfig = {
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
                if (process.env.DISABLE_EMAIL === 'true') {
                    console.warn('Password reset email skipped because DISABLE_EMAIL=true');
                    return;
                }

                void sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    resetUrl: url,
                }).catch((error) => {
                    console.error('Failed to queue password reset email:', error);
                });
            },
        },
        plugins: [nextCookies()],
    };

    if (process.env.DISABLE_DB_AUTH === 'true') {
        console.warn('⚠️ Better Auth is running without MongoDB because DISABLE_DB_AUTH=true. Auth is for lab/dev only.');
        authInstance = betterAuth(authConfig);
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;
    const database = db.db;

    if (!db || !database) {
        throw new Error("MongoDB connection not found!");
    }

    authInstance = betterAuth({
        ...authConfig,
        database: mongodbAdapter(database),
    });

    return authInstance;
};

export const auth = await getAuth();
