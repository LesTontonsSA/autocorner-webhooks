require("dotenv").config();
const { callGatsbyBuildHook } = require("./handleBuildWebhook");

const port = process.env.PORT || 3000;
const host = "RENDER" in process.env ? `0.0.0.0` : `localhost`;

const fastify = require("fastify")({
  logger: true,
});

fastify.get("/health", function (request, reply) {
  reply.send({ status: "ok" });
});

fastify.get("/healthz", function (request, reply) {
  reply.send({ status: "ok" });
});

fastify.post("/preview-hook", function (request, reply) {
  callGatsbyBuildHook(
    request,
    reply,
    "https://webhook.gatsbyjs.com/hooks/data_source/",
    true
  );
});

fastify.post("/build-hook", function (request, reply) {
  callGatsbyBuildHook(
    request,
    reply,
    "https://webhook.gatsbyjs.com/hooks/data_source/publish/",
    false
  );
});

fastify.listen({ host: host, port: port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
