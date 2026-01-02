(function () {
  const ctx = window.TICKET_CONTEXT || {};
  const me = ctx.me || null;
  const uploadUrl = ctx.uploadUrl || "";
  const initialTicketId = Number(ctx.activeTicketId) || null;

  const chatListEl = document.getElementById("chatList");
  const messagesEl = document.getElementById("messages");
  const messageInputEl = document.getElementById("messageInput");
  const sendBtnEl = document.getElementById("sendBtn");
  const themeToggleEl = document.getElementById("themeToggle");
  const searchInputEl = document.getElementById("searchInput");
  const activeNameEl = document.getElementById("activeName");
  const activeStatusEl = document.getElementById("activeStatus");
  const activeMetaEl = document.getElementById("activeMeta");
  const activeAvatarEl = document.getElementById("activeAvatar");
  const attachBtnEl = document.getElementById("attachBtn");
  const fileInputEl = document.getElementById("fileInput");
  const pendingAttachmentsEl = document.getElementById("pendingAttachments");
  const backBtnEl = document.getElementById("backBtn");

  const state = {
    tickets: [],
    activeTicketId: initialTicketId || null,
    messagesByTicket: new Map(),
    messageIdsByTicket: new Map(),
    pendingFiles: [],
    typingTimers: new Map(),
  };

  function showError(message) {
    if (!message) return;
    try {
      if (window.kilToast) kilToast.danger(String(message));
    } catch (_) {}
  }

  if (!me) {
    console.error("ME not found on page");
    showError("User not identified");
    return;
  }

  function readCookie(name) {
    return document.cookie.split("; ").find((r) => r.startsWith(name + "="))?.split("=").slice(1).join("=");
  }

  function setCsrf(token) {
    if (!token) return;
    let meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "csrf-token");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", token);
    const hidden = document.querySelector('input[name="_csrf"]');
    if (hidden) hidden.value = token;
  }

  function getCsrf() {
    const meta = document.querySelector('meta[name="csrf-token"]')?.content;
    if (meta) return meta;
    const hidden = document.querySelector('input[name="_csrf"]')?.value;
    if (hidden) return hidden;
    for (const key of ["XSRF-TOKEN", "_csrf", "csrfToken"]) {
      const v = readCookie(key);
      if (v) return decodeURIComponent(v);
    }
    return "";
  }

  async function kFetch(url, opts = {}) {
    const headers = new Headers(opts.headers || {});
    const t = getCsrf();
    if (t) {
      headers.set("X-CSRF-Token", t);
      headers.set("CSRF-Token", t);
      headers.set("X-XSRF-TOKEN", t);
    }
    opts.headers = headers;
    const res = await fetch(url, opts);
    const newT = res.headers.get("x-csrf-token")
      || res.headers.get("csrf-token")
      || res.headers.get("x-xsrf-token");
    if (newT) setCsrf(newT);
    return res;
  }

  const socket = io();

  function emitWithAck(event, payload, timeoutMs = 10000) {
    if (!socket.connected) {
      return Promise.resolve({ ok: false, message: "Socket disconnected" });
    }
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        resolve({ ok: false, message: "Request timeout" });
      }, timeoutMs);

      socket.emit(event, payload, (res) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(res || { ok: true });
      });
    });
  }

  function getTicket(ticketId) {
    return state.tickets.find((t) => Number(t.ticket_id) === Number(ticketId));
  }

  function isFromMe(message) {
    if (!message) return false;
    if (me.user_type === "FirmStaff") {
      return message.sender_type === "FirmStaff"
        && Number(message.sender_id) === Number(me.user_id);
    }
    if (me.user_type === "ClientAccount") return message.sender_type === "Client";
    if (me.user_type === "Admin") {
      return message.sender_type === "System"
        && Number(message.sender_id) === Number(me.user_id);
    }
    return false;
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function dateKey(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function formatDateLabel(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    if (isSameDay(d, today)) return "Today";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  }

  function appendDateDivider(label) {
    if (!messagesEl || !label) return;
    const divider = document.createElement("div");
    divider.className = "day-divider";
    divider.textContent = label;
    messagesEl.appendChild(divider);
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  function getFileLabel(att) {
    const name = (att?.file_name || "").toLowerCase();
    const mime = (att?.mime_type || "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : "";
    if (mime.includes("pdf") || ext === "pdf") return "PDF";
    if (mime.includes("word") || ext === "doc" || ext === "docx") return "DOC";
    if (mime.includes("excel") || ext === "xls" || ext === "xlsx") return "XLS";
    if (mime.includes("powerpoint") || ext === "ppt" || ext === "pptx") return "PPT";
    if (mime.startsWith("audio/") || ext === "mp3" || ext === "wav") return "AUDIO";
    if (mime.startsWith("video/") || ext === "mp4" || ext === "mov") return "VIDEO";
    if (mime.includes("zip") || ext === "zip" || ext === "rar" || ext === "7z") return "ZIP";
    return (ext || "FILE").toUpperCase();
  }

  let imageObserver = null;
  function ensureImageObserver() {
    if (imageObserver) return imageObserver;
    if (!("IntersectionObserver" in window)) return null;
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute("data-src");
        }
        imageObserver.unobserve(img);
      });
    }, { rootMargin: "120px" });
    return imageObserver;
  }

  function attachImageLoader(img, loader, src) {
    img.dataset.src = src;
    img.classList.add("is-loading");
    img.addEventListener("load", () => {
      img.classList.remove("is-loading");
      loader?.remove();
    });
    img.addEventListener("error", () => {
      img.classList.remove("is-loading");
      if (loader) loader.textContent = "Failed to load";
    });
    const observer = ensureImageObserver();
    if (observer) observer.observe(img);
    else img.src = src;
  }

  function renderPendingAttachments() {
    if (!pendingAttachmentsEl) return;
    pendingAttachmentsEl.innerHTML = "";
    if (!state.pendingFiles.length) return;

    state.pendingFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "pending-item";
      item.textContent = `${file.name} ${formatFileSize(file.size) ? `(${formatFileSize(file.size)})` : ""}`.trim();

      const removeBtn = document.createElement("button");
      removeBtn.className = "pending-remove";
      removeBtn.textContent = "x";
      removeBtn.addEventListener("click", () => {
        state.pendingFiles.splice(index, 1);
        renderPendingAttachments();
      });

      item.appendChild(removeBtn);
      pendingAttachmentsEl.appendChild(item);
    });
  }

  function clearPendingAttachments() {
    state.pendingFiles = [];
    if (fileInputEl) fileInputEl.value = "";
    renderPendingAttachments();
  }

  async function uploadPendingAttachments() {
    if (!state.pendingFiles.length) return [];
    if (!uploadUrl) return [];
    const formData = new FormData();
    state.pendingFiles.forEach((file) => formData.append("files", file));

    const res = await kFetch(uploadUrl, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!data?.success) {
      throw new Error(data?.message || "Upload failed");
    }
    return data.attachments || [];
  }

  function getInitials(name) {
    if (!name) return "--";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "--";
  }

  function sortTickets() {
    state.tickets.sort((a, b) => {
      const aTime = Date.parse(a.last_message_at || "") || 0;
      const bTime = Date.parse(b.last_message_at || "") || 0;
      return bTime - aTime;
    });
  }

  function renderChatList() {
    if (!chatListEl) return;
    const term = (searchInputEl?.value || "").trim().toLowerCase();
    const list = term
      ? state.tickets.filter((t) => (t.subject || "").toLowerCase().includes(term))
      : state.tickets;

    chatListEl.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "chat-item";
      empty.textContent = "No tickets yet";
      chatListEl.appendChild(empty);
      return;
    }

    list.forEach((ticket) => {
      const item = document.createElement("div");
      item.className = "chat-item";
      if (Number(ticket.ticket_id) === Number(state.activeTicketId)) {
        item.classList.add("active");
      }
      item.dataset.id = ticket.ticket_id;

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = getInitials(ticket.subject || "Ticket");

      const textWrap = document.createElement("div");
      textWrap.className = "chat-item-text";

      const nameEl = document.createElement("div");
      nameEl.className = "chat-name";
      nameEl.textContent = ticket.subject || "Ticket";

      const lastMsgEl = document.createElement("div");
      lastMsgEl.className = "chat-last-msg";
      lastMsgEl.textContent = ticket.ticket_number || "";

      textWrap.appendChild(nameEl);
      textWrap.appendChild(lastMsgEl);

      const meta = document.createElement("div");
      meta.className = "chat-meta";
      meta.innerHTML = `<div>${formatTime(ticket.last_message_at) || ""}</div>`;
      if (ticket.status) {
        const statusEl = document.createElement("div");
        statusEl.textContent = ticket.status.toUpperCase();
        meta.appendChild(statusEl);
      }

      item.appendChild(avatar);
      item.appendChild(textWrap);
      item.appendChild(meta);

      item.addEventListener("click", () => {
        openTicket(ticket.ticket_id);
      });

      chatListEl.appendChild(item);
    });
  }

  function renderActiveHeader() {
    const ticket = getTicket(state.activeTicketId);
    if (!ticket) {
      if (activeNameEl) activeNameEl.textContent = "Select a ticket";
      if (activeStatusEl) activeStatusEl.textContent = "";
      if (activeMetaEl) activeMetaEl.textContent = "";
      if (activeAvatarEl) activeAvatarEl.textContent = "--";
      return;
    }

    const name = ticket.subject || "Ticket";
    if (activeNameEl) activeNameEl.textContent = name;
    if (activeAvatarEl) activeAvatarEl.textContent = getInitials(name);
    if (activeMetaEl) activeMetaEl.textContent = ticket.ticket_number || `#${ticket.ticket_id}`;

    if (state.typingTimers.has(Number(ticket.ticket_id))) {
      if (activeStatusEl) activeStatusEl.textContent = "Typing...";
      return;
    }

    if (activeStatusEl) {
      activeStatusEl.textContent = ticket.status ? ticket.status.toUpperCase() : "";
    }
  }

  function appendMessageRow(message) {
    if (!messagesEl) return;
    const fromMe = isFromMe(message);
    const row = document.createElement("div");
    row.className = "message-row " + (fromMe ? "me" : "them");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (!fromMe && message.sender_label) {
      const senderEl = document.createElement("div");
      senderEl.className = "message-sender";
      senderEl.textContent = message.sender_label;
      bubble.appendChild(senderEl);
    }

    const body = message.body || "";
    if (body) {
      const textEl = document.createElement("div");
      textEl.textContent = body;
      bubble.appendChild(textEl);
    }

    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (attachments.length) {
      const listEl = document.createElement("div");
      listEl.className = "attachment-list";

      attachments.forEach((att) => {
        const type = att?.file_type || "file";
        const name = att?.file_name || "attachment";
        const url = att?.url || "";
        const size = formatFileSize(att?.file_size);

        if (type === "image") {
          const wrap = document.createElement("div");
          wrap.className = "attachment-image-wrap";

          const img = document.createElement("img");
          img.className = "attachment-media";
          img.alt = name;
          img.loading = "lazy";
          img.decoding = "async";

          const loader = document.createElement("div");
          loader.className = "attachment-loader";
          const dot = document.createElement("div");
          dot.className = "loader-dot";
          loader.appendChild(dot);

          attachImageLoader(img, loader, url);

          wrap.appendChild(img);
          wrap.appendChild(loader);
          listEl.appendChild(wrap);
          return;
        }

        if (type === "video") {
          const wrap = document.createElement("div");
          wrap.className = "attachment-image-wrap";

          const video = document.createElement("video");
          video.className = "attachment-media";
          video.controls = true;
          video.preload = "metadata";

          const loader = document.createElement("div");
          loader.className = "attachment-loader";
          const dot = document.createElement("div");
          dot.className = "loader-dot";
          loader.appendChild(dot);

          video.addEventListener("loadedmetadata", () => loader.remove());
          video.addEventListener("error", () => {
            loader.textContent = "Failed to load";
          });
          video.src = url;

          wrap.appendChild(video);
          wrap.appendChild(loader);
          listEl.appendChild(wrap);
          return;
        }

        const card = document.createElement("div");
        card.className = "attachment-card attachment-file";

        const metaWrap = document.createElement("div");
        metaWrap.style.display = "flex";
        metaWrap.style.flexDirection = "column";
        metaWrap.style.gap = "0.1rem";

        const badge = document.createElement("div");
        badge.className = "file-badge";
        badge.textContent = getFileLabel(att);

        const nameEl = document.createElement("div");
        nameEl.className = "attachment-name";
        nameEl.textContent = name;

        const sizeEl = document.createElement("div");
        sizeEl.className = "attachment-size";
        sizeEl.textContent = size;

        metaWrap.appendChild(badge);
        metaWrap.appendChild(nameEl);
        metaWrap.appendChild(sizeEl);

        const link = document.createElement("a");
        link.className = "attachment-link";
        link.href = url || "#";
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Download";
        if (name) link.setAttribute("download", name);

        card.appendChild(metaWrap);
        card.appendChild(link);
        listEl.appendChild(card);
      });

      bubble.appendChild(listEl);
    }

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = formatTime(message.created_at);

    bubble.appendChild(meta);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
  }

  function renderMessages(ticketId) {
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    const messages = state.messagesByTicket.get(Number(ticketId)) || [];
    let lastKey = "";
    messages.forEach((message) => {
      const key = dateKey(message.created_at);
      if (key && key !== lastKey) {
        appendDateDivider(formatDateLabel(message.created_at));
        lastKey = key;
      }
      appendMessageRow(message);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function loadMessages(ticketId, messages) {
    const list = Array.isArray(messages) ? messages : [];
    const set = new Set(list.map((m) => Number(m.message_id)).filter(Boolean));
    state.messagesByTicket.set(Number(ticketId), list);
    state.messageIdsByTicket.set(Number(ticketId), set);
  }

  async function refreshList() {
    try {
      const res = await emitWithAck("ticket:list");
      if (!res?.ok) {
        showError(res?.message || "Failed to load tickets");
        return;
      }
      state.tickets = res.tickets || [];
      sortTickets();
      const hasActive = state.activeTicketId && getTicket(state.activeTicketId);
      if (state.activeTicketId && !hasActive) {
        state.activeTicketId = null;
      }
      renderChatList();
      renderActiveHeader();

      if (hasActive) {
        openTicket(state.activeTicketId);
        return;
      }

      if (!state.activeTicketId && state.tickets.length) {
        openTicket(state.tickets[0].ticket_id);
      }
    } catch (e) {
      console.error("ticket:list error:", e);
      showError("Failed to load tickets");
    }
  }

  async function openTicket(ticketId) {
    try {
      const ticket = getTicket(ticketId);
      if (!ticket) return;
      state.activeTicketId = Number(ticketId);
      renderChatList();
      renderActiveHeader();

      const joinRes = await emitWithAck("ticket:join", { ticket_id: ticketId });
      if (!joinRes?.ok) {
        showError(joinRes?.message || "Join failed");
        return;
      }

      const historyRes = await emitWithAck("ticket:history", { ticket_id: ticketId, limit: 80 });
      if (!historyRes?.ok) {
        showError(historyRes?.message || "Failed to load history");
        return;
      }

      loadMessages(ticketId, historyRes.messages || []);
      renderMessages(ticketId);
    } catch (e) {
      console.error("openTicket error:", e);
      showError("Failed to open ticket");
    }
  }

  function applyMessage(message) {
    if (!message || !message.ticket_id) return;
    const ticketId = Number(message.ticket_id);
    if (!ticketId) return;

    const ticket = getTicket(ticketId);
    if (!ticket) {
      refreshList();
      return;
    }

    const set = state.messageIdsByTicket.get(ticketId) || new Set();
    const messageId = Number(message.message_id) || null;
    if (messageId && set.has(messageId)) return;

    if (messageId) set.add(messageId);
    const list = state.messagesByTicket.get(ticketId) || [];
    const prevMessage = list[list.length - 1];
    const prevKey = prevMessage ? dateKey(prevMessage.created_at) : "";
    list.push(message);

    state.messagesByTicket.set(ticketId, list);
    state.messageIdsByTicket.set(ticketId, set);

    ticket.last_message_at = message.created_at || new Date().toISOString();

    if (ticketId === state.activeTicketId) {
      const newKey = dateKey(message.created_at);
      if (newKey && newKey !== prevKey) {
        appendDateDivider(formatDateLabel(message.created_at));
      }
      appendMessageRow(message);
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    sortTickets();
    renderChatList();
    renderActiveHeader();
  }

  let typingTimeout = null;
  let typingActive = false;

  function emitTyping(eventName) {
    if (!state.activeTicketId) return;
    if (!socket.connected) return;
    socket.emit(eventName, { ticket_id: state.activeTicketId });
  }

  if (messageInputEl) {
    messageInputEl.addEventListener("input", () => {
      if (!state.activeTicketId) return;
      if (!typingActive) {
        typingActive = true;
        emitTyping("ticket:typing");
      }
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        typingActive = false;
        emitTyping("ticket:typing:stop");
      }, 800);
    });
  }

  async function sendMessage() {
    const body = messageInputEl?.value?.trim() || "";
    const hasFiles = state.pendingFiles.length > 0;
    if (!body && !hasFiles) return;
    if (!state.activeTicketId) {
      showError("Select a ticket");
      return;
    }

    messageInputEl.value = "";
    if (sendBtnEl) sendBtnEl.disabled = true;

    try {
      let attachments = [];
      if (hasFiles) {
        attachments = await uploadPendingAttachments();
        clearPendingAttachments();
      }

      const payload = {
        ticket_id: state.activeTicketId,
        body,
        attachments,
      };

      const res = await emitWithAck("ticket:send", payload);

      if (!res?.ok) {
        showError(res?.message || "Send failed");
        messageInputEl.value = body;
        if (sendBtnEl) sendBtnEl.disabled = false;
        return;
      }

      if (res.message) applyMessage(res.message);
    } catch (e) {
      console.error("sendMessage error:", e);
      showError("Send failed");
      messageInputEl.value = body;
    } finally {
      if (sendBtnEl) sendBtnEl.disabled = false;
    }
  }

  if (sendBtnEl) {
    sendBtnEl.addEventListener("click", sendMessage);
  }

  if (messageInputEl) {
    messageInputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      document.body.classList.toggle("light");
    });
  }

  if (backBtnEl) {
    backBtnEl.addEventListener("click", () => {
      window.history.back();
    });
  }

  if (attachBtnEl && fileInputEl) {
    attachBtnEl.addEventListener("click", (e) => {
      e.preventDefault();
      fileInputEl.click();
    });

    fileInputEl.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      state.pendingFiles = state.pendingFiles.concat(files);
      renderPendingAttachments();
      fileInputEl.value = "";
    });
  }

  if (searchInputEl) {
    searchInputEl.addEventListener("input", renderChatList);
  }

  socket.on("connect", async () => {
    try {
      const res = await emitWithAck("online", {
        user_id: me.user_id,
        user_type: me.user_type,
      });
      if (!res?.ok) {
        showError(res?.message || "Online failed");
        return;
      }
      await refreshList();
    } catch (e) {
      console.error("socket connect error:", e);
      showError("Socket error");
    }
  });

  socket.on("connect_error", (err) => {
    console.error("socket connect_error:", err);
    showError("Socket connection failed");
  });

  socket.on("ticket:message", (payload) => {
    try {
      applyMessage(payload);
    } catch (e) {
      console.error("ticket:message handler error:", e);
    }
  });

  socket.on("ticket:typing", (payload) => {
    try {
      if (!payload) return;
      if (
        payload.user_type === me.user_type &&
        Number(payload.user_id) === Number(me.user_id)
      ) {
        return;
      }
      const ticketId = Number(payload.ticket_id);
      if (!ticketId) return;

      const existing = state.typingTimers.get(ticketId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        state.typingTimers.delete(ticketId);
        if (ticketId === state.activeTicketId) renderActiveHeader();
      }, 1500);

      state.typingTimers.set(ticketId, timer);
      if (ticketId === state.activeTicketId) renderActiveHeader();
    } catch (e) {
      console.error("ticket:typing handler error:", e);
    }
  });

  socket.on("ticket:typing:stop", (payload) => {
    try {
      if (!payload) return;
      const ticketId = Number(payload.ticket_id);
      if (!ticketId) return;
      const timer = state.typingTimers.get(ticketId);
      if (timer) clearTimeout(timer);
      state.typingTimers.delete(ticketId);
      if (ticketId === state.activeTicketId) renderActiveHeader();
    } catch (e) {
      console.error("ticket:typing:stop handler error:", e);
    }
  });

  socket.on("ticket:update", (payload) => {
    const ticketId = Number(payload?.ticket_id);
    if (!ticketId) return;
    const ticket = getTicket(ticketId);
    if (!ticket) {
      refreshList();
      return;
    }
    if (payload?.last_message_at) ticket.last_message_at = payload.last_message_at;
    if (payload?.status) ticket.status = payload.status;
    if (payload?.priority) ticket.priority = payload.priority;
    sortTickets();
    renderChatList();
    if (ticketId === state.activeTicketId) renderActiveHeader();
  });

  socket.on("ticket:assigned", (payload) => {
    const ticketId = Number(payload?.ticket_id);
    if (!ticketId) return;
    refreshList();
  });
})();
