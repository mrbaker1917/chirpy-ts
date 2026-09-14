import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { config } from "./config.js";

import { BadRequestError, UserNotAuthenticatedError } from "./api/errors.js";
import { getUserFromRefreshToken, revokeRefreshToken } from "./db/queries/refresh.js";
import { respondWithError, respondWithJSON } from "./api/json.js";

const TOKEN_ISSUER = "chirpy";

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
  if (!password) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const token = jwt.sign(
    {
      iss: TOKEN_ISSUER,
      sub: userID,
      iat: issuedAt,
      exp: expiresAt,
    } satisfies payload,
    secret,
    { algorithm: "HS256" },
  );

  return token;
};

export function validateJWT(tokenString: string, secret: string) {
  let decoded: payload;
  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (e) {
    throw new UserNotAuthenticatedError("Invalid token");
  }

  if (decoded.iss !== TOKEN_ISSUER) {
    throw new UserNotAuthenticatedError("Invalid issuer");
  }

  if (!decoded.sub) {
    throw new UserNotAuthenticatedError("No user ID in token");
  }

  return decoded.sub;
};

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new UserNotAuthenticatedError("No BearerToken found.");
  };
  const authParts = authHeader.split(" ");
  if (authParts.length != 2 || authParts[0] != "Bearer") {
    throw new BadRequestError("Bearer Token not parsed correctly.");
  };
  return authParts[1].trim();
};

export function makeRefreshToken() {
  return randomBytes(32).toString("hex");
};

export async function handlerRefreshToken(req: Request, res: Response) {
  const refToken = getBearerToken(req);
  const userId = await getUserFromRefreshToken(refToken);
  if (!userId) {
    respondWithError(res, 401, "Refresh Token not found");
    return;
  };
  const jwt = makeJWT(userId.id, config.api.secret)
  respondWithJSON(res, 200, {token: jwt});
};

export async function handlerRevoke(req: Request, res: Response) {
  const refToken = getBearerToken(req);
  await revokeRefreshToken(refToken);
  res.status(204).send();
};