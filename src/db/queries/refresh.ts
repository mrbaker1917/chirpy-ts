import { db } from "../index.js";
import { NewRefreshToken, refresh_tokens, users } from "../schema.js";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function saveRefreshToken(userId: string, token: string) {
    const refreshToken: NewRefreshToken = {
        token: token,
        userId: userId,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    }
    console.log("Attempt to save refresh token:", refreshToken);
    const [result] = await db
        .insert(refresh_tokens)
        .values(refreshToken)
        .returning();
    return result;
};

export async function getUserFromRefreshToken(refreshToken: string) {
    const now: Date = new Date();
    const [result] = await db.select({
        id: users.id,
    })
        .from(refresh_tokens)
        .innerJoin(users, eq(refresh_tokens.userId, users.id))
        .where(and(eq(refresh_tokens.token, refreshToken), gt(refresh_tokens.expiresAt, now), isNull(refresh_tokens.revokedAt)));
    return result;
};

export async function revokeRefreshToken(refreshToken: string) {
    await db.update(refresh_tokens)
    .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
    })
    .where(eq(refresh_tokens.token, refreshToken))
};