(function () {
  const ctx = window.NOTIFY_PAGE_CONTEXT || {};
  const tableEl = document.getElementById("notificationTable");
  if (!tableEl || !ctx.listUrl) return;

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  function csrfHeaders(extra = {}) {
    const token = getCsrfToken();
    if (!token) return extra;
    return {
      ...extra,
      "X-CSRF-Token": token,
      "CSRF-Token": token,
      "X-XSRF-TOKEN": token,
    };
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function statusBadge(row) {
    return row.is_read
      ? '<span class="badge bg-light text-dark border">Read</span>'
      : '<span class="badge bg-warning-subtle text-warning border border-warning">Unread</span>';
  }

  const filterStatus = document.getElementById("notifStatus");
  const filterType = document.getElementById("notifType");
  const filterSearch = document.getElementById("notifSearch");
  const markAllBtn = document.getElementById("markAllReadBtn");

  const table = window.jQuery
    ? window.jQuery("#notificationTable").DataTable({
    processing: true,
    serverSide: true,
    pageLength: 25,
    order: [[0, "desc"]],
    ajax: {
      url: ctx.listUrl,
      type: "POST",
      headers: csrfHeaders(),
      data: function (d) {
        d.status = filterStatus?.value || "";
        d.type = filterType?.value || "";
        d.q = filterSearch?.value || "";
        return d;
      },
    },
    columns: [
      {
        data: "created_at",
        render: (data) => formatDate(data),
      },
      { data: "title" },
      { data: "body" },
      { data: "type" },
      {
        data: null,
        orderable: false,
        render: (_data, _type, row) => statusBadge(row),
      },
      {
        data: null,
        orderable: false,
        render: (_data, _type, row) => {
          const action = row.action_link || "";
          const actionLabel = action ? "Open" : "Mark read";
          return `<button class="btn btn-sm btn-outline-primary notif-action" data-id="${row.notification_id}" data-link="${action}" data-method="${row.action_request_method || "GET"}">${actionLabel}</button>`;
        },
      },
    ],
    rowCallback: function (row, data) {
      if (!data.is_read) row.classList.add("table-warning");
    },
  })
    : null;

  if (!table) return;

  function reload() {
    table.ajax.reload(null, true);
  }

  if (filterStatus) filterStatus.addEventListener("change", reload);
  if (filterType) filterType.addEventListener("change", reload);
  if (filterSearch) {
    filterSearch.addEventListener("input", () => {
      clearTimeout(filterSearch._t);
      filterSearch._t = setTimeout(reload, 300);
    });
  }

  tableEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".notif-action");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const link = btn.getAttribute("data-link") || "";
    const method = (btn.getAttribute("data-method") || "GET").toUpperCase();
    const row = table.row(btn.closest("tr")).data() || {};

    try {
      if (id) {
        await fetch(ctx.readUrl, {
          method: "POST",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          credentials: "same-origin",
          body: JSON.stringify({ id }),
        });
      }
      if (link) {
        if (method === "POST") {
          const entityId = row.entity_id || row.data?.ticket_id || null;
          const payload = entityId ? { ticket_id: entityId } : { id };
          await fetch(link, {
            method: "POST",
            headers: csrfHeaders({ "Content-Type": "application/json" }),
            credentials: "same-origin",
            body: JSON.stringify(payload),
          });
        } else {
          window.location.href = link;
          return;
        }
      }
      reload();
    } catch (err) {
      console.error("notification action error:", err);
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      try {
        await fetch(ctx.readAllUrl, {
          method: "POST",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          credentials: "same-origin",
          body: JSON.stringify({}),
        });
        reload();
      } catch (err) {
        console.error("mark all read error:", err);
      }
    });
  }
})();
