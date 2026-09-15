import { MigrationConfig } from "drizzle-orm/migrator";

type Config = {
    api: APIConfig;
    db: DBConfig;
};

type APIConfig = {
    fileserverHits: number;
    port: number;
    platform: string;
    secret: string;
    polkaAPIkey: string;
};

type DBConfig = {
    url: string;
    migrationConfig: MigrationConfig;
}

process.loadEnvFile();

function envOrThrow(key: string) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

const migrationConfig: MigrationConfig = {
    migrationsFolder: "./src/db/migrations",
};

export const config: Config = {
    api : {
     fileserverHits: 0,
     port: Number(envOrThrow("PORT")),
     platform: envOrThrow("PLATFORM"),
     secret: envOrThrow("SECRET"),
     polkaAPIkey: envOrThrow("POLKA_KEY"),
    },
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: migrationConfig,
    }
};
