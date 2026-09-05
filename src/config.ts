type APIConfig = {
    fileserverHits: number;
    dbURL: string;
};

process.loadEnvFile();


function envOrThrow(key: string) {
    const dbURL = process.env[key];
    if (!dbURL) {
        throw new Error(`Environment variable ${dbURL} is not set`);
    }
    return dbURL;
};

export const config: APIConfig = {
    fileserverHits: 0,
    dbURL: envOrThrow("DB_URL")
};
