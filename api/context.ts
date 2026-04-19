import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest, type AuthenticatedAppUser } from "./lib/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: AuthenticatedAppUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    const user = await authenticateRequest(opts.req.headers);
    if (user) {
      ctx.user = user;
      return ctx;
    }
  } catch {
    // unauthenticated request
  }

  return ctx;
}
