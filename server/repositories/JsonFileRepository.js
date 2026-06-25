import fs from "node:fs/promises";
import path from "node:path";
import { Repository } from "./Repository.js";

export class JsonFileRepository extends Repository {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async findAll(collectionName) {
    const data = await this.#read();
    return data[collectionName] || [];
  }

  async findById(collectionName, id) {
    const records = await this.findAll(collectionName);
    return records.find((record) => record.id === id) || null;
  }

  async create(collectionName, payload) {
    return this.#write((data) => {
      const now = new Date().toISOString();
      const record = {
        id: crypto.randomUUID(),
        ...payload,
        criadoEm: now,
        atualizadoEm: now
      };

      data[collectionName] = [...(data[collectionName] || []), record];
      return record;
    });
  }

  async update(collectionName, id, payload) {
    return this.#write((data) => {
      const records = data[collectionName] || [];
      const index = records.findIndex((record) => record.id === id);

      if (index === -1) {
        return null;
      }

      const updated = {
        ...records[index],
        ...payload,
        id,
        atualizadoEm: new Date().toISOString()
      };

      records[index] = updated;
      data[collectionName] = records;
      return updated;
    });
  }

  async remove(collectionName, id) {
    return this.#write((data) => {
      const records = data[collectionName] || [];
      const exists = records.some((record) => record.id === id);

      if (!exists) {
        return false;
      }

      data[collectionName] = records.filter((record) => record.id !== id);
      return true;
    });
  }

  async #read() {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const initialData = { clientes: [], procedimentos: [], agendamentos: [] };
      await fs.writeFile(this.filePath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
  }

  async #write(mutator) {
    const operation = this.writeQueue.then(async () => {
      const data = await this.#read();
      const result = mutator(data);
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
      return result;
    });

    this.writeQueue = operation.catch(() => {});
    return operation;
  }
}
