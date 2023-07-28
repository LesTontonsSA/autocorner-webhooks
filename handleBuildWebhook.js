require("dotenv").config();
const axios = require("axios");

const callGatsbyBuildHook = async (
  request,
  reply,
  gatsbyBuildHook,
  isPreview
) => {
  const PROJECT_IDS_ON_GATSBY_CLOUD = process.env.PROJECT_IDS_ON_GATSBY_CLOUD;

  if (!PROJECT_IDS_ON_GATSBY_CLOUD) {
    reply.code(500).send({
      error: "Missing `PROJECT_IDS_ON_GATSBY_CLOUD` environment variable",
    });
    return;
  }

  const {
    body: { _type: type },
  } = request;

  const projectIds = getProjectIds(type);

  console.log(
    `Build type = ${type}: build hook called for ${projectIds.length} projects`
  );

  // Get all the Sanity headers and add the user-agent header
  const headers = Object.keys(request.headers)
    .filter((key) => key.startsWith("sanity-"))
    .reduce((obj, key) => {
      obj[key] = request.headers[key];
      return obj;
    }, {});
  headers["user-agent"] = "Sanity.io webhook delivery";

  const body = isPreview ? request.body : {};
  const responses = await Promise.all(
    projectIds.map((id) =>
      axios.post(`${gatsbyBuildHook}${id}`, body, { headers })
    )
  );

  const errorLength = responses.filter((r) => r.status !== 200).length;

  if (errorLength > 0) {
    console.error(
      `Build type = ${type}: build hook failed for ${errorLength} projects`
    );
    return;
  }

  reply.send({
    message: "Build hooks called successfully",
  });
};

const getProjectIds = (type) => {
  const allProjects = JSON.parse(process.env.PROJECT_IDS_ON_GATSBY_CLOUD);
  const projectName = type ? getProjectName(type) : undefined;

  if (projectName) {
    return allProjects.filter((p) => p.name === projectName).map((p) => p.id);
  }

  return allProjects.map((p) => p.id);
};

/**
 * Get project name from type
 *
 * Example:
 *  - occasions_romanel_menu -> occasions_romanel
 *  - autocorner_contactForm -> autocorner
 *  - audi_lutry_car -> audi_lutry
 * @param type Type of the Sanity document
 */
const getProjectName = (type) => {
  const split = type.split("_");
  const project = split.slice(0, -1).join("_");
  return project;
};

module.exports.callGatsbyBuildHook = callGatsbyBuildHook;
