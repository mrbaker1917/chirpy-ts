import type { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError, UserForbiddenError } from "./errors.js";

import { respondWithJSON, respondWithError } from "./json.js";
import { createChirp, getAllChirps, getChirpById, deleteChirp } from "../db/queries/chirps.js";
import { NewChirp } from "../db/schema.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";

export async function handlerCreateChirp(req: Request, res: Response) {
    const jwToken = getBearerToken(req);
    const userId = validateJWT(jwToken, config.api.secret);
    
    type parameters = {
        body: string;
    };
    const params: parameters = req.body;
    const maxChirpLength = 140;
    if (params.body.length > maxChirpLength) {
        throw new BadRequestError(`Chirp is too long. Max length is ${maxChirpLength}`);
    }
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

    const newChirp: NewChirp = {
        body: censoredChirp,
        userId: userId,
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
        throw new BadRequestError("chirpId is not valid");
    }
    const chirp = await getChirpById(chirpId);
    if (!chirp) {
        respondWithError(res, 404, "Chirp not found");
        return;
    }
    respondWithJSON(res, 200, chirp);
};

export async function handlerDeleteChirp(req: Request, res: Response) {
    const { chirpId } = req.params;
    if (typeof chirpId !== "string") {
        throw new BadRequestError("ChirpId is not valid");
    };
    const token = getBearerToken(req);
    if (!token) {
        throw new BadRequestError("Access token not found in request.");
    };

    const userId = validateJWT(token, config.api.secret);
    if (!userId) {
        throw new UserNotAuthenticatedError("Invalid access token.");
    };
    const chirp = await getChirpById(chirpId);
    if (!chirp) {
        throw new BadRequestError("Chirp not found.");
    };
    if (chirp.userId === userId) {
        await deleteChirp(chirpId)
    } else {
        throw new UserForbiddenError("User not authorized to delete chirp.");
    }
    respondWithJSON(res, 204, "Chirp was deleted.");

};