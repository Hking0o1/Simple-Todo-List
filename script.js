const apiUrl = "https://6863d21388359a373e9672a2.mockapi.io/api/v1/Todo";
let todos = [];
let currentPage = 1;
const itemsPerPage = 10;

const loadingEl = document.getElementById("loading");
const todoList = document.getElementById("todoList");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");

function showLoading(show) {
  loadingEl.style.display = show ? "block" : "none";
}

async function fetchTodos() {
  try {
    showLoading(true);
    const res = await fetch(apiUrl);
    const data = await res.json();
    todos = data.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt || Date.now())
    }));
    renderTodos();
  } catch (err) {
    alert("Failed to fetch todos");
  } finally {
    showLoading(false);
  }
}

function filterTodos() {
  const text = searchInput.value.toLowerCase();
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;

  return todos.filter(todo => {
    const created = new Date(todo.createdAt);
    return (
      todo.todo.toLowerCase().includes(text) &&
      (!from || created >= from) &&
      (!to || created <= to)
    );
  });
}

function renderTodos() {
  const filtered = filterTodos();
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  todoList.innerHTML = "";

  if (paginated.length === 0) {
    todoList.innerHTML = `<li class="list-group-item text-muted">No tasks found.</li>`;
    return;
  }

  paginated.forEach(todo => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <div>
        <input type="checkbox" class="form-check-input me-2" data-id="${todo.id}" ${todo.completed ? "checked" : ""}/>
        <span class="${todo.completed ? "text-decoration-line-through text-muted" : ""}">${todo.todo}</span>
      </div>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${todo.id}">Delete</button>
    `;

    // Checkbox toggle
    li.querySelector("input").addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const completed = e.target.checked;
      try {
        await fetch(`${apiUrl}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed })
        });
        const idx = todos.findIndex(t => t.id === id);
        todos[idx].completed = completed;
        renderTodos();
      } catch {
        alert("Update failed");
      }
    });

    // Delete button
    li.querySelector(".delete-btn").addEventListener("click", async () => {
      const id = li.querySelector(".delete-btn").dataset.id;
      try {
        await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        todos = todos.filter(t => t.id !== id);
        renderTodos();
      } catch {
        alert("Delete failed");
      }
    });

    todoList.appendChild(li);
  });

  renderPagination(filtered.length);
}

function renderPagination(total) {
  const pages = Math.ceil(total / itemsPerPage);
  pagination.innerHTML = "";

  for (let i = 1; i <= pages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", () => {
      currentPage = i;
      renderTodos();
    });
    pagination.appendChild(li);
  }
}

document.getElementById("todoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const input = document.getElementById("todoInput");
  const newTodo = input.value.trim();
  if (!newTodo) return;

  try {
    showLoading(true);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        todo: newTodo,
        completed: false,
        createdAt: new Date().toISOString()
      })
    });
    const created = await res.json();
    created.createdAt = new Date(created.createdAt);
    todos.unshift(created);
    input.value = "";
    renderTodos();
  } catch {
    alert("Failed to add todo");
  } finally {
    showLoading(false);
  }
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderTodos();
});
fromDate.addEventListener("change", () => {
  currentPage = 1;
  renderTodos();
});
toDate.addEventListener("change", () => {
  currentPage = 1;
  renderTodos();
});

fetchTodos();
