import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X
} from "lucide-react";
import "./styles.css";

const api = {
  async list(resource) {
    const response = await fetch(`/api/${resource}`);
    return parseResponse(response);
  },
  async create(resource, payload) {
    const response = await fetch(`/api/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async update(resource, id, payload) {
    const response = await fetch(`/api/${resource}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async remove(resource, id) {
    const response = await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Não foi possível excluir o registro.");
  }
};

async function parseResponse(response) {
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Erro ao processar a solicitação.");
  }
  return data;
}

const emptyClient = {
  nome: "",
  telefone: "",
  email: "",
  dataNascimento: "",
  observacoes: ""
};

const emptyProcedure = {
  nome: "",
  categoria: "Facial",
  duracao: 60,
  valor: 0,
  descricao: ""
};

const emptyProfessional = {
  nome: "",
  especialidade: "",
  telefone: "",
  email: "",
  observacoes: ""
};

const emptyAppointment = {
  clienteId: "",
  procedimentoId: "",
  profissionalId: "",
  data: "",
  horario: "",
  status: "pendente",
  observacoes: ""
};

function App() {
  const [view, setView] = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [dashboardAppointment, setDashboardAppointment] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const [query, setQuery] = useState("");
  const [listFilters, setListFilters] = useState({
    clientes: { sortBy: "nome", order: "asc", date: "" },
    procedimentos: { sortBy: "nome", order: "asc", date: "" },
    profissionais: { sortBy: "nome", order: "asc", date: "" },
    agendamentos: { sortBy: "data", order: "asc", date: "" }
  });
  const [message, setMessage] = useState("");

  async function loadData() {
    const [clientsData, proceduresData, professionalsData, appointmentsData] = await Promise.all([
      api.list("clientes"),
      api.list("procedimentos"),
      api.list("profissionais"),
      api.list("agendamentos")
    ]);

    setClientes(clientsData);
    setProcedimentos(proceduresData);
    setProfissionais(professionalsData);
    setAgendamentos(appointmentsData);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  const report = useMemo(() => {
    const faturamento = agendamentos
      .filter((item) => ["confirmado", "concluido"].includes(item.status))
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    return {
      clientes: clientes.length,
      procedimentos: procedimentos.length,
      profissionais: profissionais.length,
      agendamentos: agendamentos.length,
      faturamento
    };
  }, [clientes, procedimentos, profissionais, agendamentos]);

  const filteredClients = applyListFilters(
    filterByQuery(clientes, query, ["nome", "telefone", "email"]),
    listFilters.clientes
  );
  const filteredProcedures = applyListFilters(
    filterByQuery(procedimentos, query, ["nome", "categoria"]),
    listFilters.procedimentos
  );
  const filteredProfessionals = applyListFilters(
    filterByQuery(profissionais, query, ["nome", "especialidade", "telefone", "email"]),
    listFilters.profissionais
  );
  const filteredAppointments = applyListFilters(
    filterByQuery(agendamentos, query, [
      "clienteNome",
      "procedimentoNome",
      "profissionalNome",
      "status"
    ]),
    listFilters.agendamentos
  );

  function updateListFilter(resource, patch) {
    setListFilters((current) => ({
      ...current,
      [resource]: {
        ...current[resource],
        ...patch
      }
    }));
  }

  async function handleSaveRecord(resource, payload, id) {
    try {
      if (id) {
        await api.update(resource, id, payload);
        setMessage("Registro atualizado com sucesso.");
      } else {
        await api.create(resource, payload);
        setMessage("Registro cadastrado com sucesso.");
      }

      setRecordModal(null);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRemove(resource, id) {
    try {
      await api.remove(resource, id);
      setMessage("Registro excluído com sucesso.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleUpdateAppointment(id, payload) {
    try {
      if (id) {
        await api.update("agendamentos", id, payload);
        setMessage("Agendamento atualizado com sucesso.");
      } else {
        await api.create("agendamentos", payload);
        setMessage("Agendamento cadastrado com sucesso.");
      }
      setDashboardAppointment(null);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openRecordModal(resource, item = null) {
    setRecordModal({ resource, item });
  }

  const activeListConfig = getListConfig(view);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Sparkles size={24} /></span>
          <div>
            <strong>Studio<br />Michele Oliveira</strong>
            <small>Gestão de atendimentos</small>
          </div>
        </div>

        <nav>
          <NavButton active={view === "dashboard"} icon={<LayoutDashboard />} onClick={() => setView("dashboard")}>Painel</NavButton>
          <NavButton active={view === "clientes"} icon={<Users />} onClick={() => setView("clientes")}>Clientes</NavButton>
          <NavButton active={view === "procedimentos"} icon={<ClipboardList />} onClick={() => setView("procedimentos")}>Procedimentos</NavButton>
          <NavButton active={view === "profissionais"} icon={<Sparkles />} onClick={() => setView("profissionais")}>Profissionais</NavButton>
          <NavButton active={view === "agendamentos"} icon={<CalendarDays />} onClick={() => setView("agendamentos")}>Agendamentos</NavButton>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{pageTitle(view)}</h1>
          </div>
          <div className="topbar-controls">
            {activeListConfig && (
              <ListFilters
                filter={listFilters[view]}
                sortOptions={activeListConfig.sortOptions}
                allowDate={activeListConfig.allowDate}
                onFilterChange={(patch) => updateListFilter(view, patch)}
              />
            )}
            <label className="search">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar registros" />
            </label>
          </div>
        </header>

        {message && <button className="toast" onClick={() => setMessage("")}>{message}</button>}

        {view === "dashboard" && (
          <Dashboard
            report={report}
            profissionais={profissionais}
            agendamentos={agendamentos}
            onEditAppointment={setDashboardAppointment}
            onCreateAppointment={(selectedDate) => setDashboardAppointment({
              ...emptyAppointment,
              data: selectedDate || getLocalDateInput(),
              horario: minutesToTime(new Date().getHours() * 60 + new Date().getMinutes())
            })}
            onQuickCreate={(resource) => openRecordModal(resource)}
          />
        )}

        {view === "clientes" && (
          <ListSection
            title="Clientes"
            onAdd={() => openRecordModal("clientes")}
            list={<ClientList items={filteredClients} onEdit={(item) => openRecordModal("clientes", item)} onRemove={(id) => handleRemove("clientes", id)} />}
          />
        )}

        {view === "procedimentos" && (
          <ListSection
            title="Procedimentos"
            onAdd={() => openRecordModal("procedimentos")}
            list={<ProcedureList items={filteredProcedures} onEdit={(item) => openRecordModal("procedimentos", item)} onRemove={(id) => handleRemove("procedimentos", id)} />}
          />
        )}

        {view === "profissionais" && (
          <ListSection
            title="Profissionais"
            onAdd={() => openRecordModal("profissionais")}
            list={<ProfessionalList items={filteredProfessionals} onEdit={(item) => openRecordModal("profissionais", item)} onRemove={(id) => handleRemove("profissionais", id)} />}
          />
        )}

        {view === "agendamentos" && (
          <ListSection
            title="Agendamentos"
            onAdd={() => setDashboardAppointment({ ...emptyAppointment, data: getLocalDateInput(), horario: minutesToTime(new Date().getHours() * 60 + new Date().getMinutes()) })}
            list={<AppointmentList items={filteredAppointments} onEdit={setDashboardAppointment} onRemove={(id) => handleRemove("agendamentos", id)} />}
          />
        )}

        {dashboardAppointment && (
          <AppointmentModal
            appointment={dashboardAppointment}
            clients={clientes}
            procedures={procedimentos}
            professionals={profissionais}
            onClose={() => setDashboardAppointment(null)}
            onSave={handleUpdateAppointment}
          />
        )}

        {recordModal && (
          <RecordModal
            resource={recordModal.resource}
            item={recordModal.item}
            onClose={() => setRecordModal(null)}
            onSave={handleSaveRecord}
          />
        )}
      </section>
    </main>
  );
}

function NavButton({ active, icon, children, onClick }) {
  return (
    <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}>
      {React.cloneElement(icon, { size: 19 })}
      <span>{children}</span>
    </button>
  );
}

function Dashboard({ report, profissionais, agendamentos, onEditAppointment, onCreateAppointment, onQuickCreate }) {
  const [timelineDate, setTimelineDate] = useState(getLocalDateInput());
  const dayAppointments = [...agendamentos]
    .filter((item) => item.data === timelineDate)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  return (
    <div className="dashboard">
      <div className="metrics">
        <Metric icon={<Users />} label="Clientes" value={report.clientes} onAdd={() => onQuickCreate("clientes")} />
        <Metric icon={<ClipboardList />} label="Procedimentos" value={report.procedimentos} onAdd={() => onQuickCreate("procedimentos")} />
        <Metric icon={<Sparkles />} label="Profissionais" value={report.profissionais} onAdd={() => onQuickCreate("profissionais")} />
        <Metric icon={<CalendarDays />} label="Agendamentos" value={report.agendamentos} onAdd={() => onCreateAppointment(timelineDate)} />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Agenda do dia</h2>
            <span>{timelineDate ? formatDate(timelineDate) : "Sem data selecionada"}</span>
          </div>
          <div className="day-controls">
            <button type="button" className="add-appointment-button" onClick={() => onCreateAppointment(timelineDate)}>
              <Plus size={16} />
              Novo agendamento
            </button>
            <button type="button" className="arrow-button" onClick={() => setTimelineDate(shiftDate(timelineDate, -1))} aria-label="Dia anterior">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => setTimelineDate(getLocalDateInput())}>Hoje</button>
            <button type="button" className="arrow-button" onClick={() => setTimelineDate(shiftDate(timelineDate, 1))} aria-label="Próximo dia">
              <ChevronRight size={16} />
            </button>
            <strong>{dayAppointments.length} atendimento{dayAppointments.length === 1 ? "" : "s"}</strong>
          </div>
        </div>
        <AgendaTimeline
          appointments={dayAppointments}
          professionals={profissionais}
          selectedDate={timelineDate}
          onEditAppointment={onEditAppointment}
        />
      </section>
    </div>
  );
}

function Metric({ icon, label, value, onAdd }) {
  return (
    <article className="metric">
      <span className="metric-icon">{React.cloneElement(icon, { size: 20 })}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <button type="button" className="metric-add" onClick={onAdd} aria-label={`Adicionar ${label}`}>
        <Plus size={16} />
      </button>
    </article>
  );
}

function AgendaTimeline({ appointments, professionals, selectedDate, onEditAppointment }) {
  const scrollRef = useRef(null);
  const startMinute = 0;
  const endMinute = 24 * 60;
  const totalMinutes = endMinute - startMinute;
  const pixelsPerMinute = 1.15;
  const timelineHeight = totalMinutes * pixelsPerMinute;
  const hours = Array.from({ length: 25 }, (_, index) => index * 60);
  const isToday = selectedDate === getLocalDateInput();
  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const visibleProfessionals = professionals.length > 0
    ? professionals
    : [{ id: "sem-profissional", nome: "Sem profissionais", especialidade: "Cadastre profissionais" }];

  const slots = appointments.map((item) => {
    const start = timeToMinutes(item.horario);
    const duration = Number(item.procedimentoDuracao || 60);
    return {
      ...item,
      start,
      end: start + duration,
      duration
    };
  });

  useEffect(() => {
    if (!scrollRef.current || !isToday) return;
    scrollRef.current.scrollTop = Math.max(0, nowMinute * pixelsPerMinute - 86);
  }, [isToday, nowMinute, pixelsPerMinute, selectedDate]);

  return (
    <div className="agenda-shell" ref={scrollRef}>
      <div
        className="agenda-board"
        style={{
          "--columns": visibleProfessionals.length,
          minWidth: `${Math.max(760, visibleProfessionals.length * 260 + 70)}px`
        }}
      >
        <div className="agenda-professional-header" />
        {visibleProfessionals.map((professional) => (
          <div className="agenda-professional-header" key={professional.id}>
            <strong>{professional.nome}</strong>
            <span>{professional.especialidade}</span>
          </div>
        ))}

        <div className="agenda-hours" style={{ height: `${timelineHeight}px` }}>
          {hours.map((minute) => (
            <span key={minute} style={{ top: `${minute * pixelsPerMinute}px` }}>{minutesToTime(minute)}</span>
          ))}
        </div>

        {visibleProfessionals.map((professional) => {
          const professionalSlots = slots.filter((item) =>
            item.profissionalId === professional.id || item.profissionalNome === professional.nome
          );

          return (
            <div className="agenda-lane" key={professional.id} style={{ height: `${timelineHeight}px` }}>
              {hours.map((minute) => (
                <span
                  className="agenda-line"
                  key={minute}
                  style={{ top: `${minute * pixelsPerMinute}px` }}
                />
              ))}
              {isToday && (
                <span className="current-time-line" style={{ top: `${nowMinute * pixelsPerMinute}px` }}>
                  <span>{minutesToTime(nowMinute)}</span>
                </span>
              )}
              {professionalSlots.map((item) => {
                const top = item.start * pixelsPerMinute;
                const height = item.duration * pixelsPerMinute;

                return (
                  <button
                    type="button"
                    className={`agenda-event ${item.status}`}
                    key={item.id}
                    onClick={() => onEditAppointment(item)}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div>
                      <strong>{item.clienteNome}</strong>
                      <span>{item.procedimentoNome}</span>
                    </div>
                    <div>
                      <b>{item.horario} - {minutesToTime(item.end)}</b>
                      <StatusBadge status={item.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentModal({ appointment, clients, procedures, professionals, onClose, onSave }) {
  const [form, setForm] = useState(pick(appointment, Object.keys(emptyAppointment)));

  useEffect(() => {
    setForm(pick(appointment, Object.keys(emptyAppointment)));
  }, [appointment]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2 id="appointment-modal-title">{appointment.id ? "Editar agendamento" : "Novo agendamento"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar modal">
            <X size={19} />
          </button>
        </header>

        <AppointmentForm
          value={form}
          clients={clients}
          procedures={procedures}
          professionals={professionals}
          onChange={setForm}
          onSubmit={() => onSave(appointment.id, form)}
          editing
        />
      </section>
    </div>
  );
}

function RecordModal({ resource, item, onClose, onSave }) {
  const config = {
    clientes: {
      createTitle: "Novo cliente",
      editTitle: "Editar cliente",
      initial: emptyClient,
      FormComponent: ClientForm
    },
    procedimentos: {
      createTitle: "Novo procedimento",
      editTitle: "Editar procedimento",
      initial: emptyProcedure,
      FormComponent: ProcedureForm
    },
    profissionais: {
      createTitle: "Novo profissional",
      editTitle: "Editar profissional",
      initial: emptyProfessional,
      FormComponent: ProfessionalForm
    }
  }[resource];
  const [form, setForm] = useState(item ? pick(item, Object.keys(config.initial)) : config.initial);
  const FormComponent = config.FormComponent;

  useEffect(() => {
    setForm(item ? pick(item, Object.keys(config.initial)) : config.initial);
  }, [item, resource]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2 id="record-modal-title">{item ? config.editTitle : config.createTitle}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar modal">
            <X size={19} />
          </button>
        </header>

        <FormComponent
          value={form}
          onChange={setForm}
          onSubmit={() => onSave(resource, form, item?.id)}
          editing={Boolean(item)}
        />
      </section>
    </div>
  );
}

function ListFilters({ filter, sortOptions, allowDate, onFilterChange }) {
  return (
    <div className="compact-filters">
      <select aria-label="Ordenar por" value={filter.sortBy} onChange={(event) => onFilterChange({ sortBy: event.target.value })}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select aria-label="Ordem" value={filter.order} onChange={(event) => onFilterChange({ order: event.target.value })}>
        <option value="asc">Cresc.</option>
        <option value="desc">Decr.</option>
      </select>
      {allowDate && (
        <input aria-label="Filtrar por data" type="date" value={filter.date} onChange={(event) => onFilterChange({ date: event.target.value })} />
      )}
    </div>
  );
}

function ListSection({ title, onAdd, list }) {
  return (
    <section className="panel list-panel">
      <div className="section-title-row">
        <h2>{title}</h2>
        <button type="button" className="section-add-button" onClick={onAdd} aria-label={`Adicionar ${title}`}>
          <Plus size={18} />
        </button>
      </div>
      {list}
    </section>
  );
}

function ClientForm({ value, onChange, onSubmit, editing }) {
  return (
    <Form onSubmit={onSubmit} editing={editing}>
      <TextField label="Nome" value={value.nome} onChange={(nome) => onChange({ ...value, nome })} required />
      <TextField label="Telefone" value={value.telefone} onChange={(telefone) => onChange({ ...value, telefone })} required />
      <TextField label="E-mail" type="email" value={value.email} onChange={(email) => onChange({ ...value, email })} />
      <TextField label="Nascimento" type="date" value={value.dataNascimento} onChange={(dataNascimento) => onChange({ ...value, dataNascimento })} />
      <TextArea label="Observações" value={value.observacoes} onChange={(observacoes) => onChange({ ...value, observacoes })} />
    </Form>
  );
}

function ProcedureForm({ value, onChange, onSubmit, editing }) {
  return (
    <Form onSubmit={onSubmit} editing={editing}>
      <TextField label="Nome" value={value.nome} onChange={(nome) => onChange({ ...value, nome })} required />
      <SelectField label="Categoria" value={value.categoria} onChange={(categoria) => onChange({ ...value, categoria })} options={["Facial", "Corporal", "Capilar", "Bem-estar"]} />
      <TextField label="Duração (min)" type="number" value={value.duracao} onChange={(duracao) => onChange({ ...value, duracao: Number(duracao) })} required />
      <TextField label="Valor" type="number" value={value.valor} onChange={(valor) => onChange({ ...value, valor: Number(valor) })} required />
      <TextArea label="Descrição" value={value.descricao} onChange={(descricao) => onChange({ ...value, descricao })} />
    </Form>
  );
}

function ProfessionalForm({ value, onChange, onSubmit, editing }) {
  return (
    <Form onSubmit={onSubmit} editing={editing}>
      <TextField label="Nome" value={value.nome} onChange={(nome) => onChange({ ...value, nome })} required />
      <TextField label="Especialidade" value={value.especialidade} onChange={(especialidade) => onChange({ ...value, especialidade })} required />
      <TextField label="Telefone" value={value.telefone} onChange={(telefone) => onChange({ ...value, telefone })} />
      <TextField label="E-mail" type="email" value={value.email} onChange={(email) => onChange({ ...value, email })} />
      <TextArea label="Observações" value={value.observacoes} onChange={(observacoes) => onChange({ ...value, observacoes })} />
    </Form>
  );
}

function AppointmentForm({ value, clients, procedures, professionals, onChange, onSubmit, editing }) {
  return (
    <Form onSubmit={onSubmit} editing={editing}>
      <SelectField label="Cliente" value={value.clienteId} onChange={(clienteId) => onChange({ ...value, clienteId })} options={clients.map((item) => ({ label: item.nome, value: item.id }))} placeholder="Selecione" />
      <SelectField label="Procedimento" value={value.procedimentoId} onChange={(procedimentoId) => onChange({ ...value, procedimentoId })} options={procedures.map((item) => ({ label: item.nome, value: item.id }))} placeholder="Selecione" />
      <SelectField label="Profissional" value={value.profissionalId} onChange={(profissionalId) => onChange({ ...value, profissionalId })} options={professionals.map((item) => ({ label: item.nome, value: item.id }))} placeholder="Selecione" />
      <TextField label="Data" type="date" value={value.data} onChange={(data) => onChange({ ...value, data })} required />
      <TextField label="Horário" type="time" value={value.horario} onChange={(horario) => onChange({ ...value, horario })} required />
      <SelectField label="Status" value={value.status} onChange={(status) => onChange({ ...value, status })} options={["pendente", "confirmado", "concluido", "cancelado"]} />
      <TextArea label="Observações" value={value.observacoes} onChange={(observacoes) => onChange({ ...value, observacoes })} />
    </Form>
  );
}

function Form({ children, onSubmit, editing }) {
  return (
    <form className="form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {children}
      <button className="primary-button" type="submit">
        {editing ? <Save size={18} /> : <Plus size={18} />}
        {editing ? "Salvar alterações" : "Cadastrar"}
      </button>
    </form>
  );
}

function TextField({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field full">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="3" />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option;
          return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
    </label>
  );
}

function ClientList({ items, onEdit, onRemove }) {
  return (
    <RecordList
      items={items}
      render={(item) => (
        <>
          <strong>{item.nome}</strong>
          <span>{item.telefone}</span>
          <span>{item.email || "Sem e-mail"}</span>
        </>
      )}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
}

function ProcedureList({ items, onEdit, onRemove }) {
  return (
    <RecordList
      items={items}
      render={(item) => (
        <>
          <strong>{item.nome}</strong>
          <span>{item.categoria} · {item.duracao} min</span>
          <span>{formatMoney(item.valor)}</span>
        </>
      )}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
}

function ProfessionalList({ items, onEdit, onRemove }) {
  return (
    <RecordList
      items={items}
      render={(item) => (
        <>
          <strong>{item.nome}</strong>
          <span>{item.especialidade}</span>
          <span>{item.telefone || "Sem telefone"}</span>
        </>
      )}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
}

function AppointmentList({ items, onEdit, onRemove }) {
  return (
    <RecordList
      items={items}
      render={(item) => (
        <>
          <strong>{item.clienteNome}</strong>
          <span>{item.procedimentoNome} · {formatDate(item.data)} às {item.horario}</span>
          <span>{item.profissionalNome}</span>
          <StatusBadge status={item.status} />
        </>
      )}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );
}

function RecordList({ items, render, onEdit, onRemove }) {
  if (items.length === 0) {
    return <p className="empty">Nenhum registro encontrado.</p>;
  }

  return (
    <div className="records">
      {items.map((item) => (
        <article className="record" key={item.id}>
          <div>{render(item)}</div>
          <div className="record-actions">
            <button type="button" onClick={() => onEdit(item)}>Editar</button>
            <button type="button" className="danger" onClick={() => onRemove(item.id)} aria-label="Excluir">
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status ${status}`}>{status}</span>;
}

function filterByQuery(items, query, keys) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) =>
    keys.some((key) => String(item[key] || "").toLowerCase().includes(normalizedQuery))
  );
}

function applyListFilters(items, filter) {
  const filteredByDate = filter.date
    ? items.filter((item) => item.data === filter.date)
    : items;

  return [...filteredByDate].sort((a, b) => {
    const direction = filter.order === "desc" ? -1 : 1;
    const left = a[filter.sortBy] ?? "";
    const right = b[filter.sortBy] ?? "";

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }

    return String(left).localeCompare(String(right), "pt-BR", {
      numeric: true,
      sensitivity: "base"
    }) * direction;
  });
}

function getListConfig(view) {
  const configs = {
    clientes: {
      sortOptions: [
        { label: "Nome", value: "nome" },
        { label: "Telefone", value: "telefone" },
        { label: "E-mail", value: "email" }
      ]
    },
    procedimentos: {
      sortOptions: [
        { label: "Nome", value: "nome" },
        { label: "Categoria", value: "categoria" },
        { label: "Duração", value: "duracao" },
        { label: "Valor", value: "valor" }
      ]
    },
    profissionais: {
      sortOptions: [
        { label: "Nome", value: "nome" },
        { label: "Especialidade", value: "especialidade" },
        { label: "Telefone", value: "telefone" }
      ]
    },
    agendamentos: {
      allowDate: true,
      sortOptions: [
        { label: "Data", value: "data" },
        { label: "Horário", value: "horario" },
        { label: "Cliente", value: "clienteNome" },
        { label: "Procedimento", value: "procedimentoNome" },
        { label: "Profissional", value: "profissionalNome" },
        { label: "Status", value: "status" }
      ]
    }
  };

  return configs[view] || null;
}

function pick(item, keys) {
  return keys.reduce((result, key) => ({ ...result, [key]: item[key] || "" }), {});
}

function pageTitle(view) {
  const titles = {
    dashboard: "Painel de controle",
    clientes: "Cadastro de clientes",
    procedimentos: "Procedimentos estéticos",
    profissionais: "Equipe profissional",
    agendamentos: "Agenda da clínica"
  };
  return titles[view];
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getLocalDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return getLocalDateInput(date);
}

createRoot(document.getElementById("root")).render(<App />);
