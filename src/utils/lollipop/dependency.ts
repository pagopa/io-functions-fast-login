import { BlobService } from "azure-storage";
import * as TE from "fp-ts/lib/TaskEither";
import * as redis from "redis";
import { Client } from "../../generated/definitions/fn-lollipop/client";

export type FnLollipopClient = Client<"ApiKeyAuth">;
export type FnLollipopClientDependency = {
  readonly fnLollipopClient: FnLollipopClient;
  readonly blobService: BlobService;
  readonly redisClientTask: TE.TaskEither<Error, redis.RedisClientType>;
};
