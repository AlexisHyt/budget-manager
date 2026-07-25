import "better-auth/types";

declare module "better-auth/types" {
  interface User {
    currency?: string;
  }
  interface Session {
    user: User & {
      currency?: string;
    };
  }
}
