import bodyParser from "body-parser";
import express from "express";
import { initializeDb } from "./db";
import { PORT } from "./env";
import { fetchAndSendAllFeeds } from "./fetch-and-send-all-feeds";
import { forever } from "./forever";
import { routes } from "./routes";
import { normalizeHostname } from "./url-parser";

const startServer = async () => {
  // Initialize database first
  await initializeDb();

  const app = express();

  app.use(bodyParser.json({ type: "application/activity+json" }));

  // Handle @website@mastofeeder.com format
  app.use((req, res, next) => {
    const path = req.path;
    if (path.startsWith("/@")) {
      // Extract the website part from @website@mastofeeder.com
      const match = path.match(/\/@([^@]+)@/);
      if (match) {
        const website = match[1];
        // Redirect to the normalized hostname path
        const normalizedPath = `/${normalizeHostname(website)}`;
        if (normalizedPath !== path) {
          return res.redirect(302, normalizedPath + req.url.slice(path.length));
        }
      }
    }
    next();
  });

  // Add routes
  app.use(routes);

  // Handle GitHub redirect for root
  app.get("/", (_req, res) => {
    res.redirect(302, "https://github.com/jehna/mastofeeder");
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
};

// Start the server and handle any errors
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
