import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics } from "./api/metrics.js";
import { handlerChirpsValidate } from "./api/chirp.js";
import { handlerReset } from "./api/reset.js";

const app = express();
const port = 8080;

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.get("/admin/metrics", handlerMetrics);
app.get("/api/healthz", handlerReadiness);
app.post("/admin/reset", handlerReset);
app.post("/api/validate_chirp", handlerChirpsValidate);

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
