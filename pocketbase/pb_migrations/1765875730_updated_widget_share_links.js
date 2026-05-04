/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_n0uHXPOOeX` ON `widget_share_links` (`token`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
