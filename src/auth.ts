import { hash, verify } from "argon2";

export async function hashPassword(password: string): Promise<string> {
    const hashedPW = await hash(password);
    return hashedPW;
};

export async function checkPasswordHash(password: string, storedHash: string): Promise<boolean> {
    const match = await verify(storedHash, password);
    return match;
};