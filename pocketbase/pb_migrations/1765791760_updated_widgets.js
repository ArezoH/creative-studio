/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "listRule": "",
    "updateRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // update collection data
  unmarshal({
    "listRule": "dashboard.owner = @request.auth.id",
    "updateRule": "dashboard.owner = @request.auth.id"
  }, collection)

  return app.save(collection)
})
