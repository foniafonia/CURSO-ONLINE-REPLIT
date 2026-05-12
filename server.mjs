import("./artifacts/api-server/dist/index.mjs").then(mod => {
  if (mod.default) {
    console.log("✓ API loaded");
  }
}).catch(err => {
  console.error("Failed to load API:", err.message);
});
