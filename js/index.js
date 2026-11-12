(function () {
  var list = ExpenseLib.store.getAll();
  var total = list.reduce(function (s, e) { return s + e.amount; }, 0);
  document.getElementById("stat-count").textContent = list.length;
  document.getElementById("stat-total").textContent = ExpenseLib.formatLek(total);
  if (list.length) {
    var latest = list.slice().sort(function (a, b) { return b.date.localeCompare(a.date); })[0];
    document.getElementById("stat-latest").textContent = latest.title + " (" + latest.date + ")";
  }
})();
