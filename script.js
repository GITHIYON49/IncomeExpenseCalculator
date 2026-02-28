let entries = JSON.parse(localStorage.getItem("cashflow_v2") || "[]");
let editId = null;

const $ = (id) => document.getElementById(id);
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n) =>
  "₹" +
  Math.abs(parseFloat(n)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const getType = () =>
  document.querySelector('input[name="entry-type"]:checked').value;
const getFilter = () =>
  document.querySelector('input[name="filter"]:checked').value;
const save = () => localStorage.setItem("cashflow_v2", JSON.stringify(entries));

function showToast(msg, bg = "#111827") {
  const t = $("toast");
  $("toast-msg").textContent = msg;
  $("toast-inner").style.background = bg;
  t.classList.remove("opacity-0", "translate-y-2");
  t.classList.add("opacity-100", "translate-y-0");
  setTimeout(() => {
    t.classList.add("opacity-0", "translate-y-2");
    t.classList.remove("opacity-100", "translate-y-0");
  }, 2300);
}

function validate() {
  const desc = $("description").value.trim();
  const amt = parseFloat($("amount").value);
  const date = $("date").value;
  if (!desc) {
    showToast("Please enter a description", "#DC2626");
    return false;
  }
  if (!amt || amt <= 0) {
    showToast("Enter a valid amount", "#DC2626");
    return false;
  }
  if (!date) {
    showToast("Please select a date", "#DC2626");
    return false;
  }
  return true;
}

function addEntry() {
  if (!validate()) return;
  entries.unshift({
    id: uid(),
    type: getType(),
    description: $("description").value.trim(),
    amount: parseFloat($("amount").value),
    date: $("date").value,
  });
  save();
  resetForm();
  renderList();
  updateSummary();
  showToast("Entry added!", "#065F46");
}

function startEdit(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;
  editId = id;
  $("description").value = e.description;
  $("amount").value = e.amount;
  $("date").value = e.date;
  document.getElementById(
    e.type === "income" ? "t-income" : "t-expense",
  ).checked = true;
  $("add-btn").style.display = "none";
  $("update-btn").style.display = "block";
  $("form-title").textContent = "Edit Entry";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateEntry() {
  if (!validate()) return;
  const idx = entries.findIndex((x) => x.id === editId);
  if (idx === -1) return;
  entries[idx] = {
    ...entries[idx],
    type: getType(),
    description: $("description").value.trim(),
    amount: parseFloat($("amount").value),
    date: $("date").value,
  };
  editId = null;
  save();
  resetForm();
  renderList();
  updateSummary();
  showToast("Entry updated!", "#1D4ED8");
}

function deleteEntry(id) {
  entries = entries.filter((x) => x.id !== id);
  save();
  renderList();
  updateSummary();
  showToast("🗑 Entry deleted", "#B91C1C");
}

function resetForm() {
  $("description").value = "";
  $("amount").value = "";
  $("date").value = today();
  document.getElementById("t-income").checked = true;
  $("add-btn").style.display = "block";
  $("update-btn").style.display = "none";
  $("form-title").textContent = "Add Entry";
  editId = null;
}

function renderList() {
  const filter = getFilter();
  const data =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);
  const el = $("entries-list");

  if (!data.length) {
    el.innerHTML = `
          <div class="flex flex-col items-center justify-center py-16">
            <p class="text-sm text-gray-400 font-medium">No ${filter === "all" ? "" : filter + " "}entries found.</p>
          </div>`;
    return;
  }

  el.innerHTML = data
    .map(
      (e) => `
        <div class="group flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/80 transition-colors duration-100 animate-fadeSlideIn">

          <!-- TYPE DOT -->
          <div class="w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${e.type === "income" ? "bg-green-400" : "bg-red-400"}"></div>

          <!-- ICON BADGE -->
        

          <!-- INFO -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">${esc(e.description)}</p>
            <p class="text-xs text-gray-400 mt-0.5">${fmtDate(e.date)}</p>
          </div>

          <!-- AMOUNT -->
          <div class="font-mono font-bold text-sm flex-shrink-0 ${e.type === "income" ? "text-green-500" : "text-red-500"}">
            ${e.type === "income" ? "+" : "-"}${fmt(e.amount)}
          </div>

          <!-- ACTION BUTTONS (visible on hover) -->
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button onclick="startEdit('${e.id}')"
              class="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center text-xs transition active:scale-90" title="Edit"> <i data-lucide="square-pen"></i></button>
            <button onclick="deleteEntry('${e.id}')"
              class="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center text-xs transition active:scale-90" title="Delete"><i data-lucide="trash" class="size-5"></i></button>
          </div>
        </div>
      `,
    )
    .join("");
  lucide.createIcons();
}

function updateSummary() {
  const income = entries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = entries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const balance = income - expense;
  $("total-income").textContent = fmt(income);
  $("total-expense").textContent = fmt(expense);
  $("net-balance").textContent = (balance < 0 ? "-" : "") + fmt(balance);
}

$("date").value = today();
renderList();
updateSummary();
