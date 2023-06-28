import { makeFastLoginHandler } from "../fast-login";
import * as H from "@pagopa/handler-kit";
import { httpHandlerInputMocks } from "../__mocks__/handlerMocks";
import * as E from "fp-ts/Either";
import { FnLollipopClient } from "../../utils/lollipop/dependency";
import {
  aLollipopInvalidSignature,
  aSAMLResponse,
  anotherFiscalCode,
  validLollipopHeaders
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
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it(`GIVEN a valid LolliPoP request
      WHEN all checks passed
      THEN the SAMLResponse is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        ...validLollipopHeaders
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(getAssertionMock).toBeCalled();
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: { saml_response: aSAMLResponse },
          statusCode: 200
        })
      )
    );
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
    expect(getAssertionMock).not.toBeCalled();
    expect(result).toEqual(
      E.left(
        expect.objectContaining({
          status: 400
        })
      )
    );
  });
  it(`GIVEN a invalid LolliPoP request
      WHEN some required header is invalid
      THEN a Bad Request error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        ...validLollipopHeaders,
        ["x-pagopa-lollipop-assertion-ref"]: "anInvalidAssertionRef"
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(E.isLeft(result)).toBeTruthy();
    expect(getAssertionMock).not.toBeCalled();
    if (E.isLeft(result)) {
      expect(result.left).toEqual(
        expect.objectContaining({
          status: 400
        })
      );
    }
  });
  it(`GIVEN a invalid LolliPoP request
      WHEN the signature is invalid
      THEN a Unauthorize Request error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        ...validLollipopHeaders,
        ["signature"]: aLollipopInvalidSignature
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(E.isLeft(result)).toBeTruthy();
    expect(getAssertionMock).not.toBeCalled();
    expect(result).toEqual(
      E.left(
        expect.objectContaining({
          status: 401
        })
      )
    );
  });
  it(`GIVEN a valid LolliPoP request
      WHEN the fiscal code doesn't match with the SAML Assertion value
      THEN an Internal Server Error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        ...validLollipopHeaders,
        ["x-pagopa-lollipop-user-id"]: anotherFiscalCode
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient
    })();
    expect(getAssertionMock).toBeCalled();
    expect(result).toEqual(
      E.left(
        expect.objectContaining({
          status: 500
        })
      )
    );
  });
});
