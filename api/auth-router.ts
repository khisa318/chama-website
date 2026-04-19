import { createRouter, authedQuery, publicQuery } from "./middleware";

export const authRouter = createRouter({
  me: publicQuery.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),
  logout: authedQuery.mutation(async () => {
    return { success: true };
  }),
});
