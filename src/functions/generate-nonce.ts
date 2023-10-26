import * as crypto from "crypto";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { toError } from "fp-ts/lib/Either";
import * as E from "fp-ts/Either";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { GenerateNonceDependencies } from "../utils/ioweb/dependency";
import { Nonce } from "../generated/definitions/internal/Nonce";
import { GenerateNonceResponse } from "../generated/definitions/internal/GenerateNonceResponse";

const NONCE_PREFIX = "NONCE-";
const DEFAULT_NONCE_EXPIRE_SEC = 60;

const unlockUserSession: () => RTE.ReaderTaskEither<
  GenerateNonceDependencies,
  H.HttpError,
  Nonce
> = () => ({ redisClientTask }) =>
  pipe(
    TE.of(crypto.randomUUID({ disableEntropyCache: true })),
    TE.chainEitherK(
      flow(
        Nonce.decode,
        E.mapLeft(
          errors =>
            new H.HttpError(
              `Error generating the nonce: [${readableReportSimplified(
                errors
              )}]`
            )
        )
      )
    ),
    TE.chainFirst(nonce =>
      pipe(
        redisClientTask,
        TE.mapLeft(
          err =>
            new H.HttpError(
              `Error connecting to the redis client: [${toError(err).message}]`
            )
        ),
        TE.chain(redisClient =>
          TE.tryCatch(
            () =>
              redisClient.setEx(
                `${NONCE_PREFIX}${nonce}`,
                DEFAULT_NONCE_EXPIRE_SEC,
                "" // An empty string as value, we need only to store a key
              ),
            err =>
              new H.HttpError(
                `Error saving the generated nonce: [${toError(err).message}]`
              )
          )
        )
      )
    )
  );

export const makeGenerateNonce: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<GenerateNonceResponse, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  GenerateNonceDependencies
> = H.of((req: H.HttpRequest) =>
  pipe(
    req,
    unlockUserSession,
    RTE.map(nonce => H.successJson({ nonce })),
    RTE.orElseW(error =>
      RTE.right(H.problemJson({ status: error.status, title: error.message }))
    )
  )
);

export const GenerateNonceFunction = httpAzureFunction(makeGenerateNonce);
