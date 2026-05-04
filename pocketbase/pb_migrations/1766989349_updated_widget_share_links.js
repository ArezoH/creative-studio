/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation488339042",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "FieldTypeRequiredfor_registered_user",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_215690131")

  // remove field
  collection.fields.removeById("relation488339042")

  return app.save(collection)
})
