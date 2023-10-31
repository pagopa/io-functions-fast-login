import * as redis from "redis";
import * as TE from "fp-ts/TaskEither";
import { toError } from "fp-ts/lib/Either";
import { pipe, flow } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import {
  FUNCTION_PREFIX,
  falsyResponseToErrorAsync,
  singleStringReply
} from "../utils/redis/client";
import { Nonce } from "../generated/definitions/models/Nonce";
import { LollipopSignatureInput } from "../generated/definitions/internal/LollipopSignatureInput";

const nonceRegex = new RegExp('nonce="(.*?)"');
export const NONCE_PREFIX = "NONCE-";
export const DEFAULT_NONCE_EXPIRE_SEC = 60;

export const prefixer = (key: Nonce): string =>
  `${FUNCTION_PREFIX}${NONCE_PREFIX}${key}`;

export const create = (nonce: Nonce) => (
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

export const getNonceFromSignatureInput = (
  signatureInput: LollipopSignatureInput
): E.Either<Error, Nonce> =>
  pipe(
    signatureInput.match(nonceRegex),
    O.fromNullable,
    // take out only the first group of the match
    O.chainNullableK(matchArray => matchArray.at(1)),
    O.fold(
      () => E.left(new Error("Could not retrieve nonce from signature-input.")),
      flow(
        Nonce.decode,
        E.mapLeft(
          errors =>
            new Error(
              `Error while decoding nonce: [${readableReportSimplified(
                errors
              )}]`
            )
        )
      )
    )
  );

type GetDeleteNonceT = (
  redis_client: redis.RedisClientType
) => (nonce: Nonce) => TE.TaskEither<Error, true>;
export const getDeleteNonce: GetDeleteNonceT = redis_client => nonce =>
  pipe(
    TE.tryCatch(() => redis_client.del(prefixer(nonce)), E.toError),
    TE.chain(
      TE.fromPredicate(
        reply => reply === 1,
        _ => new Error("Unexpected response from redis client: Deleted 0 keys")
      )
    ),
    TE.map(_ => true as const)
  );
