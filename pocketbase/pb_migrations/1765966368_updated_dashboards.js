/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1451495754")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && owner = @request.auth.id\n",
    "deleteRule": "@request.auth.id != \"\" && owner = @request.auth.id\n",
    "listRule": "@request.auth.id != \"\" && owner = @request.auth.id\n",
    "updateRule": "@request.auth.id != \"\" && owner = @request.auth.id\n",
    "viewRule": "@request.auth.id != \"\" && owner = @request.auth.id\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1451495754")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = owner",
    "deleteRule": "@request.auth.id = owner",
    "listRule": "@request.auth.id = owner",
    "updateRule": "@request.auth.id = owner",
    "viewRule": "@request.auth.id = owner"
  }, collection)

  return app.save(collection)
})
