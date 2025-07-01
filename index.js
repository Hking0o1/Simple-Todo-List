const API_URL = "/fake-api/todos";
let currentPage = 1;
const itemsPerPage = 10;

if (!localStorage.getItem("todos")) {
  localStorage.setItem("todos", JSON.stringify([]));
}

async function fakeFetch(url, options = {}) {
  const method = options.method || "GET";
  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  const delay = ms => new Promise(res => setTimeout(res, ms));
  await delay(300); 
  
  const idMatch = url.match(/\/fake-api\/todos\/(.*)/);
  const id = idMatch ? idMatch[1] : null;

  switch (method) {
    case "GET":
      return {
        json: async () => todos
      };

    case "POST":
      const newTodo = {
        id: Date.now().toString(),
        ...JSON.parse(options.body),
      };
      todos.unshift(newTodo);
      localStorage.setItem("todos", JSON.stringify(todos));
      return { json: async () => newTodo };

    case "DELETE":
      const filtered = todos.filter(t => t.id !== id);
      localStorage.setItem("todos", JSON.stringify(filtered));
      return { json: async () => ({ success: true }) };

    case "PUT":
      const updated = JSON.parse(options.body);
      const updatedTodos = todos.map(t => (t.id === id ? { ...t, ...updated } : t));
      localStorage.setItem("todos", JSON.stringify(updatedTodos));
      return { json: async () => updatedTodos.find(t => t.id === id) };

    default:
      throw new Error("Method not supported");
  }
}


const todoList = document.getElementById("todoList");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");

function filterTodos(allTodos) {
  const searchText = searchInput.value.toLowerCase();
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;

  return allTodos.filter(todo => {
    const task = todo.todo.toLowerCase();
    const created = new Date(todo.createdAt);
    return (
      task.includes(searchText) &&
      (!from || created >= from) &&
      (!to || created <= to)
    );
  });
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


async function renderTodos() {
  const res = await fakeFetch(API_URL);
  const allTodos = await res.json();
  const filtered = filterTodos(allTodos);
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  todoList.innerHTML = "";
  if (paginated.length === 0) {
    todoList.innerHTML = `<li class="list-group-item text-muted">No todos found.</li>`;
    return;
  }

  paginated.forEach(todo => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <div>
        <input type="checkbox" class="form-check-input me-2" ${todo.completed ? "checked" : ""} data-id="${todo.id}" />
        <span class="${todo.completed ? "text-decoration-line-through text-muted" : ""}">${todo.todo}</span>
      </div>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${todo.id}">Delete</button>
    `;

    li.querySelector("input").addEventListener("change", async (e) => {
      await fakeFetch(`${API_URL}/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: e.target.checked })
      });
      renderTodos();
    });

    li.querySelector(".delete-btn").addEventListener("click", async () => {
      await fakeFetch(`${API_URL}/${todo.id}`, { method: "DELETE" });
      renderTodos();
    });

    todoList.appendChild(li);
  });

  renderPagination(filtered.length);
}


document.getElementById("todoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const todoInput = document.getElementById("todoInput");
  const newTodo = {
    todo: todoInput.value.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  if (!newTodo.todo) return;

  await fakeFetch(API_URL, {
    method: "POST",
    body: JSON.stringify(newTodo)
  });

  todoInput.value = "";
  renderTodos();
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


renderTodos();
