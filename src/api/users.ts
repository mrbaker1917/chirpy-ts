import type { Request, Response } from "express";
import { BadRequestError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { NewUser } from "../db/schema.js";
import { createUser } from "../db/queries/users.js";

export async function handlerCreateUser(req: Request, res: Response) {
    type parameters = {
        email: string;
    };

    const params: parameters = req.body;
    const email = params.email;
    if (!email) {
        throw new BadRequestError("No email in request!")
    }
    const user: NewUser = {
        email: email,
    };

    const newUser = await createUser(user);
    if (!newUser) {
        throw new Error("Could not create user.")
    }
    respondWithJSON(res, 201, newUser);
};