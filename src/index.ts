import express from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc, errorHandler } from "./api/middleware.js";
import { handlerMetrics } from "./api/metrics.js";
import { handlerCreateChirp, handlerGetChirpById, handlerGetChirps, handlerDeleteChirp } from "./api/chirp.js";
import { handlerReset } from "./api/reset.js";
import { handlerCreateUser, handlerLogin, handlerUpdateUser, handlerChirpyRedUpdate } from "./api/users.js";
import { handlerRefreshToken, handlerRevoke } from "./auth.js";
import { config } from "./config.js"

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.get("/api/healthz", (req, res, next) => {
    Promise.resolve(handlerReadiness(req, res)).catch(next);
});
app.get("/admin/metrics", (req, res, next) => {
    Promise.resolve(handlerMetrics(req, res)).catch(next);
});
app.post("/admin/reset", (req, res, next) => {
    Promise.resolve(handlerReset(req, res)).catch(next);
});
app.post("/api/users", (req, res, next) => {
    Promise.resolve(handlerCreateUser(req, res)).catch(next);
});
app.post("/api/login", (req, res, next) => {
    Promise.resolve(handlerLogin(req, res)).catch(next);
})
app.get("/api/chirps", (req, res, next) => {
    Promise.resolve(handlerGetChirps(req, res)).catch(next);
});
app.post("/api/chirps", (req, res, next) => {
    Promise.resolve(handlerCreateChirp(req, res)).catch(next);
});
app.get("/api/chirps/:chirpId", (req, res, next) => {
    Promise.resolve(handlerGetChirpById(req, res)).catch(next);
});
app.post("/api/refresh", (req, res, next) => {
    Promise.resolve(handlerRefreshToken(req, res)).catch(next);
});
app.post("/api/revoke", (req, res, next) => {
    Promise.resolve(handlerRevoke(req, res)).catch(next);
});
app.put("/api/users", (req, res, next) => {
    Promise.resolve(handlerUpdateUser(req, res)).catch(next);
});
app.delete("/api/chirps/:chirpId", (req, res, next) => {
    Promise.resolve(handlerDeleteChirp(req, res)).catch(next);
});
app.post("/api/polka/webhooks", (req, res, next) => {
    Promise.resolve(handlerChirpyRedUpdate(req, res)).catch(next);
});

app.use(errorHandler);

async function main() {
    app.listen(config.api.port, () => {
        console.log(`Server is running at http://localhost:${config.api.port}`);
    });
}

main();
