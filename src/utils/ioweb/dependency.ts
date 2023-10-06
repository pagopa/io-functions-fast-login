import { Client } from "../../generated/definitions/backend-internal/client";

export type LockSessionDependency = LogoutDependencies;

export type LogoutDependencies = {
  readonly backendInternalClient: Client<"token">;
};
