/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // remove field
  collection.fields.removeById("relation1553268728")

  // remove field
  collection.fields.removeById("number2363233923")

  // remove field
  collection.fields.removeById("number4225443349")

  // remove field
  collection.fields.removeById("number2350531887")

  // remove field
  collection.fields.removeById("number4115522831")

  // remove field
  collection.fields.removeById("number1563041560")

  // remove field
  collection.fields.removeById("relation577145238")

  // remove field
  collection.fields.removeById("relation2794487168")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_202087211")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1451495754",
    "hidden": false,
    "id": "relation1553268728",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "dashboard",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number2363233923",
    "max": null,
    "min": null,
    "name": "x",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number4225443349",
    "max": null,
    "min": null,
    "name": "y",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2350531887",
    "max": null,
    "min": null,
    "name": "width",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number4115522831",
    "max": null,
    "min": null,
    "name": "height",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number1563041560",
    "max": null,
    "min": null,
    "name": "zindex",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

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
})
