import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port: 3000 }).then(() => {
  console.log("Listening on :3000");
});
