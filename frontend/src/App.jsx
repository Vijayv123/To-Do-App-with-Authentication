import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Eye,
  Pencil,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { apiRequest } from "./api";

const storedUser = localStorage.getItem("todo_user");
const labelOptions = [
  { value: "Work", name: "Work", color: "blue" },
  { value: "Personal", name: "Personal", color: "green" },
  { value: "Urgent", name: "Urgent", color: "rose" },
  { value: "Do Later", name: "Do Later", color: "amber" }
];

function getLabelByName(labelName) {
  return (
    labelOptions.find(
      (option) => option.name.toLowerCase() === String(labelName || "").toLowerCase()
    ) || labelOptions[0]
  );
}

function getTaskLabel(todo) {
  return (
    labelOptions.find(
      (option) => option.name.toLowerCase() === String(todo.labelName || "").toLowerCase()
    ) || {
      name: todo.labelName || "Work",
      color: todo.labelColor || "blue"
    }
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [todos, setTodos] = useState([]);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    labelColor: "blue",
    labelName: "Work"
  });
  const [editingTodo, setEditingTodo] = useState(null);
  const [viewingTodo, setViewingTodo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    labelColor: "blue",
    labelName: "Work"
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );
  const groupedTodos = useMemo(() => {
    const groups = labelOptions.map((label) => ({
      ...label,
      todos: []
    }));

    todos.forEach((todo) => {
      if (todo.completed) {
        return;
      }

      const taskLabel = getTaskLabel(todo);
      let group = groups.find((item) => item.name === taskLabel.name);

      if (!group) {
        group = {
          value: taskLabel.name,
          name: taskLabel.name,
          color: taskLabel.color,
          todos: []
        };
        groups.push(group);
      }

      group.todos.push(todo);
    });

    return groups
      .filter((group) => group.todos.length > 0)
      .map((group) => ({
        ...group,
        activeCount: group.todos.length
      }));
  }, [todos]);
  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.completed),
    [todos]
  );

  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  async function loadTodos() {
    try {
      const data = await apiRequest("/todos");
      setTodos(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      localStorage.setItem("todo_token", data.token);
      localStorage.setItem("todo_user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTodo(event) {
    event.preventDefault();
    const title = newTodo.title.trim();
    const description = newTodo.description.trim();

    if (!title) {
      return;
    }

    try {
      const todo = await apiRequest("/todos", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          labelName: newTodo.labelName
        })
      });
      setTodos((current) => [todo, ...current]);
      setNewTodo({
        title: "",
        description: "",
        labelColor: "blue",
        labelName: "Work"
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      const updatedTodo = await apiRequest(`/todos/${todo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed })
      });
      setTodos((current) =>
        current.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTodo(todoId) {
    try {
      await apiRequest(`/todos/${todoId}`, { method: "DELETE" });
      setTodos((current) => current.filter((todo) => todo._id !== todoId));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteViewedTodo() {
    if (!viewingTodo) {
      return;
    }

    const todoId = viewingTodo._id;
    closeViewModal();
    await deleteTodo(todoId);
  }

  function editViewedTodo() {
    if (!viewingTodo) {
      return;
    }

    const todo = viewingTodo;
    closeViewModal();
    openEditModal(todo);
  }

  async function restoreViewedTodo() {
    if (!viewingTodo) {
      return;
    }

    try {
      const updatedTodo = await apiRequest(`/todos/${viewingTodo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: false })
      });
      setTodos((current) =>
        current.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
      closeViewModal();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openEditModal(todo) {
    const selectedLabel = getLabelByName(todo.labelName);
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      description: todo.description || "",
      labelColor: selectedLabel.color,
      labelName: selectedLabel.name
    });
    setMessage("");
  }

  function closeEditModal() {
    setEditingTodo(null);
    setEditForm({
      title: "",
      description: "",
      labelColor: "blue",
      labelName: "Work"
    });
  }

  function closeViewModal() {
    setViewingTodo(null);
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    const title = editForm.title.trim();

    if (!title || !editingTodo) {
      return;
    }

    setEditSaving(true);
    setMessage("");

    try {
      const updatedTodo = await apiRequest(`/todos/${editingTodo._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: editForm.description.trim(),
          labelName: editForm.labelName
        })
      });
      setTodos((current) =>
        current.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
      closeEditModal();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setEditSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("todo_token");
    localStorage.removeItem("todo_user");
    setUser(null);
    setTodos([]);
    setMessage("");
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-visual" aria-label="Productivity preview">
          <div className="glass-note note-one">
            <CheckCircle2 size={22} />
            <span>Plan your day</span>
          </div>
          <div className="glass-note note-two">
            <Sparkles size={22} />
            <span>Focus beautifully</span>
          </div>
          <div className="hero-copy">
            <p>TaskFlow</p>
            <h1>Turn scattered tasks into a calm daily rhythm.</h1>
          </div>
        </section>

        <section className="auth-panel">
          <div className="brand-mark">
            <Check size={22} />
          </div>
          <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted">
            {authMode === "login"
              ? "Sign in to continue managing your tasks."
              : "Start organizing your tasks in a focused workspace."}
          </p>

          <div className="mode-switch">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Vijay Kumar"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </label>

            {message && <p className="form-message">{message}</p>}

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">My workspace</p>
            <h1>Hello, {user.name}</h1>
          </div>
          <button className="icon-text-button" onClick={logout} type="button">
            <LogOut size={18} />
            Logout
          </button>
        </header>

        <section className="stats-row">
          <div>
            <span>Total tasks</span>
            <strong>{todos.length}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{todos.length - completedCount}</strong>
          </div>
        </section>

        <form className="todo-composer" onSubmit={handleCreateTodo}>
          <div className="composer-fields">
            <input
              value={newTodo.title}
              onChange={(event) =>
                setNewTodo((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Add a new task..."
            />
            <textarea
              value={newTodo.description}
              onChange={(event) =>
                setNewTodo((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Add a short description..."
              rows={3}
            />
            <label className="label-select-field">
              Label
              <div className="label-select-wrap">
                <span className={`label-dot label-${newTodo.labelColor}`} />
                <select
                  value={newTodo.labelName}
                  onChange={(event) => {
                    const selectedLabel = getLabelByName(event.target.value);
                    setNewTodo((current) => ({
                      ...current,
                      labelColor: selectedLabel.color,
                      labelName: selectedLabel.name
                    }));
                  }}
                >
                  {labelOptions.map((label) => (
                    <option key={label.name} value={label.name}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <button className="add-button" type="submit" aria-label="Add task">
            <Plus size={20} />
          </button>
        </form>

        {message && <p className="form-message">{message}</p>}

        <section className="todo-list" aria-label="Todo list grouped by label">
          {todos.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} />
              <h2>No tasks yet</h2>
              <p>Add your first task and start shaping the day.</p>
            </div>
          ) : groupedTodos.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} />
              <h2>No active tasks</h2>
              <p>Active tasks will appear here by label.</p>
            </div>
          ) : (
            groupedTodos.map((group) => (
              <section className="label-group" key={group.name}>
                <header className="label-group-header">
                  <div>
                    <span className={`label-dot-static label-${group.color}`} />
                    <h2>{group.name}</h2>
                  </div>
                  <strong>{group.activeCount} active</strong>
                </header>

                <div className="label-group-items">
                  {group.todos.map((todo) => (
                    <article
                      className={`todo-item ${todo.completed ? "completed" : ""} label-border-${
                        getTaskLabel(todo).color
                      }`}
                      key={todo._id}
                    >
                      <button
                        className="check-button"
                        onClick={() => toggleTodo(todo)}
                        type="button"
                        aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <div className="todo-copy">
                        <div className="todo-title-row">
                          <span>{todo.title}</span>
                          <small className={`task-label label-bg-${getTaskLabel(todo).color}`}>
                            {getTaskLabel(todo).name}
                          </small>
                        </div>
                        {todo.description && <p>{todo.description}</p>}
                      </div>
                      <button
                        className="edit-button"
                        onClick={() => openEditModal(todo)}
                        type="button"
                        aria-label="Edit task"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteTodo(todo._id)}
                        type="button"
                        aria-label="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </section>

        {completedTodos.length > 0 && (
          <section className="completed-panel" aria-label="Completed tasks">
            <header className="completed-header">
              <div>
                <p className="eyebrow">Completed</p>
                <h2>Finished tasks</h2>
              </div>
              <strong>{completedTodos.length}</strong>
            </header>

            <div className="completed-list">
              {completedTodos.map((todo) => (
                <article
                  className={`completed-item label-border-${getTaskLabel(todo).color}`}
                  key={todo._id}
                >
                  <div className="completed-copy">
                    <div className="todo-title-row">
                      <span>{todo.title}</span>
                      <small className={`task-label label-bg-${getTaskLabel(todo).color}`}>
                        {getTaskLabel(todo).name}
                      </small>
                    </div>
                    {todo.description && <p>{todo.description}</p>}
                  </div>
                  <button
                    className="edit-button"
                    onClick={() => setViewingTodo(todo)}
                    type="button"
                    aria-label="View completed task"
                  >
                    <Eye size={18} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      {editingTodo && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeEditModal}>
          <section
            className="edit-modal"
            aria-modal="true"
            role="dialog"
            aria-labelledby="edit-task-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit task</p>
                <h2 id="edit-task-title">Update details</h2>
              </div>
              <button
                className="close-button"
                onClick={closeEditModal}
                type="button"
                aria-label="Close edit popup"
              >
                <X size={20} />
              </button>
            </div>

            <form className="edit-form" onSubmit={handleEditSubmit}>
              <label>
                Task name
                <input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  rows={4}
                />
              </label>

              <label className="label-select-field">
                Label
                <div className="label-select-wrap">
                  <span className={`label-dot label-${editForm.labelColor}`} />
                  <select
                    value={editForm.labelName}
                    onChange={(event) => {
                      const selectedLabel = getLabelByName(event.target.value);
                      setEditForm((current) => ({
                        ...current,
                        labelColor: selectedLabel.color,
                        labelName: selectedLabel.name
                      }));
                    }}
                  >
                    {labelOptions.map((label) => (
                      <option key={label.name} value={label.name}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="modal-actions">
                <button className="secondary-button" onClick={closeEditModal} type="button">
                  Cancel
                </button>
                <button className="primary-button" disabled={editSaving} type="submit">
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewingTodo && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeViewModal}>
          <section
            className="edit-modal"
            aria-modal="true"
            role="dialog"
            aria-labelledby="view-task-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Completed task</p>
                <h2 id="view-task-title">{viewingTodo.title}</h2>
              </div>
              <button
                className="close-button"
                onClick={closeViewModal}
                type="button"
                aria-label="Close completed task popup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="task-detail">
              <small className={`task-label label-bg-${getTaskLabel(viewingTodo).color}`}>
                {getTaskLabel(viewingTodo).name}
              </small>
              <p>
                {viewingTodo.description ||
                  "No description was added for this completed task."}
              </p>
            </div>

            <div className="modal-actions completed-actions">
              <button className="restore-button" onClick={restoreViewedTodo} type="button">
                Back to active
              </button>
              <button className="secondary-button" onClick={editViewedTodo} type="button">
                Edit
              </button>
              <button className="danger-button" onClick={deleteViewedTodo} type="button">
                Delete
              </button>
              <button className="primary-button" onClick={closeViewModal} type="button">
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
