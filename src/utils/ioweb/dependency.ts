import { Client } from "../../generated/definitions/backend-internal/client";

export type LockSessionDependency = {
  readonly backendInternalClient: Client<"token">;
};

export type LogoutDependencies = {
  readonly backendInternalClient: Client<"token">;
};
