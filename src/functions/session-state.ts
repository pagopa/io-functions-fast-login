import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as H from "@pagopa/handler-kit";
import { SessionStateDependency } from "../utils/ioweb/dependency";
import { SessionState as BackendInternalSessionStateResponse } from "../generated/definitions/backend-internal/SessionState";
import { GetSessionStateData } from "../generated/definitions/internal/GetSessionStateData";
import { SessionState } from "../generated/definitions/internal/SessionState";
import { pipe } from "fp-ts/lib/function";
import * as AP from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { RequiredBodyMiddleware } from "../middlewares/request";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

const getUserSessionState: (
  fiscal_code: FiscalCode
) => RTE.ReaderTaskEither<
  SessionStateDependency,
  | H.HttpError
  | H.HttpBadRequestError
  | H.HttpForbiddenError
  | H.HttpUnauthorizedError,
  BackendInternalSessionStateResponse
> = fiscal_code => ({ backendInternalClient }) =>
  pipe(
    TE.tryCatch(
      () =>
        backendInternalClient.getUserSessionState({ fiscalcode: fiscal_code }),
      () => new H.HttpError("Error while calling the downstream component")
    ),
    TE.chainEitherK(
      E.mapLeft(
        _ => new H.HttpError("Unexpected response from backend internal")
      )
    ),
    TE.chain(({ status, value }) =>
      status === 200
        ? TE.right(value)
        : TE.left(
            new H.HttpError(
              `Error while deleting user session: downstream component returned ${status}`
            )
          )
    )
  );

export const makeSessionStateHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<SessionState, 200>,
  SessionStateDependency
> = H.of((req: H.HttpRequest) =>
  pipe(
    req,
    AP.sequenceS(RTE.ApplyPar)({
      body: RequiredBodyMiddleware(GetSessionStateData)
    }),
    RTE.fromTaskEither,
    RTE.chain(({ body }) => getUserSessionState(body.fiscal_code)),
    RTE.map(H.successJson)
  )
);

export const SessionStateFunction = httpAzureFunction(makeSessionStateHandler);
