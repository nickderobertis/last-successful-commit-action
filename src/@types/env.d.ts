declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_REPOSITORY: string;
    }
  }
}

export {};
