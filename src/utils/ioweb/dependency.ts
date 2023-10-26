import * as redis from "redis";
import * as TE from "fp-ts/TaskEither";
import { Client } from "../../generated/definitions/backend-internal/client";

export type SessionStateDependency = LogoutDependencies;
export type LockSessionDependency = LogoutDependencies;
export type UnlockSessionDependency = LogoutDependencies;

export type LogoutDependencies = {
  readonly backendInternalClient: Client<"token">;
};

export type GenerateNonceDependencies = {
  readonly redisClientTask: TE.TaskEither<Error, redis.RedisClientType>;
};
