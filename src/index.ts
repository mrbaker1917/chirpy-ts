import { handlerReadiness } from "./api/readiness.js";
import express from "express";

const app = express();
const port = 8080;

app.use("/app", express.static("./src/app"));

app.get("/healthz", handlerReadiness);

async function main() {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

main();
