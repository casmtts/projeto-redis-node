import { createClient } from "redis";
import { createApp } from "./app";

const port = Number(process.env.PORT || 3000);
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({ url: redisUrl }) as any;

redisClient.on("error", (err: Error) => {
  console.error("Redis error:", err.message);
});

const app = createApp({ redisClient });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
