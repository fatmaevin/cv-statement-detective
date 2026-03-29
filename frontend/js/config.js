const config = {
  //mode: "development",
  mode: "production",
  api: {
    development: "http://localhost:8000",
    production: "https://api.hosting.codeyourfuture.io",
  },
  timer: {
    statementTimer: 150000,
    gamePollingInterval: 3000,
  },
};

export const appConfig={
    apiBaseUrl:config.api[config.mode],
    timer:config.timer,
};