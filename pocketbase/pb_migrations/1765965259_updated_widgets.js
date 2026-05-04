/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\ndashboard.owner = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" &&\ndashboard.owner = @request.auth.id",
    "listRule": "@request.auth.id != \"\" && (\n  dashboard.owner = @request.auth.id ||\n  shared_with ?= @request.auth.id\n)",
    "updateRule": "@request.auth.id != \"\" && (\n  dashboard.owner = @request.auth.id ||\n  shared_with ?= @request.auth.id\n)",
    "viewRule": "@request.auth.id != \"\" && (\n  dashboard.owner = @request.auth.id ||\n  shared_with ?= @request.auth.id\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
