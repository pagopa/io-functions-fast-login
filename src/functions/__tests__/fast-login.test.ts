import { makeFastLoginHandler } from "../fast-login";
import * as H from "@pagopa/handler-kit";
import { httpHandlerInputMocks } from "../__mocks__/handlerMocks";
import * as E from "fp-ts/Either";
import { FnLollipopClient } from "../../utils/lollipop/dependency";
import {
  aSAMLResponse,
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
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          body: { saml_response: aSAMLResponse },
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
