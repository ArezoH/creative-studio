/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "updateRule": "dashboard.owner = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "updateRule": "dashboard.owner = @request.auth.id || shared_with.id ?= @request.auth.id"
  }, collection)

  return app.save(collection)
})
