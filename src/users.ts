import * as Option from "fp-ts/lib/Option";
import { Response, Route, route } from "typera-express";
import { PUBLIC_KEY } from "./env";
import { fetchUrlInfo } from "./fetch-url-info";
import { normalizeHostname, validateHostname } from "./url-parser";

type ActivityStreamUserResponse = {
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ];
  id: string;
  type: "Person";
  following?: string;
  followers?: string;
  inbox?: string;
  outbox?: string;
  preferredUsername: string;
  name?: string;
  summary?: string;
  url?: string;
  icon?: {
    type: "Image";
    mediaType: string;
    url: string;
  };
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
};

export const usersRoute: Route<
  | Response.Ok<ActivityStreamUserResponse>
  | Response.NotFound
  | Response.BadRequest<string>
> = route.get("/:hostname").handler(async (req) => {
  const rawHostname = (req.routeParams as any).hostname;
  const hostname = normalizeHostname(rawHostname);

  if (!validateHostname(hostname)) {
    return Response.badRequest("Invalid hostname");
  }

  const info = await fetchUrlInfo(hostname);
  if (Option.isNone(info)) return Response.notFound();

  const id = `https://${req.req.hostname}/${encodeURIComponent(hostname)}`;
  const response: ActivityStreamUserResponse = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    id,
    type: "Person",
    preferredUsername: hostname,
    name: info.value.name,
    inbox: `${id}/inbox`,
    summary: `This is a proxied RSS feed from ${info.value.rssUrl}`,
    icon: info.value.icon
      ? {
          type: "Image",
          mediaType: "image/png",
          url: info.value.icon,
        }
      : undefined,
    publicKey: {
      id: `${id}#main-key`,
      owner: id,
      publicKeyPem: PUBLIC_KEY,
    },
  };
  return Response.ok(response);
});
