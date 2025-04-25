import { router } from "typera-express";
import { followUnfollowRoute } from "./accept-follow-request";
import { usersRoute } from "./users";
import { webfingerRoute } from "./webfinger";

export const routes = router(
  webfingerRoute,
  usersRoute,
  followUnfollowRoute
).handler();
