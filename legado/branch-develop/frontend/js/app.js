/**
 * POLAR - comportamento compartilhado entre telas e cliente da API REST.
 */
(function () {
  "use strict";

  var API_BASE_URL = window.POLAR_API_BASE_URL || localStorage.getItem("polar_api_base") || "http://localhost:3000";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getToken() {
    return localStorage.getItem("polar_token") || sessionStorage.getItem("polar_token") || "";
  }

  function setSession(auth, remember) {
    var store = remember ? localStorage : sessionStorage;
    store.setItem("polar_token", auth.token);
    store.setItem("polar_user", JSON.stringify(auth.user || {}));

    if (remember) {
      sessionStorage.removeItem("polar_token");
      sessionStorage.removeItem("polar_user");
    } else {
      localStorage.removeItem("polar_token");
      localStorage.removeItem("polar_user");
    }
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("polar_user") || sessionStorage.getItem("polar_user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function apiRequest(path, options) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    var token = getToken();

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return fetch(API_BASE_URL + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.json().catch(function () {
        return {};
      }).then(function (body) {
        if (!res.ok) {
          var error = new Error(body.message || "Falha ao comunicar com a API.");
          error.status = res.status;
          error.body = body;
          throw error;
        }
        return body;
      });
    });
  }

  var POLAR_API = {
    baseUrl: API_BASE_URL,
    setBaseUrl: function (url) {
      API_BASE_URL = url;
      localStorage.setItem("polar_api_base", url);
    },
    request: apiRequest,
    login: function (username, password, remember) {
      return apiRequest("/auth/login", {
        method: "POST",
        body: { username: username, password: password }
      }).then(function (auth) {
        setSession(auth, remember);
        return auth;
      });
    },
    listOccurrences: function (query) {
      return apiRequest("/occurrences" + toQuery(query)).then(unwrapData);
    },
    getOccurrence: function (id) {
      return apiRequest("/occurrences/" + encodeURIComponent(id)).then(unwrapData);
    },
    createOccurrence: function (data) {
      return apiRequest("/occurrences", { method: "POST", body: data });
    },
    updateOccurrence: function (id, data) {
      return apiRequest("/occurrences/" + encodeURIComponent(id), { method: "PUT", body: data }).then(unwrapData);
    },
    deleteOccurrence: function (id) {
      return apiRequest("/occurrences/" + encodeURIComponent(id), { method: "DELETE" });
    },
    listStudents: function (query) {
      return apiRequest("/students" + toQuery(query)).then(unwrapData);
    },
    getStudent: function (id) {
      return apiRequest("/students/" + encodeURIComponent(id)).then(unwrapData);
    },
    createStudent: function (data) {
      return apiRequest("/students", { method: "POST", body: data }).then(unwrapData);
    },
    listUsers: function () {
      return apiRequest("/users").then(unwrapData);
    },
    createUser: function (data) {
      return apiRequest("/users", { method: "POST", body: data }).then(unwrapData);
    },
    occurrenceReport: function () {
      return apiRequest("/reports/occurrences").then(unwrapData);
    },
    studentReport: function (id) {
      return apiRequest("/reports/student/" + encodeURIComponent(id)).then(unwrapData);
    },
    sendNotification: function (data) {
      return apiRequest("/notifications", { method: "POST", body: data }).then(unwrapData);
    }
  };

  window.POLAR_API = POLAR_API;

  function unwrapData(response) {
    return response ? response.data : null;
  }

  function toQuery(query) {
    if (!query) return "";
    var params = new URLSearchParams();
    Object.keys(query).forEach(function (key) {
      if (query[key] !== undefined && query[key] !== null && query[key] !== "") {
        params.set(key, query[key]);
      }
    });
    var serialized = params.toString();
    return serialized ? "?" + serialized : "";
  }

  function formatDate(value) {
    if (!value) return "-";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("") || "?";
  }

  function badgeClass(status) {
    var normalized = String(status || "").toUpperCase();
    if (normalized === "EM_ANALISE") return "badge--analysis";
    if (normalized === "RESOLVIDA") return "badge--resolved";
    if (normalized === "ENCERRADA") return "badge--closed";
    return "badge--registered";
  }

  function priorityClass(severity) {
    var normalized = String(severity || "").toLowerCase();
    if (normalized === "alta") return "priority--alta";
    if (normalized === "baixa") return "priority--baixa";
    return "priority--media";
  }

  function currentPageName() {
    return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  }

  function initNavGroups() {
    qsa(".nav__group-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest(".nav__group");
        if (!group) return;
        var open = group.classList.toggle("is-open");
        qsa(".nav__group").forEach(function (g) {
          if (g !== group) g.classList.remove("is-open");
        });
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function initLoginPage() {
    var form = qs("#login-form");
    if (!form) return;

    var passInput = qs("#password", form);
    var toggle = qs("#toggle-password", form);
    var err = qs("#login-error", form);

    if (toggle && passInput) {
      toggle.addEventListener("click", function () {
        var show = passInput.type === "password";
        passInput.type = show ? "text" : "password";
        toggle.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var username = (qs("#email", form).value || "").trim();
      var password = (passInput.value || "").trim();
      var remember = Boolean(qs("input[name='remember']", form) && qs("input[name='remember']", form).checked);
      var submit = qs("button[type='submit']", form);

      if (!username || !password) {
        showLoginError(err, "Preencha usuario e senha.");
        return;
      }

      if (submit) submit.disabled = true;
      POLAR_API.login(username, password, remember)
        .then(function () {
          if (err) err.classList.remove("is-visible");
          window.location.href = "dashboard.html";
        })
        .catch(function (error) {
          showLoginError(err, error.message || "Nao foi possivel entrar.");
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  }

  function showLoginError(err, message) {
    if (!err) return;
    err.textContent = message;
    err.classList.add("is-visible");
  }

  function initCharCounters() {
    qsa("[data-max-length]").forEach(function (ta) {
      var max = parseInt(ta.getAttribute("data-max-length"), 10);
      var out = qs("[data-char-for='" + ta.id + "']");
      if (!out || !ta.id) return;

      function sync() {
        var len = ta.value.length;
        if (len > max) {
          ta.value = ta.value.slice(0, max);
          len = max;
        }
        out.textContent = len + " / " + max + " caracteres";
      }
      ta.addEventListener("input", sync);
      sync();
    });
  }

  function initRichEditor() {
    var editor = qs("[data-rte-body]");
    if (!editor) return;

    var max = parseInt(editor.getAttribute("data-max-length") || "2000", 10);
    var counter = qs("[data-rte-count]");

    function textLen() {
      return (editor.innerText || "").replace(/\n/g, "").length;
    }

    function syncCount() {
      if (counter) counter.textContent = textLen() + " / " + max + " caracteres";
    }

    editor.addEventListener("input", function () {
      while (textLen() > max) {
        editor.innerText = (editor.innerText || "").slice(0, -1);
      }
      syncCount();
    });

    qsa("[data-rte-cmd]").forEach(function (btn) {
      btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
      btn.addEventListener("click", function () {
        document.execCommand(btn.getAttribute("data-rte-cmd"), false, btn.getAttribute("data-rte-value") || null);
        editor.focus();
        syncCount();
      });
    });

    var styleSel = qs("[data-rte-style]");
    if (styleSel) {
      styleSel.addEventListener("change", function () {
        document.execCommand("formatBlock", false, styleSel.value || "p");
        editor.focus();
      });
    }

    syncCount();
  }

  function initFiltersClear() {
    var btn = qs("[data-clear-filters]");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var form = btn.closest("form") || document;
      qsa("input[type='search'], input[type='text']", form).forEach(function (input) {
        if (!input.closest(".input-wrap")) input.value = "";
      });
      qsa("select", form).forEach(function (select) {
        select.selectedIndex = 0;
      });
    });
  }

  function initPaginationDemo() {
    qsa("[data-pagination]").forEach(function (wrap) {
      qsa("button[data-page]", wrap).forEach(function (button) {
        button.addEventListener("click", function () {
          if (button.disabled) return;
          qsa("button[data-page]", wrap).forEach(function (item) { item.classList.remove("is-active"); });
          button.classList.add("is-active");
        });
      });
    });
  }

  function initOccurrenceActions() {
    var assume = qs("[data-action-assume]");
    var resolve = qs("[data-action-resolve]");
    if (assume) assume.addEventListener("click", function () { alert("Analise assumida pelo coordenador."); });
    if (resolve) resolve.addEventListener("click", function () { alert("Ocorrencia marcada como resolvida."); });
  }

  function initTabs() {
    var tabs = qs(".tabs");
    if (!tabs) return;
    qsa(".tabs button").forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        qsa(".tabs button").forEach(function (button) { button.classList.remove("is-active"); });
        btn.classList.add("is-active");
        qsa("[data-tab-panel]").forEach(function (panel, panelIndex) {
          panel.hidden = panelIndex !== idx;
        });
      });
    });
  }

  function initCancelLinks() {
    qsa("[data-cancel-href]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var href = btn.getAttribute("data-cancel-href");
        if (href) window.location.href = href;
      });
    });
  }

  function renderOccurrencesTable(table, occurrences, options) {
    var tbody = qs("tbody", table);
    if (!tbody) return;
    options = options || {};
    tbody.innerHTML = "";

    if (!occurrences || !occurrences.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = "<td colspan='7'>Nenhuma ocorrencia encontrada.</td>";
      tbody.appendChild(empty);
      return;
    }

    occurrences.forEach(function (occurrence) {
      var row = document.createElement("tr");
      if (options.history) {
        row.innerHTML =
          "<td>#" + occurrence.id.slice(0, 6) + "</td>" +
          "<td>" + formatDate(occurrence.createdAt) + "</td>" +
          "<td>" + escapeHtml(occurrence.type) + "</td>" +
          "<td>" + escapeHtml((occurrence.description || "").slice(0, 80)) + "</td>" +
          "<td><span class='badge " + badgeClass(occurrence.status) + "'>" + occurrence.status + "</span></td>" +
          "<td>" + escapeHtml(occurrence.createdBy || "-") + "</td>" +
          "<td><a class='icon-btn' href='ocorrencia-detalhe.html?id=" + encodeURIComponent(occurrence.id) + "' aria-label='Ver'>Ver</a></td>";
      } else {
        row.innerHTML =
          "<td>" + escapeHtml(occurrence.studentName || "-") + "</td>" +
          "<td>" + escapeHtml(occurrence.type || "-") + "</td>" +
          "<td class='priority " + priorityClass(occurrence.severity) + "'>" + escapeHtml(occurrence.severity || "-") + "</td>" +
          "<td><span class='badge " + badgeClass(occurrence.status) + "'>" + occurrence.status + "</span></td>" +
          "<td>" + formatDate(occurrence.createdAt) + "</td>" +
          "<td>" + escapeHtml(occurrence.createdBy || "-") + "</td>" +
          "<td><a class='icon-btn' href='ocorrencia-detalhe.html?id=" + encodeURIComponent(occurrence.id) + "' aria-label='Ver'>Ver</a></td>";
      }
      tbody.appendChild(row);
    });
  }

  function renderStudentsTable(table, students) {
    var tbody = qs("tbody", table);
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!students || !students.length) {
      tbody.innerHTML = "<tr><td colspan='5'>Nenhum aluno cadastrado.</td></tr>";
      return;
    }

    students.forEach(function (student) {
      var row = document.createElement("tr");
      row.innerHTML =
        "<td>" + escapeHtml(student.name || "-") + "</td>" +
        "<td>" + escapeHtml(student.class || "-") + "</td>" +
        "<td>" + escapeHtml(student.registration || "-") + "</td>" +
        "<td><span class='badge badge--active'>Ativo</span></td>" +
        "<td class='actions-icons'><a href='aluno-historico.html?id=" + encodeURIComponent(student.id) + "' aria-label='Historico'>Ver</a></td>";
      tbody.appendChild(row);
    });
  }

  function initDashboardApi() {
    if (currentPageName() !== "dashboard.html" || !getToken()) return;

    Promise.all([POLAR_API.occurrenceReport(), POLAR_API.listOccurrences()])
      .then(function (results) {
        var report = results[0] || {};
        var occurrences = results[1] || [];
        var values = qsa(".grid-stats .value");
        if (values[0]) values[0].textContent = report.total || 0;
        if (values[1]) values[1].textContent = (report.byStatus && report.byStatus.EM_ANALISE) || 0;
        if (values[2]) values[2].textContent = (report.byStatus && report.byStatus.RESOLVIDA) || 0;
        if (values[3]) values[3].textContent = (report.byStatus && report.byStatus.ENCERRADA) || 0;

        var table = qs(".dash-row .data-table");
        if (table) renderDashboardRecent(table, occurrences.slice(-5).reverse());
      })
      .catch(console.warn);
  }

  function renderDashboardRecent(table, occurrences) {
    var tbody = qs("tbody", table);
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!occurrences.length) {
      tbody.innerHTML = "<tr><td colspan='4'>Nenhuma ocorrencia registrada.</td></tr>";
      return;
    }
    occurrences.forEach(function (occurrence) {
      var row = document.createElement("tr");
      row.innerHTML =
        "<td class='cell-user'><span class='avatar'>" + initials(occurrence.studentName) + "</span> " + escapeHtml(occurrence.studentName || "-") + "</td>" +
        "<td>" + escapeHtml(occurrence.type || "-") + "</td>" +
        "<td><span class='badge " + badgeClass(occurrence.status) + "'>" + occurrence.status + "</span></td>" +
        "<td>" + formatDate(occurrence.createdAt) + "</td>";
      tbody.appendChild(row);
    });
  }

  function initOccurrenceListApi() {
    var page = currentPageName();
    if (page !== "ocorrencias-lista.html" && page !== "ocorrencia-lista.html") return;
    if (!getToken()) return;

    POLAR_API.listOccurrences()
      .then(function (occurrences) {
        var table = qs(".data-table");
        if (table) renderOccurrencesTable(table, occurrences || []);
        var pager = qs("[data-pagination] span");
        if (pager) pager.textContent = "Mostrando " + (occurrences || []).length + " ocorrencias";
      })
      .catch(console.warn);
  }

  function initOccurrenceFormApi() {
    var form = qs("#form-nova-ocorrencia");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = form.querySelector(":invalid");
      if (invalid) {
        invalid.focus();
        return;
      }

      var rte = qs("[data-rte-body]", form);
      var description = rte ? (rte.innerText || "").replace(/\s+/g, " ").trim() : "";
      if (description.length < 10) {
        alert("Preencha a descricao detalhada com pelo menos 10 caracteres.");
        if (rte) rte.focus();
        return;
      }

      var button = qs("button[type='submit']", form);
      if (button) button.disabled = true;
      POLAR_API.createOccurrence({
        student: qs("#aluno", form).value,
        type: qs("#cat", form).value,
        severity: qs("#prio", form).value,
        description: description
      })
        .then(function (response) {
          var external = response.externalIntegration || {};
          alert(external.success ? "Ocorrencia registrada." : "Ocorrencia registrada localmente. Integracao externa pendente.");
          window.location.href = "ocorrencias-lista.html";
        })
        .catch(function (error) {
          alert(error.message || "Nao foi possivel registrar a ocorrencia.");
        })
        .finally(function () {
          if (button) button.disabled = false;
        });
    });
  }

  function initStudentsApi() {
    if (currentPageName() !== "alunos.html" || !getToken()) return;
    POLAR_API.listStudents()
      .then(function (students) {
        var table = qs(".data-table");
        if (table) renderStudentsTable(table, students || []);
        var pager = qs("[data-pagination] span");
        if (pager) pager.textContent = "Mostrando " + (students || []).length + " alunos";
      })
      .catch(console.warn);
  }

  function initStudentHistoryApi() {
    if (currentPageName() !== "aluno-historico.html" || !getToken()) return;
    var id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    Promise.all([POLAR_API.getStudent(id), POLAR_API.studentReport(id)])
      .then(function (results) {
        var student = results[0];
        var report = results[1] || {};
        var heroTitle = qs(".student-hero h1");
        var heroMeta = qs(".student-hero .text-muted");
        if (heroTitle) heroTitle.textContent = student.name;
        if (heroMeta) heroMeta.textContent = "Turma: " + (student.class || "-") + " · Matricula: " + (student.registration || "-");

        var nums = qsa(".student-hero__stats .n");
        if (nums[0]) nums[0].textContent = report.totalOccurrences || 0;
        if (nums[1]) nums[1].textContent = (report.byStatus && report.byStatus.EM_ANALISE) || 0;
        if (nums[2]) nums[2].textContent = (report.byStatus && report.byStatus.RESOLVIDA) || 0;
        if (nums[3]) nums[3].textContent = (report.byStatus && report.byStatus.ENCERRADA) || 0;

        var table = qs("[data-tab-panel] .data-table");
        if (table) renderOccurrencesTable(table, report.occurrences || [], { history: true });
      })
      .catch(console.warn);
  }

  function initUsersApi() {
    if (currentPageName() !== "usuarios.html" || !getToken()) return;
    POLAR_API.listUsers()
      .then(function (users) {
        var table = qs(".data-table");
        var tbody = table && qs("tbody", table);
        if (!tbody) return;
        tbody.innerHTML = "";
        (users || []).forEach(function (user) {
          var row = document.createElement("tr");
          row.innerHTML =
            "<td class='cell-user'><span class='avatar'>" + initials(user.username) + "</span> " + escapeHtml(user.username || "-") + "</td>" +
            "<td>" + escapeHtml(user.email || "-") + "</td>" +
            "<td><span class='role-tag'>" + escapeHtml(user.role || "-") + "</span></td>" +
            "<td><span class='badge badge--active'>ATIVO</span></td>" +
            "<td>" + formatDate(user.lastLoginAt) + "</td>" +
            "<td class='actions-icons'>-</td>";
          tbody.appendChild(row);
        });
      })
      .catch(console.warn);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function syncUserLabels() {
    var user = getUser();
    if (!user || !user.username) return;
    qsa(".topbar__user, .sidebar__user-info strong").forEach(function (node) {
      if (node.classList && node.classList.contains("topbar__user")) {
        var avatar = qs(".avatar", node);
        node.childNodes.forEach(function (child) {
          if (child.nodeType === Node.TEXT_NODE) child.nodeValue = " " + user.username + " ";
        });
        if (avatar) avatar.textContent = initials(user.username);
      } else {
        node.textContent = user.username;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavGroups();
    initLoginPage();
    initCharCounters();
    initRichEditor();
    initFiltersClear();
    initPaginationDemo();
    initOccurrenceActions();
    initTabs();
    initCancelLinks();
    initDashboardApi();
    initOccurrenceListApi();
    initOccurrenceFormApi();
    initStudentsApi();
    initStudentHistoryApi();
    initUsersApi();
    syncUserLabels();
  });
})();
