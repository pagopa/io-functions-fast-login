import * as middlewares from "../../middlewares/request";
import { PUBLIC_KEY_HEADER_NAME, makeFastLoginHandler } from "../fast-login";
import * as H from "@pagopa/handler-kit";
import { httpHandlerInputMocks } from "../__mocks__/handlerMocks";
import * as E from "fp-ts/Either";
import { FnLollipopClient } from "../../utils/lollipop/dependency";
import { AssertionTypeEnum } from "../../generated/definitions/fn-lollipop/AssertionType";
import { LollipopMethodEnum } from "../../generated/definitions/internal/LollipopMethod";
import {
  aFiscalCode,
  aLollipopSignature,
  aLollipopSignatureInput,
  aSAMLResponse,
  anAssertionRef
} from "../__mocks__/lollipopMocks";

const getAssertionMock = jest.fn(async () =>
  E.right({
    status: 200,
    value: { response_xml: aSAMLResponse }
  })
);
const mockedFnLollipopClient = ({
  getAssertion: getAssertionMock
} as unknown) as FnLollipopClient;
describe("Fast Login handler", () => {
  it(`GIVEN a valid LolliPoP request
      WHEN all checks passed
      THEN the SAMLResponse is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        [PUBLIC_KEY_HEADER_NAME]: "a-pub-key",
        ["x-pagopa-lollipop-assertion-ref"]: anAssertionRef,
        ["x-pagopa-lollipop-assertion-type"]: AssertionTypeEnum.SAML,
        ["x-pagopa-lollipop-auth-jwt"]: "aFakeJwtToken",
        ["x-pagopa-lollipop-original-method"]: LollipopMethodEnum.POST,
        ["x-pagopa-lollipop-original-url"]: "https://api.test.it/fast-login",
        ["x-pagopa-lollipop-public-key"]: "aFakeLollipopPubkey",
        ["x-pagopa-lollipop-user-id"]: aFiscalCode,

        ["signature"]: aLollipopSignature,
        ["signature-input"]: aLollipopSignatureInput
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(getAssertionMock).toBeCalled();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          body: { SAMLResponse: aSAMLResponse },
          statusCode: 200
        })
      );
    }
  });
  it(`GIVEN a invalid LolliPoP request
      WHEN all the required headers are missing
      THEN a Bad Request error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-wrong-header": "sub-that-does-not-exists"
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toEqual(
        expect.objectContaining({
          status: 400
        })
      );
    }
  });
});
