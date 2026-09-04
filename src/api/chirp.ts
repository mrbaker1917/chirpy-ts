import type { Request, Response } from "express";
import { BadRequestError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";


export async function handlerChirpsValidate(req: Request, res: Response) {
    type parameters = {
        body: string;
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
    respondWithJSON(res, 200, {
        "cleanedBody": censoredChirp,
    });
}