/*!
 * expense-lib.js v1.0.0
 * A small dependency-free JavaScript library for the Expense Tracker.
 * Exposes one global: ExpenseLib
 *
 *   ExpenseLib.store      -> localStorage CRUD for expenses
 *   ExpenseLib.validate   -> validate an expense object
 *   ExpenseLib.toast      -> show a short message
 *   ExpenseLib.startClock -> live clock in the header
 *   ExpenseLib.formatLek  -> 1500 -> "1,500 Lek"
 *   ExpenseLib.initAddForm(options) -> wires up the whole Add page form
 */
(function (global) {
  "use strict";

  var KEY = "expenses";
  var CATEGORIES = ["Food", "Transport", "Books", "Rent", "Fun", "Other"];

  /* ---------------- Storage ---------------- */
  var store = {
    KEY: KEY,
    getAll: function () {
      try {
        var data = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    saveAll: function (list) {
      localStorage.setItem(KEY, JSON.stringify(list));
    },
    add: function (expense) {
      var list = store.getAll();
      var item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: expense.title.trim(),
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date
      };
      list.push(item);
      store.saveAll(list);
      return item;
    },
    update: function (id, changes) {
      var list = store.getAll().map(function (e) {
        return e.id === id
          ? { id: id, title: changes.title.trim(), amount: Number(changes.amount), category: changes.category, date: changes.date }
          : e;
      });
      store.saveAll(list);
    },
    remove: function (id) {
      store.saveAll(store.getAll().filter(function (e) { return e.id !== id; }));
    },
    clear: function () {
      localStorage.removeItem(KEY);
    }
  };

  /* ---------------- Validation ---------------- */
  function validate(data) {
    var errors = {};
    var title = (data.title || "").trim();
    if (!title) errors.title = "Title is required.";
    else if (title.length < 2) errors.title = "Title must be at least 2 characters.";
    else if (title.length > 60) errors.title = "Title must be 60 characters or fewer.";

    var amount = Number(data.amount);
    if (data.amount === "" || data.amount === undefined || data.amount === null) errors.amount = "Amount is required.";
    else if (!isFinite(amount) || amount < 1) errors.amount = "Amount must be at least 1 Lek.";
    else if (!Number.isInteger(amount)) errors.amount = "Amount must be a whole number.";

    if (!data.category) errors.category = "Please choose a category.";
    else if (CATEGORIES.indexOf(data.category) === -1) errors.category = "Unknown category.";

    if (!data.date) errors.date = "Date is required.";
    else if (isNaN(new Date(data.date).getTime())) errors.date = "Date is not valid.";

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function showErrors(form, errors) {
    form.querySelectorAll(".error").forEach(function (el) {
      var msg = errors[el.getAttribute("data-for")] || "";
      el.textContent = msg;
      var field = el.closest(".field");
      if (field) field.classList.toggle("invalid", !!msg);
    });
  }

  /* ---------------- UI helpers ---------------- */
  var toastTimer;
  function toast(message, isError) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2500);
  }

  function startClock(el) {
    el = el || document.getElementById("clock");
    if (!el) return;
    function tick() { el.textContent = new Date().toLocaleTimeString(); }
    tick();
    setInterval(tick, 1000);
  }

  function formatLek(n) {
    return Number(n).toLocaleString("en-US") + " Lek";
  }

  function todayISO() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlightNav() {
    var page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (a) {
      if (a.getAttribute("href") === page) a.classList.add("active");
    });
  }

  /* ---------------- Add page ---------------- */
  /**
   * initAddForm({ form, recent, recentList })
   * Each option is a selector or element; all are optional with sensible defaults.
   */
  function initAddForm(options) {
    options = options || {};
    var form = document.querySelector(options.form || "#expense-form");
    var recent = document.querySelector(options.recent || "#recent");
    var recentList = document.querySelector(options.recentList || "#recent-list");
    if (!form) return;

    var dateInput = form.querySelector("#date");
    if (dateInput && !dateInput.value) dateInput.value = todayISO();

    // Clear an error as soon as the user fixes the field
    form.addEventListener("input", function (e) {
      var name = e.target.name;
      var err = form.querySelector('.error[data-for="' + name + '"]');
      if (err) {
        err.textContent = "";
        var field = err.closest(".field");
        if (field) field.classList.remove("invalid");
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        title: form.title.value,
        amount: form.amount.value,
        category: form.category.value,
        date: form.date.value
      };
      var result = validate(data);
      showErrors(form, result.errors);
      if (!result.valid) {
        toast("Please fix the highlighted fields.", true);
        var first = form.querySelector(".invalid input, .invalid select");
        if (first) first.focus();
        return;
      }

      var saved = store.add(data);
      toast("Expense added!");
      form.reset();
      if (dateInput) dateInput.value = todayISO();
      form.title.focus();

      if (recent && recentList) {
        recent.style.display = "block";
        var li = document.createElement("li");
        li.innerHTML = "<span>" + escapeHTML(saved.title) + " <span class=\"badge\">" +
          escapeHTML(saved.category) + "</span></span><strong>" + formatLek(saved.amount) + "</strong>";
        recentList.insertBefore(li, recentList.firstChild);
      }
    });
  }

  function init() { startClock(); highlightNav(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  global.ExpenseLib = {
    version: "1.0.0",
    CATEGORIES: CATEGORIES,
    store: store,
    validate: validate,
    showErrors: showErrors,
    toast: toast,
    startClock: startClock,
    formatLek: formatLek,
    todayISO: todayISO,
    escapeHTML: escapeHTML,
    initAddForm: initAddForm
  };
})(window);
