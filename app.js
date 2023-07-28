require("dotenv").config();
const { callGatsbyBuildHook } = require("./handleBuildWebhook");

const gatsbyBuildHook =
  "https://webhook.gatsbyjs.com/hooks/data_source/publish/";

const port = process.env.PORT || 3000;
const host = "RENDER" in process.env ? `0.0.0.0` : `localhost`;

const fastify = require("fastify")({
  logger: true,
});

fastify.post("/preview-hook", function (request, reply) {
  callGatsbyBuildHook(request, reply, gatsbyBuildHook, true);
});

fastify.post("/build-hook", function (request, reply) {
  callGatsbyBuildHook(request, reply, gatsbyBuildHook, false);
});

fastify.listen({ host: host, port: port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
