import { CosmosClient, Database } from "@azure/cosmos";
import { getConfigOrThrow } from "./config";
import { InfoFunction } from "./functions/info";

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(config.COSMOS_DB_NAME);
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DatabaseDependency = {
  readonly db: Database;
};

export const Info = InfoFunction({ db: database });
