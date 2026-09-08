import type { Request, Response } from "express";
import { BadRequestError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { createChirp, getAllChirps, getChirpById } from "../db/queries/chirps.js";
import { NewChirp } from "../db/schema.js";

export async function handlerCreateChirp(req: Request, res: Response) {
    type parameters = {
        body: string;
        userId: string;
    };
    const params: parameters = req.body;
    const chirpWords = params.body.split(" ");
    const curseWords = ["kerfuffle", "sharbert", "fornax"];
    for (let i = 0; i < chirpWords.length; i++) {
        for (let cWord of curseWords) {
            if (chirpWords[i].toLocaleLowerCase() === cWord) {
                chirpWords[i] = "****";
            }
        }
    }
    const censoredChirp = chirpWords.join(" ");

    const maxChirpLength = 140;
    if (params.body.length > maxChirpLength) {
        throw new BadRequestError(`Chirp is too long. Max length is ${maxChirpLength}`);
    }
    const newChirp: NewChirp = {
        body: censoredChirp,
        userId: params.userId,
    }
    const storedChirp = await createChirp(newChirp);

    respondWithJSON(res, 201, storedChirp);
};

export async function handlerGetChirps(__: Request, res: Response) {
    const chirps = await getAllChirps();
    respondWithJSON(res, 200, chirps);
};

export async function handlerGetChirpById(req: Request, res: Response) {
    const { chirpId } = req.params;
    if (typeof chirpId !== "string") {
        throw new Error("chirpId is not valid");
    }
    const chirp = await getChirpById(chirpId);
    if (!chirp) {
        respondWithError(res, 404, "Chirp not found");
    }
    respondWithJSON(res, 200, chirp);
};