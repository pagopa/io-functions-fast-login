import { Client } from "../../generated/definitions/backend-internal/client";
import { RedisDependency } from "../redis/dependency";

export type SessionStateDependency = LogoutDependencies;
export type LockSessionDependency = LogoutDependencies;
export type UnlockSessionDependency = LogoutDependencies;

export type LogoutDependencies = {
  readonly backendInternalClient: Client<"token">;
};

export type GenerateNonceDependencies = RedisDependency;
