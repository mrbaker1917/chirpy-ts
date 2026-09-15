import type { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { NewUser } from "../db/schema.js";
import { createUser, getUserByEmail, updateUser, upgradeUser } from "../db/queries/users.js";
import { makeJWT, checkPasswordHash, hashPassword, makeRefreshToken, getBearerToken, validateJWT, getAPIKey } from "../auth.js";
import { config } from "../config.js"
import { getUserFromRefreshToken, saveRefreshToken } from "../db/queries/refresh.js";

type parameters = {
    password: string;
    email: string;
    event: string;
    data: {userId: string};
};

export async function handlerCreateUser(req: Request, res: Response) {

    const params: parameters = req.body;
    const email = params.email;
    if (!email) {
        throw new BadRequestError("No email in request!");
    };
    const password = params.password;
    if (!password) {
        throw new BadRequestError("No password in request!");
    };
    const hashedPW = await hashPassword(password);

    const user: NewUser = {
        email: email,
        hashedPassword: hashedPW,
    };

    const newUser = await createUser(user);
    if (!newUser) {
        throw new Error("Could not create user.")
    }
    type noPWNewUser = Omit<NewUser, "hashedPassword">
    const noPWResponseUser: noPWNewUser = {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        isChirpyRed: false,
    }
    respondWithJSON(res, 201, noPWResponseUser);
};

export async function handlerLogin(req: Request, res: Response) {
    const params: parameters = req.body;
    const email = params.email;
    if (!email) {
        throw new BadRequestError("No email in request!");
    };
    const password = params.password;
    if (!password) {
        throw new BadRequestError("No password in request!");
    };
    const user = await getUserByEmail(email);
    if (!user || typeof user.id !== "string") {
        throw new UserNotAuthenticatedError("incorrect email or password");
    };
    if (!user.hashedPassword || typeof user.hashedPassword !== "string") {
        throw new UserNotAuthenticatedError("incorrect email or password");
    };
    const match = await checkPasswordHash(password, user.hashedPassword);
    if (!match) {
        throw new UserNotAuthenticatedError("incorrect email or password");
    };

    const secret = config.api.secret;

    const token = makeJWT(user.id, secret);

    const refreshToken = makeRefreshToken();
    const saveRF = await saveRefreshToken(user.id, refreshToken);
    if (!saveRF) {
        throw new Error("refresh Token not saved to db")
    };

    type noPWNewUser = Omit<NewUser, "hashedPassword">
    const noPWResponseUser = {
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
        token: token,
        refreshToken: refreshToken,
        isChirpyRed: user.isChirpyRed,
    }
    respondWithJSON(res, 200, noPWResponseUser);
};

export async function handlerUpdateUser(req: Request, res: Response) {
    const params: parameters = req.body;
    const newEmail = params.email;
    if (!newEmail) {
        throw new BadRequestError("No email in request!");
    };
    const newPassword = params.password;
    if (!newPassword) {
        throw new BadRequestError("No password in request!");
    };

    const newHashedPW = await hashPassword(newPassword);
    const token = getBearerToken(req);
    if (!token) {
        respondWithError(res, 401, "Access token is malformed.");
    }
    const userId = validateJWT(token, config.api.secret);

    const updatedUser = await updateUser(userId, newEmail, newHashedPW);
        const noPWResponseUser = {
        id: updatedUser.id,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        email: updatedUser.email,
        token: token,
        isChirpyRed: updatedUser.isChirpyRed,
    };
    respondWithJSON(res, 200, noPWResponseUser);
};

export async function handlerChirpyRedUpdate(req: Request, res: Response) {
    const reqApiKey = await getAPIKey(req);
    if (reqApiKey !== config.api.polkaAPIkey) {
        res.status(401).end(0);
    };

    const params: parameters = req.body;
    const event = params.event;
    if (event !== "user.upgraded") {
        res.status(204).end();
        return;
    };
    const userId = params.data.userId;
    const result = await upgradeUser(userId);
    if (result === undefined) {
        res.status(404).end();
    } else {
        res.status(204).end();
    }

}