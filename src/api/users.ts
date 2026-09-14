import type { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { NewUser } from "../db/schema.js";
import { createUser, getUserByEmail } from "../db/queries/users.js";
import { makeJWT, checkPasswordHash, hashPassword, makeRefreshToken } from "../auth.js";
import { config } from "../config.js"
import { saveRefreshToken } from "../db/queries/refresh.js";

type parameters = {
    password: string;
    email: string;
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
    if (!user) {
        throw new UserNotAuthenticatedError("incorrect email or password");
    };
    if (!user.hashedPassword) {
        throw new UserNotAuthenticatedError("incorrect email or password");
    }
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
    }
    respondWithJSON(res, 200, noPWResponseUser);
};