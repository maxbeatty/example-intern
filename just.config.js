const dotenv = require("dotenv");
const { commandSync } = require("execa");
const { default: intern } = require("intern");
const {
  argv,
  condition,
  logger,
  option,
  task,
  tscTask,
  series
} = require("just-scripts");
const { exec } = require("just-scripts-utils");

const internConfig = require("./intern.json");

const { error } = dotenv.config();
if (error) {
  logger.error("dotenv.config returned error:", error);
}

/* helpers */

// https://github.com/microsoft/just/issues/158#issuecomment-524248698
function run(cmd) {
  logger.info(cmd);
  return exec(cmd, {
    stderr: process.stderr,
    stdout: process.stdout
  });
}

// execute shell commands
function execa(cmd) {
  const { stdout, stderr } = commandSync(cmd);
  if (stderr) {
    logger.error(stderr);
  }
  return stdout;
}

// translates `browser` CLI arg to what BrowserStack expects
function translateBrowser(browser) {
  switch (browser) {
    case "android":
      return "Android"; // yes, really
    case "ie":
      return "internet explorer";
    case "ios":
      return "iPhone";
    default:
      // 🆗 chrome, firefox, safari, edge
      return browser;
  }
}

// get BrowserStack mobile device name
function translateMobileDevice(platform, osVersion) {
  const v = parseInt(osVersion, 10);
  switch (platform) {
    case "Android":
      // Galaxy S models are named one ahead of OS...
      return "Galaxy S" + (v - 1);
    case "iPhone":
      switch (v) {
        case 13:
          return "iPhone 11";
        case 12:
          return "iPhone XS";
        default:
          return "iPhone X"; // 11
      }
    default:
      throw new Error("Unknown platform: " + platform);
  }
}

function buildBrowserStackCapabilities() {
  let branch = execa("git rev-parse --abbrev-ref HEAD");
  if (branch === "master") {
    branch = execa("git rev-parse --verify --short HEAD");
  }

  logger.info("Preparing BrowserStack build:", branch);

  return {
    "browserstack.console": "errors",
    "browserstack.debug": true,
    "browserstack.networkLogs": true,
    "browserstack.seleniumLogs": true,

    build: branch,
    project: "payapi/web-sdk"
  };
}

function buildEnvironments(browsers, browserVersion, browserstack) {
  const additionalConfig = browserstack ? buildBrowserStackCapabilities() : {};

  if (browserstack && browsers.length === 0) {
    logger.warn(
      "No browser specified for BrowserStack. Defaulting to Internet Explorer 10"
    );
    browsers.push("ie");
    browserVersion = "10";
  }

  if (browsers.length !== 1 && browserVersion) {
    logger.warn(
      `Browser version ${ignoreWarning} will only be applied to "${browsers[0]}" because multiple browsers specified`
    );
  }

  // always unit test first
  browsers.unshift("node");

  return browsers.map((browser, idx) => {
    const env = {
      browserName: translateBrowser(browser),
      ...additionalConfig
    };

    // see warning above
    if (idx === 1) {
      if (browserVersion) {
        // mobile?
        if (env.browserName === "Android" || env.browserName === "iPhone") {
          // eslint-disable-next-line @typescript-eslint/camelcase
          env.os_version = browserVersion;
          env.device = translateMobileDevice(env.browserName, browserVersion);
        } else {
          env.version = browserVersion;
        }
      }
    }

    return env;
  });
}

/* options */

option("browser", {
  alias: "b",
  array: true,
  choices: ["chrome", "firefox", "safari", "edge", "ie", "ios", "android"],
  default: [],
  description: "browser for intern to run tests against"
});

option("browser-version", {
  alias: "v",
  description: "version of browser to use on BrowserStack",
  type: "string"
});

option("browserstack", {
  alias: "s",
  default: false,
  description: "run tests on BrowserStack using local tunnel",
  type: "boolean"
});

option("show-config", {
  default: false,
  description: "Show Intern configuration and exit",
  type: "boolean"
});

option("skip-lint", {
  description: "Skip linting",
  type: "boolean"
});

/* tasks */

task("build:storybook", () =>
  run("build-storybook --output-dir build/storybook")
);

task(
  "deploy:storybook",
  series("build:storybook", () =>
    run("now --prod --name example-intern-stories build/storybook")
  )
);

task("deploy", () => run("now --prod --name example-intern public/"));

task("lint", () => run("eslint --ignore-path .gitignore '**/*.{ts,js}'"));

task("intern", () => {
  const { browser, browserVersion, browserstack, showConfig } = argv();

  internConfig.showConfig = showConfig;

  if (browserstack) {
    internConfig.tunnel = "browserstack";
  }

  internConfig.environments = buildEnvironments(
    browser,
    browserVersion,
    browserstack
  );

  intern.configure(internConfig);

  return intern.run();
});

task(
  "test",
  series(
    condition("lint", () => !argv()["skipLint"]),
    tscTask({ project: "tests" }),
    "intern"
  )
);
