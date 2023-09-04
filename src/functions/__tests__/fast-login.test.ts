import { makeFastLoginHandler } from "../fast-login";
import * as H from "@pagopa/handler-kit";
import { httpHandlerInputMocks } from "../__mocks__/handlerMocks";
import * as E from "fp-ts/Either";
import { FnLollipopClient } from "../../utils/lollipop/dependency";
import {
  aLollipopInvalidSignature,
  aSAMLResponse,
  anotherFiscalCode,
  validFastLoginAdditionalHeaders,
  validLollipopHeaders
} from "../__mocks__/lollipopMocks";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { BlobService } from "azure-storage";
import * as O from "fp-ts/Option";
import * as azureStorage from "@pagopa/io-functions-commons/dist/src/utils/azure_storage";
import { format } from "date-fns";

const getAssertionMock = jest.fn(async () =>
  E.right({
    status: 200,
    value: { response_xml: aSAMLResponse }
  })
);
const mockedFnLollipopClient = ({
  getAssertion: getAssertionMock
} as unknown) as FnLollipopClient;
const mockBlobService = ({} as unknown) as BlobService;
const mockUpsertBlobFromObject = jest
  .spyOn(azureStorage, "upsertBlobFromObject")
  .mockResolvedValue(
    E.right(
      O.some({
        created: true
      } as any)
    )
  );

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
        ...validLollipopHeaders,
        ...validFastLoginAdditionalHeaders
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(getAssertionMock).toBeCalled();
    expect(mockUpsertBlobFromObject).toBeCalled();
    expect(result).toEqual(
      E.right(
        expect.objectContaining({
          body: { saml_response: aSAMLResponse },
          statusCode: 200
        })
      )
    );
  });

  it(`GIVEN a LolliPoP request
      WHEN the user client IP is invalid
      THEN a Bad Request error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        ...validLollipopHeaders,
        ["x-pagopa-lv-client-ip"]: "Invalid Client IP value"
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(getAssertionMock).not.toBeCalled();
    expect(mockUpsertBlobFromObject).not.toBeCalled();
    expect(result).toEqual(
      E.left(
        expect.objectContaining({
          status: 400
        })
      )
    );
  });

  it(`GIVEN a LolliPoP request
      WHEN the user client IP is missing
      THEN a Bad Request error response is returned`, async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: validLollipopHeaders
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(getAssertionMock).not.toBeCalled();
    expect(mockUpsertBlobFromObject).not.toBeCalled();
    expect(result).toEqual(
      E.left(
        expect.objectContaining({
          status: 400
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
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(getAssertionMock).not.toBeCalled();
    expect(mockUpsertBlobFromObject).not.toBeCalled();
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
        ["x-pagopa-lollipop-assertion-ref"]: "anInvalidAssertionRef",
        ...validFastLoginAdditionalHeaders
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(E.isLeft(result)).toBeTruthy();
    expect(getAssertionMock).not.toBeCalled();
    expect(mockUpsertBlobFromObject).not.toBeCalled();
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
        ["signature"]: aLollipopInvalidSignature,
        ...validFastLoginAdditionalHeaders
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
    })();
    expect(E.isLeft(result)).toBeTruthy();
    expect(getAssertionMock).not.toBeCalled();
    expect(mockUpsertBlobFromObject).not.toBeCalled();
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
        ["x-pagopa-lollipop-user-id"]: anotherFiscalCode,
        ...validFastLoginAdditionalHeaders
      }
    };
    const result = await makeFastLoginHandler({
      ...httpHandlerInputMocks,
      input: req,
      fnLollipopClient: mockedFnLollipopClient,
      blobService: mockBlobService
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
  it.each`
    WHEN                                               | getAssertion                                                                                                            | expectedErrorMessage
    ${"the fn-lolliop return an OIDC claim"}           | ${() => Promise.resolve(E.right({ status: 200, value: { id_token: "OidcSignedJwt", claims_token: "OidcSignedJwt" } }))} | ${"OIDC Claims not supported yet."}
    ${"the fn-lolliop return an error"}                | ${() => Promise.resolve(E.right({ status: 500, value: "" }))}                                                           | ${"Error retrieving the SAML Assertion"}
    ${"the fn-lollipop return an unexpected response"} | ${() => Promise.resolve(NonEmptyString.decode(""))}                                                                     | ${"Unexpected response from fn-lollipop"}
    ${"the fn-lolliop client throw an error"}          | ${() => Promise.reject(new Error("anError"))}                                                                           | ${"Error calling the getAssertion endpoint"}
  `(
    `GIVEN a valid LolliPoP request
     WHEN $WHEN
     THEN an Internal Server Error response is returned`,
    async ({ getAssertion, expectedErrorMessage }) => {
      const req: H.HttpRequest = {
        ...H.request("https://api.test.it/"),
        headers: {
          ...validLollipopHeaders,
          ...validFastLoginAdditionalHeaders
        }
      };
      getAssertionMock.mockImplementationOnce(getAssertion);
      const result = await makeFastLoginHandler({
        ...httpHandlerInputMocks,
        input: req,
        fnLollipopClient: mockedFnLollipopClient,
        blobService: mockBlobService
      })();
      expect(getAssertionMock).toBeCalled();
      expect(mockUpsertBlobFromObject).not.toBeCalled();
      expect(result).toEqual(E.left(new H.HttpError(expectedErrorMessage)));
    }
  );

  it.each`
    WHEN                                      | upsertBlobFromObjectResult                    | expectedErrorMessage                                                 | resolve
    ${"the blob storage returns no result"}   | ${E.right(O.none)}                            | ${"The audit log was not saved"}                                     | ${true}
    ${"the blob wasn't created"}              | ${E.right(O.some({ created: false }))}        | ${"The audit log was not saved"}                                     | ${true}
    ${"the blob sorage returns an error"}     | ${E.left(new Error("Storage Error Message"))} | ${"An error occurred saving the audit log: [Storage Error Message]"} | ${true}
    ${"the blob sorage unexpectedly rejects"} | ${new Error("Unexpected error")}              | ${"Unexpected error: [Unexpected error]"}                            | ${false}
  `(
    `GIVEN a valid LolliPoP request
     WHEN $WHEN
     THEN an Internal Server Error response is returned`,
    async ({ upsertBlobFromObjectResult, expectedErrorMessage, resolve }) => {
      resolve
        ? mockUpsertBlobFromObject.mockResolvedValueOnce(
            upsertBlobFromObjectResult
          )
        : mockUpsertBlobFromObject.mockRejectedValueOnce(
            upsertBlobFromObjectResult
          );
      const req: H.HttpRequest = {
        ...H.request("https://api.test.it/"),
        headers: {
          ...validLollipopHeaders,
          ...validFastLoginAdditionalHeaders
        }
      };
      const result = await makeFastLoginHandler({
        ...httpHandlerInputMocks,
        input: req,
        fnLollipopClient: mockedFnLollipopClient,
        blobService: mockBlobService
      })();
      expect(getAssertionMock).toBeCalled();
      expect(mockUpsertBlobFromObject).toBeCalled();
      expect(result).toEqual(
        E.left(
          expect.objectContaining({
            message: expectedErrorMessage
          })
        )
      );
    }
  );
});
