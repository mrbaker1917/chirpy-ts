import { handlerReadiness } from "./api/readiness.js";
import express from "express";
import { middlewareLogResponses } from "./api/middleware.js";

const app = express();
const port = 8080;

app.use(middlewareLogResponses);
app.use("/app", express.static("./src/app"));

app.get("/healthz", handlerReadiness);

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
