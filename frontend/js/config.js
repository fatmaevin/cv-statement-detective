const config = {
  //mode: "development",
  mode: "production",
  api: {
    development: "http://localhost:8000",
    production: "https://api.hosting.codeyourfuture.io",
  },
  timer: {
    statementTimer: 15000,
    gamePollingInterval: 3000,
  },
  validation: {
    statement: {
      maxLength: 500,
      disallowedRegex: /[^a-zA-Z0-9\s.,!?'"():;\-+/#&]/g,
    },
    playerName: {
      minLength: 2,
      maxLength: 20,
      invalidCharRegex: /[^a-zA-Z0-9\s'-]/g,
    },
  },
};

export const appConfig={
    apiBaseUrl:config.api[config.mode],
    timer:config.timer,
    validation:config.validation
};