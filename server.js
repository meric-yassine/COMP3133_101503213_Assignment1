// server.js
require("dotenv").config();

const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const connectDB = require("./config/db");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    const app = express();

    // ✅ If you have other REST routes later, you can keep json parsing on a different path
    // app.use("/api", express.json({ limit: "25mb" }));

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await apolloServer.start();

    // ✅ Let Apollo's body parser handle /graphql and increase limit here
    apolloServer.applyMiddleware({
      app,
      path: "/graphql",
      bodyParserConfig: { limit: "25mb" },
    });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}/graphql`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
}

startServer();