import * as H from "@pagopa/handler-kit";

export const CustomHttpUnauthorizedError = class extends H.HttpError {
  status = 401 as const;
  title = "Unauthorized";
};

export const errorToHttpError = (error: Error): H.HttpError =>
  new H.HttpError(`Internal Server Error: ${error.message}`);
