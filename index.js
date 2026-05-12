import("./artifacts/api-server/dist/index.mjs").catch(e => {
  console.error("Failed to load API:", e);
  process.exit(1);
});
