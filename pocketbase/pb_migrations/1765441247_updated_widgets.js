/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation577145238",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "shared_with",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_202087211",
    "hidden": false,
    "id": "relation2794487168",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "linked_widget",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // remove field
  collection.fields.removeById("relation577145238")

  // remove field
  collection.fields.removeById("relation2794487168")

  return app.save(collection)
})
