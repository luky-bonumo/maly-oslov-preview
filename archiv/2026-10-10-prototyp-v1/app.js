/* Malý Oslov – ukázkový redesign. Vše běží lokálně, bez backendu. */
(function () {
  "use strict";

  var SUMMER_CAP = 82, WINTER_CAP = 50, TENT_CAP = 130;
  var form = document.getElementById("inquiryForm");

  function $(id) { return document.getElementById(id); }
  function isWinter(date) { var m = date.getMonth() + 1; return m >= 11 || m <= 3; }
  function parseISO(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function plural(n, one, few, many) { return n === 1 ? one : (n >= 2 && n <= 4 ? few : many); }
  function toPoptavka() { $("poptavka").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }

  /* ---- 1) rychlé ověření termínu ---- */
  $("quick").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, hostu = +f.hostu.value, datum = f.datum.value, typ = f.typ.value;
    var d = datum ? parseISO(datum) : null;
    var winter = d ? isWinter(d) : false;
    var cap = winter ? WINTER_CAP : SUMMER_CAP;
    var msg;
    if (hostu <= cap) {
      msg = "Vyjde to. " + hostu + " hostů se vejde do domečků" + (winter ? " i v zimním provozu (až " + WINTER_CAP + ")." : ".");
    } else if (hostu <= TENT_CAP) {
      msg = "Přespat může " + cap + " hostů, zbytek přijede na večer. Zastřešený prostor vyjde až pro " + TENT_CAP + " lidí.";
    } else {
      msg = "To je nad naši běžnou kapacitu. Napište nám, vymyslíme to.";
    }
    $("quickNote").textContent = msg;
    form.typ.value = typ; form.hostu.value = hostu; form.datum.value = datum;
    setTimeout(toPoptavka, 700);
  });

  document.querySelectorAll("[data-type]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      form.typ.value = a.dataset.type;
      toPoptavka();
    });
  });

  /* ---- 2) domečky + kalkulačka ---- */
  var TYPES = [
    { n: 6, cap: "2", beds: 2,  label: "pro 2 hosty", note: "velká manželská postel", c: "#c2402d" },
    { n: 9, cap: "4–5", beds: 4.5, label: "pro 4–5 hostů", note: "manželská postel a dvě samostatné", c: "#1f3a5f" },
    { n: 4, cap: "4", beds: 4, label: "pro 4 hosty", note: "manželská postel a rozkládací sedačka", c: "#e3a92b" },
    { n: 1, cap: "6", beds: 6, label: "pro 6 hostů", note: "dvě ložnice a rozkládací sedačka", c: "#8daa7e" },
    { n: 1, cap: "8", beds: 8, label: "pro 8 hostů", note: "čtyři postele v podkroví a sedačka", c: "#c2402d" }
  ];
  var box = $("houseTypes");
  TYPES.forEach(function (t, i) {
    var el = document.createElement("div");
    el.className = "type"; el.style.setProperty("--c", t.c); el.dataset.i = i;
    el.innerHTML = "<b>" + t.n + "×</b><div><strong>Domeček " + t.label + "</strong><br><span>" + t.note + "</span></div>" +
      "<div class='bar'><i style='width:" + (t.n / 9 * 100) + "%'></i></div>";
    box.appendChild(el);
  });

  var range = $("sleepRange");
  function calc() {
    var g = +range.value, left = g, used = 0, picked = {};
    // nejdřív největší domečky, ať je počet co nejmenší
    var order = TYPES.map(function (t, i) { return { i: i, cap: t.beds, n: t.n }; }).sort(function (a, b) { return b.cap - a.cap; });
    order.forEach(function (o) {
      var take = Math.min(o.n, Math.floor(left / o.cap));
      if (take > 0) { picked[o.i] = take; used += take; left -= take * o.cap; }
    });
    if (left > 0) {
      // zbytek do nejmenšího volného domečku, který ho pojme
      order.slice().reverse().some(function (o) {
        var free = o.n - (picked[o.i] || 0);
        if (free > 0 && o.cap >= left) { picked[o.i] = (picked[o.i] || 0) + 1; used += 1; left = 0; return true; }
        return false;
      });
    }
    document.querySelectorAll(".type").forEach(function (el) { el.classList.toggle("is-used", !!picked[el.dataset.i]); });
    var out = $("sleepOut");
    if (left > 0 || g > SUMMER_CAP) {
      out.textContent = "Pro " + g + " hostů je to nad kapacitu domečků (" + SUMMER_CAP + "). Zbytek může přespat ve stanech.";
    } else {
      out.textContent = g + " hostů zabere zhruba " + used + " " + plural(used, "domeček", "domečky", "domečků") + " z 21.";
    }
  }
  range.addEventListener("input", calc); calc();

  /* ---- 3) půjčovna (zástupný obsah) ---- */
  var RENTAL = [
    { id: "zmrz", name: "Zmrzlinová", items: [["🍦", "Zmrzlinový stánek", "retro vozík"], ["🍫", "Polevy a posypy", "sada"], ["🥄", "Kornouty a kelímky", "pro 80 hostů"], ["🧊", "Chlazený box", "na zmrzlinu"]] },
    { id: "welc", name: "Welcome station", items: [["🍹", "Limonády a dávkovače", "3× 10 l"], ["🌿", "Cedule a uvítací tabule", "set"], ["🥂", "Skleničky", "pro 80 hostů"], ["💐", "Květinová instalace", "na míru"]] },
    { id: "well", name: "Wellness", items: [["🧖", "Župany a ručníky", "sada"], ["🛁", "Venkovní vana", "s ohřevem"], ["🕯️", "Svíčky a vonné oleje", "set"], ["💆", "Masážní kout", "s lehátky"]] },
    { id: "sport", name: "Sportovní", items: [["🏐", "Volejbal a nohejbal", "síť, míče"], ["🏄", "Paddleboardy", "4 ks"], ["🎯", "Cornhole a kroket", "hry na louku"], ["🏓", "Stolní tenis", "stůl, pálky"]] },
    { id: "kava", name: "Kávová", items: [["☕", "Barista stanice", "stroj, mlýnek"], ["🥐", "Snídaňový stůl", "keramika"], ["🫖", "Čajový koutek", "konvice, výběr"], ["🥛", "Alternativy mléka", "set"]] },
    { id: "gril", name: "Grilovací", items: [["🔥", "Velký gril", "pro 40+ lidí"], ["🥩", "Grilovací nářadí", "set"], ["🥗", "Salátový bar", "mísy, příbory"], ["🪵", "Dřevo a podpalovače", "balík"]] }
  ];
  var cart = {};   // klíč "id:idx" -> text
  var current = RENTAL[0].id;
  var tabs = $("rentalTabs"), itemsBox = $("rentalItems");

  function renderTabs() {
    tabs.innerHTML = "";
    RENTAL.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "rtab"; b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", c.id === current);
      b.textContent = c.name;
      b.addEventListener("click", function () { current = c.id; renderTabs(); renderItems(); });
      tabs.appendChild(b);
    });
  }
  function renderItems() {
    var col = RENTAL.filter(function (c) { return c.id === current; })[0];
    itemsBox.innerHTML = "";
    col.items.forEach(function (it, idx) {
      var key = col.id + ":" + idx;
      var b = document.createElement("button");
      b.type = "button"; b.className = "item"; b.setAttribute("aria-pressed", !!cart[key]);
      b.innerHTML = "<span class='emoji' aria-hidden='true'>" + it[0] + "</span><strong>" + it[1] + "</strong><small>" + it[2] + "</small>";
      b.addEventListener("click", function () {
        if (cart[key]) delete cart[key]; else cart[key] = col.name + ": " + it[1];
        renderItems(); renderCart();
      });
      itemsBox.appendChild(b);
    });
  }
  function renderCart() {
    var list = $("cartList"), keys = Object.keys(cart);
    list.innerHTML = "";
    if (!keys.length) { list.innerHTML = "<li class='muted'>Zatím nic nevybráno</li>"; }
    keys.forEach(function (k) { var li = document.createElement("li"); li.textContent = cart[k]; list.appendChild(li); });
    $("cartSend").disabled = !keys.length;
  }
  $("cartSend").addEventListener("click", function () {
    form.pujcovna.value = Object.keys(cart).map(function (k) { return cart[k]; }).join("\n");
    toPoptavka();
  });
  renderTabs(); renderItems(); renderCart();

  /* ---- 4) kalendář (ukázková data) ---- */
  var months = [];
  for (var m = 3; m <= 9; m++) months.push(new Date(2027, m, 1));   // duben–říjen 2027
  var mi = 0, picked = "";
  function busy(d) {
    // deterministická ukázka: ~55 % víkendů a ~12 % ostatních dnů obsazeno
    var s = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    var r = ((s * 2654435761) >>> 0) % 100;
    var dow = d.getDay();
    return (dow === 5 || dow === 6) ? r < 55 : r < 12;
  }
  function renderCal() {
    var first = months[mi], grid = $("calGrid");
    $("calTitle").textContent = first.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
    grid.innerHTML = "";
    ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].forEach(function (n) {
      var h = document.createElement("div"); h.className = "cal-dow"; h.textContent = n; grid.appendChild(h);
    });
    var offset = (first.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) { var e = document.createElement("div"); e.className = "day empty"; grid.appendChild(e); }
    var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (var d = 1; d <= days; d++) {
      var date = new Date(first.getFullYear(), first.getMonth(), d), key = iso(date);
      var b = document.createElement("button");
      b.type = "button"; b.textContent = d;
      var isBusy = busy(date), wknd = date.getDay() === 5 || date.getDay() === 6;
      b.className = "day " + (isBusy ? "busy" : "free" + (wknd ? " wknd" : "")) + (key === picked ? " picked" : "");
      if (isBusy) { b.disabled = true; b.setAttribute("aria-label", d + ". obsazeno"); }
      else {
        b.setAttribute("aria-label", d + ". volno");
        b.addEventListener("click", (function (k) { return function () {
          picked = k; form.datum.value = k; renderCal(); toPoptavka();
        }; })(key));
      }
      grid.appendChild(b);
    }
    $("calPrev").disabled = mi === 0; $("calNext").disabled = mi === months.length - 1;
  }
  $("calPrev").addEventListener("click", function () { if (mi > 0) { mi--; renderCal(); } });
  $("calNext").addEventListener("click", function () { if (mi < months.length - 1) { mi++; renderCal(); } });
  renderCal();

  /* ---- 5) poptávka -> mailto (ukázka, v ostré verzi formulářový backend) ---- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var note = $("formNote");
    if (!form.jmeno.value.trim() || !/^\S+@\S+\.\S+$/.test(form.email.value)) {
      note.textContent = "Doplňte prosím jméno a platný e-mail."; return;
    }
    var body = ["Jméno: " + form.jmeno.value, "E-mail: " + form.email.value, "Typ akce: " + form.typ.value,
      "Počet hostů: " + form.hostu.value, "Termín: " + (form.datum.value || "neurčeno"),
      "", "Půjčovna:", form.pujcovna.value || "–", "", form.zprava.value].join("\n");
    note.textContent = "V ostré verzi by poptávka odešla přímo na rezervace@malyoslov.cz. Otevírám e-mailového klienta.";
    location.href = "mailto:rezervace@malyoslov.cz?subject=" + encodeURIComponent("Poptávka: " + form.typ.value) + "&body=" + encodeURIComponent(body);
  });

  /* ---- 6) jemné odhalování sekcí ---- */
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12 });
    document.querySelectorAll(".card, .timeline li, .section-head").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
