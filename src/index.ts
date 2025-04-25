import bodyParser from "body-parser";
import express from "express";
import { PORT } from "./env";
import { fetchAndSendAllFeeds } from "./fetch-and-send-all-feeds";
import { forever } from "./forever";
import { routes } from "./routes";

const app = express();

app.use(bodyParser.json({ type: "application/activity+json" }));

app.get("/", (req, res) => {
  res.redirect("https://github.com/jehna/mastofeeder");
});

app.use(routes);

app.use("*", (req, res) => {
  console.log(req.baseUrl);
  console.dir(req.body, { depth: null });
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  forever(60 * 1000, fetchAndSendAllFeeds);
});
