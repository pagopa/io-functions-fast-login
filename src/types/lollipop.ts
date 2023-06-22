import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { AssertionRef } from "../generated/definitions/fn-lollipop/AssertionRef";
import { AssertionType } from "../generated/definitions/fn-lollipop/AssertionType";
import { LollipopMethod } from "../generated/definitions/internal/LollipopMethod";
import { LollipopOriginalURL } from "../generated/definitions/internal/LollipopOriginalURL";
import { LollipopSignatureInput } from "../generated/definitions/internal/LollipopSignatureInput";
import { LollipopSignature } from "../generated/definitions/internal/LollipopSignature";
import { LollipopPublicKey } from "../generated/definitions/internal/LollipopPublicKey";

export const LollipopHeaders = t.type({
  ["x-pagopa-lollipop-assertion-ref"]: AssertionRef,
  ["x-pagopa-lollipop-assertion-type"]: AssertionType,
  ["x-pagopa-lollipop-auth-jwt"]: NonEmptyString,
  ["x-pagopa-lollipop-original-method"]: LollipopMethod,
  ["x-pagopa-lollipop-original-url"]: LollipopOriginalURL,
  ["x-pagopa-lollipop-public-key"]: LollipopPublicKey,
  ["x-pagopa-lollipop-user-id"]: FiscalCode,

  // eslint-disable-next-line sort-keys
  ["signature"]: LollipopSignature,
  ["signature-input"]: LollipopSignatureInput
});
export type LollipopHeaders = t.TypeOf<typeof LollipopHeaders>;
