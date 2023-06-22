import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/ReaderTaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import { JwkPublicKeyFromToken } from "@pagopa/ts-commons/lib/jwk";
import {
  RequiredHeaderMiddleware,
  RequiredHeadersMiddleware
} from "../middlewares/request";
import { FastLoginSAML } from "../generated/definitions/internal/FastLoginSAML";
import { LollipopHeaders } from "../types/lollipop";
import { FnLollipopClientDependency } from "../utils/lollipop/dependency";
import { isAssertionSaml } from "../utils/lollipop/assertion";
import { LollipopAuthBearer } from "../generated/definitions/fn-lollipop/LollipopAuthBearer";

/* TODO:
 * 1. Check the request integrity and the signature
 * 2. Retrieve the SAMLResponse from the fn-lollipop
 * 3. Check the inResponseTo with the assertionRef
 * 4. Return the SAMLResponse or an error
 */

// eslint-disable-next-line extra-rules/no-commented-out-code
/*
RequiredHeaderMiddleware(
  "x-pagopa-lollipop-public-key",
  JwkPublicKeyFromToken
),
RequiredHeadersMiddleware(LollipopHeaders),
RequiredBodyPayloadMiddleware(SignMessagePayload),
HttpMessageSignatureMiddleware()
 */

export const PUBLIC_KEY_HEADER_NAME = "x-pagopa-lollipop-public-key" as NonEmptyString;

const RetrieveSAMLResponse: (
  lollipopHeaders: LollipopHeaders
) => RTE.ReaderTaskEither<
  FnLollipopClientDependency,
  H.HttpError,
  FastLoginSAML
> = (lollipopHeaders: LollipopHeaders) => ({ fnLollipopClient }) =>
  pipe(
    TE.tryCatch(
      () =>
        fnLollipopClient.getAssertion({
          assertion_ref: lollipopHeaders["x-pagopa-lollipop-assertion-ref"],
          ["x-pagopa-lollipop-auth"]: `Bearer ${lollipopHeaders["x-pagopa-lollipop-auth-jwt"]}` as LollipopAuthBearer
        }),
      () => new H.HttpError("Error calling the getAssertion endpoint")
    ),
    TE.chainW(
      flow(
        TE.fromEither,
        TE.mapLeft(_ => new H.HttpError("Unexpected response from fn-lollipop"))
      )
    ),
    TE.chain(response =>
      response.status === 200
        ? TE.right(response.value)
        : TE.left(new H.HttpError("Error retrieving the SAML Assertion"))
    ),
    TE.filterOrElse(
      isAssertionSaml(lollipopHeaders["x-pagopa-lollipop-assertion-type"]),
      () => new H.HttpError("OIDC Claims not supported yet.")
    ),
    TE.map(assertion => ({ saml_response: assertion.response_xml }))
  );

export const makeFastLoginHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<FastLoginSAML, 200>,
  FnLollipopClientDependency
> = H.of((req: H.HttpRequest) =>
  pipe(
    req,
    sequenceS(RTE.ApplyPar)({
      lollipopHeaders: RequiredHeadersMiddleware(LollipopHeaders),
      publicKey: RequiredHeaderMiddleware(
        JwkPublicKeyFromToken,
        PUBLIC_KEY_HEADER_NAME
      )
    }),
    RTE.fromTaskEither,
    RTE.chain(_ => RetrieveSAMLResponse(_.lollipopHeaders)),
    RTE.map(H.successJson)
  )
);

export const FastLoginFunction = httpAzureFunction(makeFastLoginHandler);
