import { config } from "../config.js";
import { Request, Response } from "express";

export async function handlerMetrics(_: Request, res: Response) {
    res.send(`Hits: ${config.fileserverHits}`);
};