(function () {
  var L = ExpenseLib, store = L.store;
  var $ = function (id) { return document.getElementById(id); };

  var tbody = $("expense-list"), search = $("search"), filter = $("filter-category");
  var modal = $("edit-modal"), editForm = $("edit-form");

  var SAMPLE = [
    { title: "Lunch at campus", amount: 450, category: "Food", date: "2026-11-02" },
    { title: "Bus pass", amount: 1200, category: "Transport", date: "2026-11-03" },
    { title: "Web Development book", amount: 2800, category: "Books", date: "2026-11-05" },
    { title: "Cinema", amount: 700, category: "Fun", date: "2026-11-08" },
    { title: "Monthly rent", amount: 25000, category: "Rent", date: "2026-11-01" }
  ];

  function render() {
    var all = store.getAll();
    var q = search.value.trim().toLowerCase();
    var cat = filter.value;

    var shown = all.filter(function (e) {
      return (!q || e.title.toLowerCase().indexOf(q) !== -1) && (!cat || e.category === cat);
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });

    tbody.innerHTML = shown.map(function (e) {
      return "<tr>" +
        "<td>" + L.escapeHTML(e.date) + "</td>" +
        "<td>" + L.escapeHTML(e.title) + "</td>" +
        "<td><span class=\"badge\">" + L.escapeHTML(e.category) + "</span></td>" +
        "<td class=\"num\">" + L.formatLek(e.amount) + "</td>" +
        "<td class=\"actions\">" +
          "<button class=\"btn btn-small\" data-action=\"edit\" data-id=\"" + e.id + "\">Edit</button> " +
          "<button class=\"btn btn-small btn-danger\" data-action=\"delete\" data-id=\"" + e.id + "\">Delete</button>" +
        "</td></tr>";
    }).join("");

    $("empty-message").style.display = shown.length ? "none" : "block";
    $("count").textContent = all.length ? "(" + shown.length + " of " + all.length + ")" : "";

    // Stats are based on all saved expenses
    var total = all.reduce(function (s, e) { return s + e.amount; }, 0);
    $("stat-total").textContent = L.formatLek(total);
    $("stat-count").textContent = all.length;
    $("stat-average").textContent = all.length ? L.formatLek(Math.round(total / all.length)) : "0 Lek";
    if (all.length) {
      var big = all.reduce(function (m, e) { return e.amount > m.amount ? e : m; });
      $("stat-biggest").textContent = big.title + " (" + L.formatLek(big.amount) + ")";
    } else {
      $("stat-biggest").textContent = "none";
    }
  }

  function openEdit(id) {
    var e = store.getAll().find(function (x) { return x.id === id; });
    if (!e) return;
    $("edit-id").value = e.id;
    $("edit-title").value = e.title;
    $("edit-amount").value = e.amount;
    $("edit-category").value = e.category;
    $("edit-date").value = e.date;
    L.showErrors(editForm, {});
    modal.classList.add("open");
    $("edit-title").focus();
  }
  function closeEdit() { modal.classList.remove("open"); }

  tbody.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    if (btn.getAttribute("data-action") === "edit") openEdit(id);
    else if (confirm("Delete this expense?")) {
      store.remove(id); render(); L.toast("Expense deleted.");
    }
  });

  editForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var data = {
      title: $("edit-title").value, amount: $("edit-amount").value,
      category: $("edit-category").value, date: $("edit-date").value
    };
    var r = L.validate(data);
    L.showErrors(editForm, r.errors);
    if (!r.valid) return;
    store.update($("edit-id").value, data);
    closeEdit(); render(); L.toast("Expense updated.");
  });

  $("cancel-edit").addEventListener("click", closeEdit);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeEdit(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeEdit(); });

  search.addEventListener("input", render);
  filter.addEventListener("change", render);

  $("load-sample").addEventListener("click", function () {
    SAMPLE.forEach(function (s) { store.add(s); });
    render(); L.toast("Sample data loaded.");
  });

  $("clear-all").addEventListener("click", function () {
    if (!store.getAll().length) return L.toast("Nothing to delete.", true);
    if (confirm("Delete ALL expenses? This cannot be undone.")) {
      store.clear(); render(); L.toast("All expenses deleted.");
    }
  });

  render();
})();
