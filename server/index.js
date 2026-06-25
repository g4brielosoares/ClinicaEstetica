import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCrudRouter } from "./routes/createCrudRouter.js";
import { JsonFileRepository } from "./repositories/JsonFileRepository.js";
import { createAppointmentService } from "./services/appointmentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "data", "db.json");

const app = express();
const port = process.env.PORT || 3333;

const repository = new JsonFileRepository(dataFile);
const appointmentService = createAppointmentService(repository);

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", persistence: "json-file" });
});

app.use("/api/clientes", createCrudRouter(repository, "clientes", {
  required: ["nome", "telefone"]
}));

app.use("/api/procedimentos", createCrudRouter(repository, "procedimentos", {
  required: ["nome", "duracao", "valor"]
}));

app.use("/api/profissionais", createCrudRouter(repository, "profissionais", {
  required: ["nome", "especialidade"]
}));

app.get("/api/agendamentos", async (req, res, next) => {
  try {
    res.json(await appointmentService.list());
  } catch (error) {
    next(error);
  }
});

app.post("/api/agendamentos", async (req, res, next) => {
  try {
    res.status(201).json(await appointmentService.create(req.body));
  } catch (error) {
    next(error);
  }
});

app.put("/api/agendamentos/:id", async (req, res, next) => {
  try {
    const updated = await appointmentService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/agendamentos/:id", async (req, res, next) => {
  try {
    const removed = await appointmentService.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/relatorio", async (req, res, next) => {
  try {
    const [clientes, procedimentos, agendamentos] = await Promise.all([
      repository.findAll("clientes"),
      repository.findAll("procedimentos"),
      repository.findAll("agendamentos")
    ]);

    const faturamentoPrevisto = agendamentos
      .filter((item) => ["confirmado", "concluido"].includes(item.status))
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    res.json({
      totalClientes: clientes.length,
      totalProcedimentos: procedimentos.length,
      totalAgendamentos: agendamentos.length,
      faturamentoPrevisto
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Erro interno no servidor."
  });
});

app.listen(port, () => {
  console.log(`API da Clínica Estética em http://localhost:${port}`);
});
