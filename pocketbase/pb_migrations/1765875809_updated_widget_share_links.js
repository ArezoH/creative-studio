/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_n0uHXPOOeX` ON `widget_share_links` (`token`)",
      "CREATE UNIQUE INDEX `idx_7sDjdDJFFM` ON `widget_share_links` (`expiresAt`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_n0uHXPOOeX` ON `widget_share_links` (`token`)"
    ]
  }, collection)

  return app.save(collection)
})
