import bodyParser from "body-parser";
import express from "express";
import { PORT } from "./env";
import { fetchAndSendAllFeeds } from "./fetch-and-send-all-feeds";
import { forever } from "./forever";
import { routes } from "./routes";
import { validateHostname } from "./url-parser";

const app = express();

// Parse ActivityPub JSON
app.use(bodyParser.json({ type: "application/activity+json" }));

// Handle ActivityPub routes
app.use(routes);

// Handle @ mentions format
app.get("/@:hostname", (req, res, next) => {
  const hostname = req.params.hostname;
  if (hostname && validateHostname(hostname)) {
    // Forward to the hostname route
    req.url = `/${hostname}`;
    next("route");
  } else {
    next();
  }
});

// GitHub redirect only for exact root path
app.get("/", (req, res) => {
  if (req.path === "/") {
    res.redirect(302, "https://github.com/jehna/mastofeeder");
  } else {
    res.status(404).send("Not found");
  }
});

// Handle 404s
app.use((req, res) => {
  console.log("Not found:", req.method, req.url);
  console.dir(req.body, { depth: null });
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  forever(60 * 1000, fetchAndSendAllFeeds);
});
