/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1451495754")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\"\n"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1451495754")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\" && owner = @request.auth.id\n"
  }, collection)

  return app.save(collection)
})
