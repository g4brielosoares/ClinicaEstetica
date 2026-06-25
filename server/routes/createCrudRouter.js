import { Router } from "express";

export function createCrudRouter(repository, collectionName, options = {}) {
  const router = Router();
  const required = options.required || [];

  router.get("/", async (req, res, next) => {
    try {
      res.json(await repository.findAll(collectionName));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      validateRequiredFields(req.body, required);
      const created = await repository.create(collectionName, req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      validateRequiredFields(req.body, required);
      const updated = await repository.update(collectionName, req.params.id, req.body);

      if (!updated) {
        return res.status(404).json({ message: "Registro não encontrado." });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const removed = await repository.remove(collectionName, req.params.id);

      if (!removed) {
        return res.status(404).json({ message: "Registro não encontrado." });
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function validateRequiredFields(payload, fields) {
  const missingFields = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missingFields.length > 0) {
    const error = new Error(`Campos obrigatórios: ${missingFields.join(", ")}.`);
    error.status = 400;
    throw error;
  }
}
