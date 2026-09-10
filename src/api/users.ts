import type { Request, Response } from "express";
import { BadRequestError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { NewUser } from "../db/schema.js";
import { createUser, getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, hashPassword } from "../auth.js";

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
        respondWithError(res, 401, "Unauthorized");
        return;
    };
    if (!user.hashedPassword) {
        respondWithError(res, 401, "incorrect email or password")
        return;
    }
    const match = await checkPasswordHash(password, user.hashedPassword);
    if (!match) {
        respondWithError(res, 401, "incorrect email or password")
        return;
    };
    type noPWNewUser = Omit<NewUser, "hashedPassword">
    const noPWResponseUser: noPWNewUser = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
    respondWithJSON(res, 200, noPWResponseUser);
};