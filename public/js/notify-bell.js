(function () {
  const ctx = window.NOTIFY_CONTEXT || {};
  const badgeEl = document.getElementById("notifyBellCount");
  if (!badgeEl || !ctx.user_id || !ctx.user_type) return;

  function setBadge(count) {
    const safe = Math.max(0, Number(count) || 0);
    badgeEl.dataset.count = String(safe);
    if (safe <= 0) {
      badgeEl.setAttribute("hidden", "hidden");
      badgeEl.textContent = "";
      return;
    }
    badgeEl.removeAttribute("hidden");
    badgeEl.textContent = safe > 99 ? "99+" : String(safe);
  }

  let socket = window.__ELAW_SOCKET__;
  if (!socket && typeof io === "function") {
    socket = io();
    window.__ELAW_SOCKET__ = socket;
  }
  if (!socket) return;

  function emitWithAck(event, payload, timeoutMs = 8000) {
    if (!socket.connected) {
      return Promise.resolve({ ok: false, message: "socket disconnected" });
    }
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        resolve({ ok: false, message: "timeout" });
      }, timeoutMs);

      socket.emit(event, payload, (res) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(res || { ok: true });
      });
    });
  }

  socket.on("connect", async () => {
    try {
      await emitWithAck("online", {
        user_id: ctx.user_id,
        user_type: ctx.user_type,
      });
      const res = await emitWithAck("notify:count");
      if (res?.ok) setBadge(res.count);
    } catch (e) {
      console.error("notify bell connect error:", e);
    }
  });

  if (socket.connected) {
    socket.emit("online", { user_id: ctx.user_id, user_type: ctx.user_type }, () => {});
    emitWithAck("notify:count").then((res) => {
      if (res?.ok) setBadge(res.count);
    }).catch(() => {});
  }

  socket.on("notify:new", (payload) => {
    try {
      const current = Number(badgeEl.dataset.count || 0);
      setBadge(current + 1);
      if (payload?.title && window.kilToast) {
        kilToast.info(payload.title);
      }
    } catch (e) {
      console.error("notify:new error:", e);
    }
  });
})();
