const config = {
  //mode: "development",
  mode: "production",
  api: {
    development: "http://localhost:8000",
    production: "https://api.hosting.codeyourfuture.io",
  },
  timer: {
    statementTimer: 120000,//2 minutes
    gamePollingInterval: 3000,
  },
  validation: {
    statement: {
      minLength: 10,
      maxLength: 500,
      disallowedRegex: /[^a-zA-Z0-9\s.,!?'"():;\-+\–/]/g,
    },
    playerName: {
      minLength: 2,
      maxLength: 20,
      invalidCharRegex: /[^a-zA-Z0-9\s'-]/,
    },
  },
};

export const appConfig={
    apiBaseUrl:config.api[config.mode],
    timer:config.timer,
    validation:config.validation
};