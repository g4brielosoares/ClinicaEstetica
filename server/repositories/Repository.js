export class Repository {
  findAll(collectionName) {
    throw new Error("findAll must be implemented.");
  }

  findById(collectionName, id) {
    throw new Error("findById must be implemented.");
  }

  create(collectionName, payload) {
    throw new Error("create must be implemented.");
  }

  update(collectionName, id, payload) {
    throw new Error("update must be implemented.");
  }

  remove(collectionName, id) {
    throw new Error("remove must be implemented.");
  }
}
