const VALID_STATUSES = ["pendente", "confirmado", "concluido", "cancelado"];

export function createAppointmentService(repository) {
  return {
    async list() {
      const [appointments, clients, procedures, professionals] = await Promise.all([
        repository.findAll("agendamentos"),
        repository.findAll("clientes"),
        repository.findAll("procedimentos"),
        repository.findAll("profissionais")
      ]);

      return appointments.map((appointment) => hydrateAppointment(appointment, clients, procedures, professionals));
    },

    async create(payload) {
      const normalized = await normalizeAppointment(repository, payload);
      return repository.create("agendamentos", normalized);
    },

    async update(id, payload) {
      const normalized = await normalizeAppointment(repository, payload);
      return repository.update("agendamentos", id, normalized);
    },

    async remove(id) {
      return repository.remove("agendamentos", id);
    }
  };
}

async function normalizeAppointment(repository, payload) {
  validate(payload);

  const procedure = await repository.findById("procedimentos", payload.procedimentoId);
  const client = await repository.findById("clientes", payload.clienteId);
  const professionals = await repository.findAll("profissionais");
  const professional = payload.profissionalId
    ? professionals.find((item) => item.id === payload.profissionalId)
    : professionals.find((item) => item.nome === payload.profissional);

  if (!client) {
    const error = new Error("Cliente informado não existe.");
    error.status = 400;
    throw error;
  }

  if (!procedure) {
    const error = new Error("Procedimento informado não existe.");
    error.status = 400;
    throw error;
  }

  if (!professional) {
    const error = new Error("Profissional informado não existe.");
    error.status = 400;
    throw error;
  }

  return {
    clienteId: payload.clienteId,
    procedimentoId: payload.procedimentoId,
    data: payload.data,
    horario: payload.horario,
    profissionalId: professional.id,
    profissional: professional.nome,
    status: payload.status || "pendente",
    valor: Number(procedure.valor || 0),
    observacoes: payload.observacoes || ""
  };
}

function validate(payload) {
  const required = ["clienteId", "procedimentoId", "data", "horario"];
  const missing = required.filter((field) => !payload[field]);
  if (!payload.profissionalId && !payload.profissional) {
    missing.push("profissionalId");
  }

  if (missing.length > 0) {
    const error = new Error(`Campos obrigatórios: ${missing.join(", ")}.`);
    error.status = 400;
    throw error;
  }

  if (payload.status && !VALID_STATUSES.includes(payload.status)) {
    const error = new Error("Status de agendamento inválido.");
    error.status = 400;
    throw error;
  }
}

function hydrateAppointment(appointment, clients, procedures, professionals) {
  const client = clients.find((item) => item.id === appointment.clienteId);
  const procedure = procedures.find((item) => item.id === appointment.procedimentoId);
  const professional = professionals.find((item) => item.id === appointment.profissionalId)
    || professionals.find((item) => item.nome === appointment.profissional);

  return {
    ...appointment,
    profissionalId: professional?.id || appointment.profissionalId || "",
    profissionalNome: professional?.nome || appointment.profissional || "Profissional removido",
    clienteNome: client?.nome || "Cliente removido",
    procedimentoNome: procedure?.nome || "Procedimento removido",
    procedimentoDuracao: Number(procedure?.duracao || 60)
  };
}
