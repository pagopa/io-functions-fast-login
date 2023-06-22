import { CosmosClient } from "@azure/cosmos";
import { getConfigOrThrow } from "./config";
import { InfoFunction } from "./functions/info";
import { FastLoginFunction } from "./functions/fast-login";
import { createClient } from "./generated/definitions/fn-lollipop/client";
import { FnLollipopClient } from "./utils/lollipop/dependency";

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(config.COSMOS_DB_NAME);

export const fnLollipopClient: FnLollipopClient = createClient({
  baseUrl: config.LOLLIPOP_GET_ASSERTION_BASE_URL.href,
  fetchApi: fetch,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  withDefaults: op => params =>
    op({
      ...params,
      ApiKeyAuth: config.LOLLIPOP_GET_ASSERTION_API_KEY
    })
});

export const Info = InfoFunction({ db: database });
export const FastLogin = FastLoginFunction({ fnLollipopClient });
