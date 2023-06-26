# IO Functions Fast Login

This project implements the APIs to enable the functionalities for the Fast Login needed by the `io-backend` to refresh the session token using the Lollipop protocol. This function is called by the `io-backend` and require an access to the `io-functions-lollipop` to retrieve the SAML Response for the Lollipop verification fase as Lollipop Consumer.
The implementation is based on the Azure Functions v4 runtime.

## Architecture

The project is structured as follows:

```
io-functions-fast-login
|-- api
|-- docker
|-- Info
|   |-- function.json
|-- src
|   |-- functions
|   |-- generated
|   |-- middlewares
|   |-- utils
|   |   |-- cosmos
|   |   |-- lollipop
|   |-- config.ts
|   |-- main.ts
|-- package.json
|-- docker-compose.yaml
|-- host.json
```

- The `api` folder contains all the internal and external OpenAPI specification.
- The `Info` folder is the Azure function confiiguration containing only the `function.json` file.
- The `src` folder contain all the implementation of the function

### src Folder

The `src` folder contains the `main.ts` file that exports the implementation for all the functions defined in this repo. Any function link to this file selecting the specific implementation using the `entryPoint` prop:

function.json
```json
{
  "bindings": [
    {
      ...
    },
    {
      "type": "http",
      "direction": "out",
      "name": "$return"
    }
  ],
  "scriptFile": "../dist/main.js",
  "entryPoint": "Info"
}
```

## ENV variables

The following table contains the required ENV variables that the applicative require

| Variable name                   | Description                                  | type   |
|---------------------------------|----------------------------------------------|--------|
| APPINSIGHTS_INSTRUMENTATIONKEY  | The Application Insights instrumentation key | string |
| COSMOS_CONNECTION_STRING        | citizen-auth Cosmos Connection String        | string |
| COSMOS_DB_NAME                  | citizen-auth Cosmos DB name                  | string |
| LOLLIPOP_GET_ASSERTION_API_KEY  | API Key to authorize `getAssertion`          | string |
| LOLLIPOP_GET_ASSERTION_BASE_URL | API Url for `getAssertion` operation         | string |
| FETCH_TIMEOUT_MS                | (optional) Fetch Timeout for AbortableFetch  | number |
## Local Execution

To execute locally the function copy the configuration from the `env.example` file with:

```bash
cp env.enxample .env
```

Then you can start the docker compose to execute the function environment
```bash
docker compose up --build -d
```

## Integration test

not yet included

### Testing models

not yet included

