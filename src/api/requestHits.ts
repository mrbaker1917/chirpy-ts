import config from "../config.js";
import { Request, Response } from "express";

export async function countRequests(req: Request, res: Response) {
    res.status(200).type("text/plain").send(`Hits: ${config.fileserverHits}\n`);
};