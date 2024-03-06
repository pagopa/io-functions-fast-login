import { LollipopSignatureInput } from "../generated/definitions/internal/LollipopSignatureInput";
import * as E from "fp-ts/Either";

const aValidSignatureInput = `sig1=("@method" "@authority" "@path" "content-digest" "content-type" "content-length" "x-pagopa-original-url" "x-pagopa-original-method");created=1618884475;keyid="test-key-ecc-p256", sig2=("@method" "@authority" "@path" "content-digest" "content-type" "content-length" "forwarded");created=1618884480;keyid="test-key-rsa";alg="rsa-v1_5-sha256";expires=1618884540`;
const anInvalidSignatureInput = `anInvalidStringInput`;
describe("LollipopSignatureInput type decoder", () => {
  it("should decode successfully a valid signature-input string", () => {
    const result = LollipopSignatureInput.decode(aValidSignatureInput);
    expect(E.isRight(result)).toBeTruthy();
  });

  it("should return an error if an invalid signatur-input is provided", () => {
    const result = LollipopSignatureInput.decode(anInvalidSignatureInput);
    expect(E.isLeft(result)).toBeTruthy();
  });
});
