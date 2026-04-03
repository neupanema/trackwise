const { defineConfig } = require("prisma/config");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

module.exports = defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import("@prisma/adapter-neon");
      return new PrismaNeon({
        connectionString: process.env.DATABASE_URL,
      });
    },
  },
});