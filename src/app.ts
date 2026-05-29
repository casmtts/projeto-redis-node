import express, { Request, Response } from "express";

export type RedisClientLike = {
  isOpen: boolean;
  connect: () => Promise<void>;
  ping: () => Promise<string>;
  get: (key: string) => Promise<string | null>;
  setEx: (key: string, ttlSeconds: number, value: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
};

type AppContext = {
  redisClient: RedisClientLike;
};

export function createApp({ redisClient }: AppContext) {
  const app = express();

  app.use(express.json());

  async function connectRedis() {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  }

  app.get("/", async (_req: Request, res: Response) => {
    res.json({
      message: "Node.js + Redis demo",
      endpoints: ["/health", "/cache/demo", "/visits"]
    });
  });

  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await connectRedis();
      const pong = await redisClient.ping();

      res.json({
        status: "ok",
        redis: pong,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        status: "error",
        message: "Falha ao conectar no Redis",
        details: message
      });
    }
  });

  app.get("/cache/demo", async (_req: Request, res: Response) => {
    try {
      await connectRedis();
      const cacheKey = "demo:payload";
      const cachedValue = await redisClient.get(cacheKey);

      if (cachedValue) {
        return res.json({
          source: "cache",
          data: JSON.parse(cachedValue)
        });
      }

      const payload = {
        title: "Redis cache example",
        generatedAt: new Date().toISOString(),
        benefit: "reduz chamadas repetidas e melhora a resposta"
      };

      await redisClient.setEx(cacheKey, 60, JSON.stringify(payload));

      res.json({
        source: "origin",
        data: payload,
        ttlSeconds: 60
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        status: "error",
        message: "Erro ao consultar cache",
        details: message
      });
    }
  });

  app.post("/visits", async (_req: Request, res: Response) => {
    try {
      await connectRedis();
      const visits = await redisClient.incr("demo:visits");

      res.json({
        message: "Contador incrementado com sucesso",
        visits
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        status: "error",
        message: "Erro ao incrementar contador",
        details: message
      });
    }
  });

  app.get("/visits", async (_req: Request, res: Response) => {
    try {
      await connectRedis();
      const visits = await redisClient.get("demo:visits");

      res.json({
        visits: Number(visits || 0)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        status: "error",
        message: "Erro ao consultar contador",
        details: message
      });
    }
  });

  return app;
}
