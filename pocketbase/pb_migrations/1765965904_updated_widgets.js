/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" &&\ndashboard.owner = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && (\n  dashboard.owner = @request.auth.id ||\n  shared_with ?= @request.auth.id\n)"
  }, collection)

  return app.save(collection)
})
