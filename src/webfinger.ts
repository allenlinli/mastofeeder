import * as Option from "fp-ts/lib/Option";
import * as t from "io-ts";
import { Parser, Response, Route, route } from "typera-express";
import { fetchUrlInfo } from "./fetch-url-info";

const webfingeQuery = t.type({
  resource: t.refinement(
    t.string,
    (s) => s.startsWith("acct:") && s.includes("@"),
    "acct"
  ),
});

type WebfingerResponse = {
  subject: string;
  aliases: string[];
  links: {
    rel: string;
    type: string;
    href: string;
  }[];
};

export const webfingerRoute: Route<
  Response.Ok<WebfingerResponse> | Response.BadRequest<string>
> = route
  .get("/.well-known/webfinger")
  .use(Parser.query(webfingeQuery))
  .handler(async (req) => {
    const account = req.query.resource.slice("acct:".length);
    const [username] = account.split("@");
    const urlInfo = await fetchUrlInfo(username);

    return Response.ok({
      subject: req.query.resource,
      aliases: [],
      links: Option.isSome(urlInfo)
        ? [
            {
              rel: "self",
              type: "application/activity+json",
              href: `https://${req.req.hostname}/${encodeURIComponent(
                username.toLowerCase() // Needs normalization because Mastodon normalizes to lowercase
              )}`,
            },
          ]
        : [],
    });
  });
