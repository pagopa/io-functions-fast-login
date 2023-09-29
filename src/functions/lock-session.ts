import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as H from "@pagopa/handler-kit";
import { FnLockSessionClientDependency } from "../utils/ioweb/dependency";
import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { RequiredBodyMiddleware } from "../middlewares/request";
import { LockSessionData } from "../generated/definitions/internal/LockSessionData";
import { empty } from "@pagopa/handler-kit";

const makeLockSessionHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<null, 204>,
  FnLockSessionClientDependency
> = H.of((req: H.HttpRequest) =>
  pipe(
    req,
    sequenceS(RTE.ApplyPar)({
      body: RequiredBodyMiddleware(LockSessionData)
    }),
    RTE.fromTaskEither,
    //call backend
    RTE.map(_ => empty)
  )
);

export const LockSessionFunction = httpAzureFunction(makeLockSessionHandler);
