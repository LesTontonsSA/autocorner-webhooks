require("dotenv").config();
const axios = require("axios");

const callBuildHook = async (
  request,
  reply,
  buildHook,
  isPreview,
  cloudProvider = "gatsby-cloud"
) => {
  const CP_PROJECT_IDS = cloudProvider === "netlify" ? process.env.PROJECT_IDS_ON_NETLIFY : process.env.PROJECT_IDS_ON_GATSBY_CLOUD;

  if (!CP_PROJECT_IDS) {
    reply.code(500).send({
      error: cloudProvider === "netlify" ?
          "Missing `PROJECT_IDS_ON_NETLIFY` environment variable"
          : "Missing `PROJECT_IDS_ON_GATSBY_CLOUD` environment variable",
    });
    return;
  }

  const {
    body: { _type: type },
  } = request;

  const projectIds = getProjectIds(type, CP_PROJECT_IDS);

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
      axios.post(`${buildHook}${id}`, body, { headers })
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

const getProjectIds = (type, provider_ids) => {
  const allProjects = JSON.parse(provider_ids);
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

module.exports.callyBuildHook = callBuildHook;
