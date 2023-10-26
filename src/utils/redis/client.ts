import * as redis from "redis";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { RedisClientConfig } from "../../config";

export const createSimpleRedisClient = async (
  redisUrl: string,
  password?: string,
  port?: string,
  enableTls: boolean = true
): Promise<redis.RedisClientType> => {
  const DEFAULT_REDIS_PORT = enableTls ? "6380" : "6379";
  const prefixUrl = enableTls ? "rediss://" : "redis://";
  const completeRedisUrl = `${prefixUrl}${redisUrl}`;

  const redisPort: number = parseInt(port || DEFAULT_REDIS_PORT, 10);

  const redisClient = redis.createClient<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>
  >({
    legacyMode: false,
    password,
    socket: {
      checkServerIdentity: (_hostname, _cert) => undefined,
      keepAlive: 2000,
      reconnectStrategy: retries => Math.min(retries * 100, 3000),
      tls: enableTls
    },
    url: `${completeRedisUrl}:${redisPort}`
  });
  await redisClient.connect();
  return redisClient;
};

export const CreateRedisClientTask: (
  config: RedisClientConfig
) => TE.TaskEither<Error, redis.RedisClientType> = config =>
  pipe(
    TE.tryCatch(
      () =>
        createSimpleRedisClient(
          config.REDIS_URL,
          config.REDIS_PASSWORD,
          config.REDIS_PORT,
          config.REDIS_TLS_ENABLED
        ),
      () => new Error("Error Connecting redis cluster")
    ),
    TE.chain(REDIS_CLIENT => {
      REDIS_CLIENT.on("connect", () => {
        // eslint-disable-next-line no-console
        console.info("Client connected to redis...");
      });

      REDIS_CLIENT.on("ready", () => {
        // eslint-disable-next-line no-console
        console.info("Client connected to redis and ready to use...");
      });

      REDIS_CLIENT.on("reconnecting", () => {
        // eslint-disable-next-line no-console
        console.info("Client reconnecting...");
      });

      REDIS_CLIENT.on("error", err => {
        // eslint-disable-next-line no-console
        console.info(`Redis error: ${err}`);
      });

      REDIS_CLIENT.on("end", () => {
        // eslint-disable-next-line no-console
        console.info("Client disconnected from redis");
      });
      return TE.right(REDIS_CLIENT);
    })
  );
