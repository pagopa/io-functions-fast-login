import { Client } from "../../generated/definitions/backend-internal/client";

export type FnLockSessionClientDependency = {
  readonly backendInternalClient: Client<"token">;
};

export type LogoutDependencies = {
  readonly backendInternalClient: Client<"token">;
};
