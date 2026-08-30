import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics } from "./api/metrics.js";
import { config } from "./config.js";
import { handlerReset } from "./api/reset.js";

const app = express();
const port = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.get("/admin/metrics", handlerMetrics);
app.get("/api/healthz", handlerReadiness);
app.post("/admin/reset", handlerReset);

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
