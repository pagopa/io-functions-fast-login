import { CosmosClient } from "@azure/cosmos";
import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";
import { agent } from "@pagopa/ts-commons";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { createBlobService } from "azure-storage";
import { getConfigOrThrow } from "./config";
import { InfoFunction } from "./functions/info";
import { FastLoginFunction } from "./functions/fast-login";
import { createClient } from "./generated/definitions/fn-lollipop/client";
import { FnLollipopClient } from "./utils/lollipop/dependency";

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(config.COSMOS_DB_NAME);

const httpApiFetch = agent.getFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export const fnLollipopClient: FnLollipopClient = createClient({
  baseUrl: config.LOLLIPOP_GET_ASSERTION_BASE_URL.href,
  fetchApi: (toFetch(
    setFetchTimeout(config.FETCH_TIMEOUT_MS as Millisecond, abortableFetch)
  ) as unknown) as typeof fetch,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  withDefaults: op => params =>
    op({
      ...params,
      ApiKeyAuth: config.LOLLIPOP_GET_ASSERTION_API_KEY
    })
});

export const blobService = createBlobService(
  config.FAST_LOGIN_AUDIT_CONNECTION_STRING
);

export const Info = InfoFunction({ db: database });
export const FastLogin = FastLoginFunction({ blobService, fnLollipopClient });
