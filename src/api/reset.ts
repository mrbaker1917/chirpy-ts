import type { Request, Response } from 'express';
import { config } from "../config.js";
import { deleteUsers } from '../db/queries/users.js';
import { UserForbiddenError } from './errors.js';

export async function handlerReset(_: Request, res: Response) {
    const platform = config.api.platform;
    if (platform !== "dev") {
        throw new UserForbiddenError("User is not authorized");
    }
    await deleteUsers();
    config.api.fileserverHits = 0;
    res.write("Hits reset to 0");
    res.end();
};