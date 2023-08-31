/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import * as reporters from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";

// ----------------------------
// Global app configuration
// ----------------------------
const GetAssertionConfig = t.type(
  {
    LOLLIPOP_GET_ASSERTION_API_KEY: NonEmptyString,
    LOLLIPOP_GET_ASSERTION_BASE_URL: UrlFromString
  },
  "GetAssertionConfig"
);
type GetAssertionConfig = t.Type<typeof GetAssertionConfig>;

export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.intersection([
  t.interface({
    APPINSIGHTS_INSTRUMENTATIONKEY: NonEmptyString,

    COSMOS_CONNECTION_STRING: NonEmptyString,
    COSMOS_DB_NAME: NonEmptyString,

    FAST_LOGIN_AUDIT_CONNECTION_STRING: NonEmptyString,

    // Default is 10 sec timeout
    FETCH_TIMEOUT_MS: withDefault(t.string, "10000").pipe(NumberFromString),

    isProduction: t.boolean
  }),
  GetAssertionConfig
]);

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === "production"
};

const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors: ReadonlyArray<t.ValidationError>) => {
      throw new Error(
        `Invalid configuration: ${reporters.readableReportSimplified(errors)}`
      );
    })
  );
