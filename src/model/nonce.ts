import * as redis from "redis";
import * as TE from "fp-ts/TaskEither";
import { toError } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import {
  FUNCTION_PREFIX,
  falsyResponseToErrorAsync,
  singleStringReply
} from "../utils/redis/client";

export const NONCE_PREFIX = "NONCE-";
export const DEFAULT_NONCE_EXPIRE_SEC = 60;

const prefixer = (key: string): string =>
  `${FUNCTION_PREFIX}${NONCE_PREFIX}${key}`;

export const create = (nonce: string) => (
  redisClient: redis.RedisClientType
): TE.TaskEither<Error, boolean> =>
  pipe(
    TE.tryCatch(
      () =>
        redisClient.setEx(
          prefixer(nonce),
          DEFAULT_NONCE_EXPIRE_SEC,
          "" // An empty string as value, we need only to store a key
        ),
      err =>
        new Error(`Error saving the generated nonce: [${toError(err).message}]`)
    ),
    singleStringReply,
    falsyResponseToErrorAsync(new Error("Error saving the key"))
  );
