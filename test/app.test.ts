import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, type RedisClientLike } from "../src/app";

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
}

function createRedisMock(): RedisClientLike & {
  connect: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  setEx: ReturnType<typeof vi.fn>;
  incr: ReturnType<typeof vi.fn>;
} {
  return {
    isOpen: false,
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue("PONG"),
    get: vi.fn(),
    setEx: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1)
  };
}

async function callRoute(
  app: ReturnType<typeof createApp>,
  method: "get" | "post",
  path: string
) {
  const layer = (app as any)._router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  const handler = layer.route.stack[0].handle;
  const req = { method: method.toUpperCase(), url: path } as any;
  const res = createMockResponse();

  await handler(req, res);
  return res;
}

describe("API Redis + Node.js", () => {
  let redisClient: ReturnType<typeof createRedisMock>;

  beforeEach(() => {
    redisClient = createRedisMock();
  });

  it("deve responder a rota raiz", async () => {
    const app = createApp({ redisClient });
    const response = await callRoute(app, "get", "/");

    expect(response.statusCode).toBe(200);
    expect((response.body as { message: string }).message).toBe(
      "Node.js + Redis demo"
    );
  });

  it("deve verificar a saúde do Redis", async () => {
    const app = createApp({ redisClient });
    const response = await callRoute(app, "get", "/health");

    expect(response.statusCode).toBe(200);
    expect((response.body as { status: string }).status).toBe("ok");
    expect((response.body as { redis: string }).redis).toBe("PONG");
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
  });

  it("deve retornar payload do cache quando existir", async () => {
    const cachedPayload = {
      title: "cached",
      generatedAt: "2026-01-01T00:00:00.000Z"
    };

    redisClient.get.mockResolvedValueOnce(JSON.stringify(cachedPayload));

    const app = createApp({ redisClient });
    const response = await callRoute(app, "get", "/cache/demo");

    expect(response.statusCode).toBe(200);
    expect((response.body as { source: string }).source).toBe("cache");
    expect((response.body as { data: typeof cachedPayload }).data).toEqual(
      cachedPayload
    );
  });

  it("deve gerar payload e salvar no Redis quando não existir cache", async () => {
    redisClient.get.mockResolvedValueOnce(null);

    const app = createApp({ redisClient });
    const response = await callRoute(app, "get", "/cache/demo");

    expect(response.statusCode).toBe(200);
    expect((response.body as { source: string }).source).toBe("origin");
    expect(redisClient.setEx).toHaveBeenCalledWith(
      "demo:payload",
      60,
      expect.any(String)
    );
  });

  it("deve incrementar o contador de visitas", async () => {
    redisClient.incr.mockResolvedValueOnce(7);

    const app = createApp({ redisClient });
    const response = await callRoute(app, "post", "/visits");

    expect(response.statusCode).toBe(200);
    expect((response.body as { visits: number }).visits).toBe(7);
  });
});
