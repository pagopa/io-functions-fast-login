import * as crypto_lib from "crypto";
import { verifySignatureHeader } from "@mattrglobal/http-signatures";
import * as TE from "fp-ts/TaskEither";
import * as H from "@pagopa/handler-kit";
import { JwkPublicKey } from "@pagopa/ts-commons/lib/jwk";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as jose from "jose";
import { AssertionRef } from "../../generated/definitions/fn-lollipop/AssertionRef";
import { JwkPubKeyHashAlgorithm } from "../../types/lollipop";
import { getCustomVerifyWithEncoding } from "./httpSignature.verifiers";

export const validateHttpSignatureWithEconding = (
  dsaEncoding: crypto_lib.DSAEncoding
) => (
  request: H.HttpRequest,
  assertionRef: AssertionRef,
  publicKey: JwkPublicKey,
  body?: string
): TE.TaskEither<Error, true> =>
  pipe(
    {
      body,
      httpHeaders: request.headers,
      method: request.method,
      url: request.url,
      verifier: {
        verify: getCustomVerifyWithEncoding(dsaEncoding)({
          [assertionRef]: {
            key: publicKey
          }
        })
      }
    },
    TE.of,
    TE.chain(params =>
      TE.tryCatch(async () => verifySignatureHeader(params), E.toError)
    ),
    TE.map(res =>
      res.map(r =>
        r.verified
          ? TE.of(true as const)
          : TE.left(
              new Error(
                `HTTP Request Signature failed ${JSON.stringify(r.reason)}`
              )
            )
      )
    ),
    TE.chainW(res =>
      res.unwrapOr(
        TE.left(new Error("An error occurred during signature check"))
      )
    )
  );

/**
 * Returns a function that take the input jwkPubKey and return its thumbprint encoded in base64.
 * The thumbprint is calculated using the input hash algo (default to sha256);
 *
 * @param algo the hash algorithm used to compute the thumbprint
 * @returns a function to calculate the thumprint
 */
export const calculateThumbprint = (algo?: JwkPubKeyHashAlgorithm) => (
  jwkPubKey: JwkPublicKey
): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    () => jose.calculateJwkThumbprint(jwkPubKey, algo),
    err => new Error(`Can not calculate JwkThumbprint | ${err}`)
  );
