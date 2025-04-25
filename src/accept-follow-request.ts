import * as Option from "fp-ts/lib/Option";
import * as t from "io-ts";
import SQL from "sql-template-strings";
import { Parser, Response, Route, route } from "typera-express";
import { v4 as uuid } from "uuid";
import { ActivityPubMessage } from "./ActivityPubMessage";
import { openDb } from "./db";
import { serverHostname } from "./env";
import { fetchUrlInfo } from "./fetch-url-info";
import { send } from "./send";
import { validateHostname } from "./url-parser";

const activityStreamsContext = t.union([
  t.literal("https://www.w3.org/ns/activitystreams"),
  t.UnknownArray,
]);

const followRequest = t.type({
  "@context": activityStreamsContext,
  id: t.string,
  type: t.literal("Follow"),
  actor: t.string, // Follower
  object: t.string, // To be followed
});
type FollowRequest = t.TypeOf<typeof followRequest>;

const unfollowRequest = t.type({
  "@context": activityStreamsContext,
  id: t.string,
  type: t.literal("Undo"),
  actor: t.string, // Follower
  object: t.type({
    // TODO: Should be inherited from FollowRequest
    id: t.string,
    type: t.literal("Follow"),
    actor: t.string, // Follower
    object: t.string, // To be followed
  }),
});
type UnfollowRequest = t.TypeOf<typeof unfollowRequest>;

const followOrUnfollowRequest = t.union([followRequest, unfollowRequest]);

const acceptActivity = (
  followedHostname: string,
  activityToAccept: ActivityPubMessage<any, any>
) =>
  ({
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${serverHostname}/${uuid()}`,
    type: "Accept",
    actor: `https://${serverHostname}/${encodeURIComponent(followedHostname)}`,
    object: activityToAccept,
  } as const);

export const followUnfollowRoute: Route<
  Response.Ok | Response.BadRequest<string>
> = route
  .post("/:hostname/inbox")
  .use(Parser.body(followOrUnfollowRequest))
  .handler(async (req) => {
    const hostname = req.routeParams.hostname;

    if (!validateHostname(hostname)) {
      return Response.badRequest("Invalid hostname");
    }

    if (req.body.type === "Follow")
      return handleFollowRequest(req.body, hostname);
    if (req.body.type === "Undo")
      return handleUnfollowRequest(req.body, hostname);

    throw new Error("Unreachable");
  });

const handleFollowRequest = async (
  body: FollowRequest,
  followHostname: string
) => {
  const { actor: follower, object } = body;

  const id = `https://${serverHostname}/${encodeURIComponent(followHostname)}`;
  if (object !== id)
    return Response.badRequest("Object does not match username");

  const info = await fetchUrlInfo(followHostname);
  if (Option.isNone(info))
    return Response.badRequest("Domain does not have a feed");

  try {
    await acceptFollowRequest(followHostname, follower);
    await informFollower(followHostname, follower, body);
    return Response.ok();
  } catch (e) {
    console.error(e);
    return Response.badRequest("Error following domain");
  }
};

const handleUnfollowRequest = async (
  body: UnfollowRequest,
  followHostname: string
) => {
  const { object: originalBody } = body;
  const { actor: follower, object } = originalBody;

  const id = `https://${serverHostname}/${encodeURIComponent(followHostname)}`;
  if (object !== id)
    return Response.badRequest("Object does not match username");

  try {
    await acceptUnfollowRequest(followHostname, follower);
    return Response.ok();
  } catch (e) {
    console.error(e);
    return Response.badRequest("Error unfollowing domain");
  }
};

const acceptFollowRequest = async (hostname: string, follower: string) => {
  const db = await openDb();
  await db.run(
    SQL`INSERT INTO followers (hostname, follower) VALUES (${hostname}, ${follower})`
  );
};

const acceptUnfollowRequest = async (hostname: string, follower: string) => {
  const db = await openDb();
  await db.run(
    SQL`DELETE FROM followers WHERE hostname = ${hostname} AND follower = ${follower}`
  );
};

const informFollower = async (
  followedHostname: string,
  follower: string,
  request: FollowRequest
) => {
  const message = acceptActivity(followedHostname, request);
  await send(message, follower);
};
