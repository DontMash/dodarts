import { os } from "@orpc/server";

import { create } from "@dodarts/database";
import { env } from "@dodarts/shared";

const middleware = os.middleware(
  ({ next }) => {
    return next({
      context: {
        db: create(env.DATABASE_URL),
      },
    });
  },
);

export default middleware;
