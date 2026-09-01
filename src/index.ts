import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc, errorHandler } from "./api/middleware.js";
import { handlerMetrics } from "./api/metrics.js";
import { handlerChirpsValidate } from "./api/chirp.js";
import { handlerReset } from "./api/reset.js";

const app = express();
const port = 8080;

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
app.post("/api/validate_chirp", (req, res, next) => {
    Promise.resolve(handlerChirpsValidate(req, res)).catch(next);
});

app.use(errorHandler);

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
