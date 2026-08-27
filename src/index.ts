import { handlerReadiness } from "./api/readiness.js";
import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { countRequests } from "./api/requestHits.js";
import config from "./config.js";

const app = express();
const port = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.get("/metrics", countRequests);
app.get("/healthz", handlerReadiness);
app.get("/reset", (req, res) => {
    config.fileserverHits = 0;
    res.status(200).json({ "Hits": config.fileserverHits });
});

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
