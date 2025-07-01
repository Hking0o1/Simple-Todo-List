const apiUrl = "https://6863d21388359a373e9672a2.mockapi.io/api/v1/:endpoint";
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
    const response = await fetch(apiUrl);
    const data = await response.json();
    todos = data.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    }));
    renderTodos();
  } catch (error) {
    alert("Error fetching todos");
  } finally {
    showLoading(false);
  }
}

function filterTodos() {
  const searchText = searchInput.value.toLowerCase();
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;

  return todos.filter(todo => {
    const task = todo.todo.toLowerCase();
    const matchesText = task.includes(searchText);
    const created = new Date(todo.createdAt);
    const matchesFrom = !from || created >= from;
    const matchesTo = !to || created <= to;
    return matchesText && matchesFrom && matchesTo;
  });
}

function renderTodos() {
  const filtered = filterTodos();
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  todoList.innerHTML = "";

  if (paginated.length === 0) {
    todoList.innerHTML = `<li class="list-group-item text-muted">No todos found.</li>`;
  } else {
    paginated.forEach(todo => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center";

      item.innerHTML = `
        <div>
          <input type="checkbox" class="form-check-input me-2" ${todo.completed ? "checked" : ""} data-id="${todo.id}"/>
          <span class="${todo.completed ? "text-decoration-line-through text-muted" : ""}">${todo.todo}</span>
        </div>
        <button class="btn btn-sm btn-danger delete-btn" data-id="${todo.id}">Delete</button>
      `;

      // Toggle completion
      item.querySelector("input").addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const completed = e.target.checked;
        try {
          await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed })
          });
          const index = todos.findIndex(t => t.id === id);
          todos[index].completed = completed;
          renderTodos();
        } catch {
          alert("Failed to update status");
        }
      });

      // Delete task
      item.querySelector(".delete-btn").addEventListener("click", async () => {
        const id = item.querySelector(".delete-btn").dataset.id;
        try {
          await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
          todos = todos.filter(t => t.id !== id);
          renderTodos();
        } catch {
          alert("Failed to delete task");
        }
      });

      todoList.appendChild(item);
    });
  }

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
  const newTodoText = document.getElementById("todoInput").value.trim();
  if (!newTodoText) return;

  try {
    showLoading(true);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        todo: newTodoText,
        completed: false,
        createdAt: new Date().toISOString()
      })
    });

    const newTodo = await response.json();
    newTodo.createdAt = new Date(newTodo.createdAt);
    todos.unshift(newTodo);
    document.getElementById("todoInput").value = "";
    renderTodos();
  } catch (error) {
    alert("Error adding todo");
  } finally {
    showLoading(false);
  }
});

// Filters
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
