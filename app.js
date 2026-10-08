const KEY = "listpad:v1";
let T = null,
  lists = [],
  view = "gallery",
  tab = "active",
  cur = null,
  modal = false;
try {
  lists = JSON.parse(localStorage.getItem(KEY) || "[]");
} catch (e) {
  lists = [];
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(lists));
  } catch (e) {}
};
const esc = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const $ = (s) => document.querySelector(s);
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* helpers */
function clean(n) {
  let o = "";
  n.childNodes.forEach((c) => {
    if (c.nodeType === 3) o += esc(c.textContent);
    else if (c.nodeType === 1 && c.tagName !== "BR") {
      const t = c.tagName,
        i = clean(c);
      o +=
        t === "B" || t === "STRONG" || /bold|[6-9]00/.test(c.style.fontWeight)
          ? i
            ? "<b>" + i + "</b>"
            : ""
          : i;
    }
  });
  return o;
}
function parse(root) {
  const it = [];
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.textContent.trim();
      if (t) it.push({ k: "text", h: esc(t) });
    } else if (n.tagName === "UL" || n.tagName === "OL")
      n.querySelectorAll("li").forEach((li) => {
        const h = clean(li);
        if (h.trim()) it.push({ k: "bullet", h });
      });
    else if (n.nodeType === 1) {
      const h = clean(n);
      if (h.trim())
        it.push({ k: n.dataset.t === "check" ? "check" : "text", h, d: false });
    }
  });
  return it;
}
function toEd(items) {
  let o = "",
    ul = false;
  items.forEach((i) => {
    if (i.k === "bullet") {
      if (!ul) {
        o += "<ul>";
        ul = true;
      }
      o += "<li>" + i.h + "</li>";
    } else {
      if (ul) {
        o += "</ul>";
        ul = false;
      }
      o +=
        "<div" +
        (i.k === "check" ? ' data-t="check"' : "") +
        ">" +
        i.h +
        "</div>";
    }
  });
  if (ul) o += "</ul>";
  return o || "<div><br></div>";
}
const plain = (h) =>
  h
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const checks = (l) => l.items.filter((i) => i.k === "check");
const prog = (l) => {
  const c = checks(l);
  return [c.filter((i) => i.d).length, c.length];
};

/* theme */
const TK = "listpad:theme",
  dm = matchMedia("(prefers-color-scheme: dark)"),
  root = document.documentElement;
try {
  const t = localStorage.getItem(TK);
  if (t) root.dataset.theme = t;
} catch (e) {}
const eff = () => root.dataset.theme || (dm.matches ? "dark" : "light");
const meta = () => {
  const m = document.querySelector("meta[name=theme-color]");
  if (m) m.content = eff() === "dark" ? "#0A111D" : "#C6DBF0";
};
meta();
const MOON = '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
  SUN =
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const themeBtn = () => {
  const d = eff() === "dark",
    l = d ? T.ui.switchToLight : T.ui.switchToDark;
  return `<button class="help" data-theme-toggle aria-label="${l}" title="${l}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d ? SUN : MOON}</svg></button>`;
};
try {
  dm.addEventListener("change", () => {
    if (!root.dataset.theme) {
      meta();
      render();
    }
  });
} catch (e) {}
/* onboarding */
const SV = (b) =>
  `<svg viewBox="0 0 240 180" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
let OB = [];
let obStep = null;
try {
  if (!localStorage.getItem("listpad:ob")) obStep = 0;
} catch (e) {
  obStep = 0;
}
function endOb() {
  obStep = null;
  try {
    localStorage.setItem("listpad:ob", "1");
  } catch (e) {}
  ob();
}
function ob() {
  const el = $("#ob");
  if (obStep === null) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  const st = OB[obStep],
    last = obStep === OB.length - 1;
  el.hidden = false;
  el.innerHTML = `<div class="obp" role="dialog" aria-modal="true" aria-labelledby="obt"><div class="obt"><span class="logo">${T.app.name}</span><button class="skip" data-ob-skip aria-label="${T.ui.skipIntro}" title="${T.ui.skipTitle}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="obi">${SV(st.svg)}</div><div><h2 id="obt">${st.title}</h2><p>${st.text}</p></div><div class="dots" aria-label="${fmt(T.ui.stepOf, { n: obStep + 1, total: OB.length })}">${OB.map((_, i) => `<i class="${i === obStep ? "on" : ""}"></i>`).join("")}</div><div class="obb">${obStep ? `<button class="btn" data-ob-back>${T.ui.back}</button>` : ""}<button class="gs" data-ob-next>${last ? T.ui.getStarted : T.ui.next}</button></div></div>`;
  el.querySelector("[data-ob-next]").focus();
}
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && obStep !== null) endOb();
});

/* views */
function render() {
  if (!T) return;
  const app = $("#app");
  if (view === "edit") editor(app);
  else gallery(app);
}
const IC = {
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  undo: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>',
};
const ib = (k, attr, label) =>
  `<button class="ib" ${attr} title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></button>`;
function gallery(app) {
  const act = lists.filter((l) => l.s !== "resolved"),
    res = lists.filter((l) => l.s === "resolved"),
    show = tab === "active" ? act : res;
  const strips = show
    .map((l) => {
      const [d, t] = prog(l);
      const n = lists.indexOf(l) % 5,
        op = l.id === cur;
      const row = ([x, i]) =>
        x.k === "check"
          ? `<button class="item" role="checkbox" aria-checked="${x.d}" data-l="${l.id}" data-tick="${i}"><span class="box">${x.d ? "✓" : ""}</span><span class="tx">${x.h}</span></button>`
          : `<div class="plain"><span>${x.k === "bullet" ? "•" : ""}</span><span>${x.h}</span></div>`;
      const all = l.items.map((x, i) => [x, i]),
        isD = ([x]) => x.k === "check" && x.d,
        todo = all.filter((z) => !isD(z)),
        done = all.filter(isD);
      return `<section class="strip ${op ? "open" : ""}" data-id="${l.id}" style="background:var(--c${n})">
  <div class="head" data-open="${l.id}"><button class="tg" data-open="${l.id}" aria-expanded="${op}"><span class="ttl">${esc(l.t || T.ui.untitled)}</span></button><div class="hb">${l.s === "resolved" ? ib("undo", `data-restore="${l.id}"`, T.ui.restore) : ib("edit", `data-edit="${l.id}"`, T.ui.editList)}${ib("del", `data-del="${l.id}"`, T.ui.deleteList)}</div>${t ? `<span class="cnt">${d}/${t}</span>` : ""}</div>
  <div class="body"><div class="in"><div class="todo">${todo.map(row).join("")}</div>${done.length ? `<div class="donebox">${done.map(row).join("")}</div>` : ""}</div></div></section>`;
    })
    .join("");
  app.innerHTML = `<div class="top"><div class="tt"><h1>${T.app.name}</h1><time class="dt" datetime="${dayKey()}">${dayLabel()}</time></div><div class="tb">${themeBtn()}<button class="help" data-help aria-label="${T.ui.help}" title="${T.ui.help}">?</button></div></div>
 <div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="${tab === "active"}" data-tab="active">${T.ui.tabActive} (${act.length})</button><button class="tab" role="tab" aria-selected="${tab === "resolved"}" data-tab="resolved">${T.ui.tabResolved} (${res.length})</button></div>
 ${show.length ? `<div class="stack ${show.some((l) => l.id === cur) ? "has-open" : ""}">${strips}</div>` : `<div class="empty">${tab === "active" ? T.ui.emptyActive : T.ui.emptyResolved}</div>`}
 <button class="fab" data-new aria-label="${T.ui.newList}" title="${T.ui.newList}"><span class="pl">+</span><span class="lb">${T.ui.newList}</span></button>
 ${modal ? `<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="modal"><h2 id="mt">${T.ui.doneTitle}</h2><p>${T.ui.doneText}</p><div class="acts"><button class="btn" data-repeat>${T.ui.repeat}</button><button class="btn p" data-resolve>${T.ui.resolve}</button></div></div></div>` : ""}`;
  requestAnimationFrame(fit);
}
function fit() {
  const st = document.querySelector(".stack");
  if (!st) return;
  const mx = Math.max(200, st.clientWidth - 8 - 58 - 2);
  st.querySelectorAll(".strip").forEach((z) => {
    const n = z.querySelector(".in");
    n.style.width = "max-content";
    n.style.maxWidth = mx + "px";
    const w = Math.ceil(n.getBoundingClientRect().width);
    n.style.width = "";
    n.style.maxWidth = "";
    z.style.setProperty("--sw", Math.min(mx, Math.max(240, w)) + "px");
    const d = z.querySelector(".donebox");
    z.style.setProperty("--fill", d ? d.offsetHeight + "px" : "0px");
  });
}
addEventListener("resize", fit);
try {
  document.fonts.ready.then(fit);
} catch (e) {}
function editor(app) {
  const l = cur ? lists.find((x) => x.id === cur) : null;
  app.innerHTML = `<div class="top"><button class="btn" data-cancel>${T.ui.back}</button><button class="btn p" data-done>${T.ui.save}</button></div>
 <div class="sheet"><input class="title" id="ttl" placeholder="${T.ui.titlePlaceholder}" maxlength="80" value="${l ? esc(l.t) : ""}">
 <div class="tools"><button data-cmd="bold" title="${T.ui.bold}" aria-label="${T.ui.bold}"><b>B</b></button><button data-cmd="check" title="${T.ui.checkbox}" aria-label="${T.ui.checkbox}">☑</button><button data-cmd="list" title="${T.ui.bullets}" aria-label="${T.ui.bullets}">•≡</button></div>
 <div class="ed" id="ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${T.ui.editorLabel}" data-ph>${l ? toEd(l.items) : "<div><br></div>"}</div></div>`;
  try {
    document.execCommand("defaultParagraphSeparator", false, "div");
  } catch (e) {}
  $("#ed").focus();
}
/* editor commands */
function blockOf() {
  const ed = $("#ed"),
    s = getSelection();
  if (!s.rangeCount) return null;
  let n = s.anchorNode;
  if (!ed.contains(n)) return null;
  while (n && n.parentNode !== ed) n = n.parentNode;
  return n;
}
function cmd(c) {
  const ed = $("#ed");
  ed.focus();
  if (c === "bold") document.execCommand("bold");
  else if (c === "list") document.execCommand("insertUnorderedList");
  else {
    let b = blockOf();
    if (b && b.nodeType === 3) {
      document.execCommand("formatBlock", false, "div");
      b = blockOf();
    }
    if (b && b.tagName === "DIV") {
      b.dataset.t = b.dataset.t === "check" ? "" : "check";
      if (!b.dataset.t) b.removeAttribute("data-t");
    }
  }
}

/* events */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "ed") {
    const b = blockOf();
    if (b && b.dataset && b.dataset.t === "check") {
      e.preventDefault();
      if (!b.textContent.trim()) {
        b.removeAttribute("data-t");
        return;
      }
      const s = getSelection(),
        r = s.getRangeAt(0);
      if (!r.collapsed) r.deleteContents();
      const tail = document.createRange();
      tail.selectNodeContents(b);
      tail.setStart(r.endContainer, r.endOffset);
      const nb = document.createElement("div");
      nb.dataset.t = "check";
      nb.appendChild(tail.extractContents());
      if (!nb.textContent) nb.innerHTML = "<br>";
      if (!b.textContent) b.innerHTML = "<br>";
      b.after(nb);
      const nr = document.createRange();
      nr.setStart(nb, 0);
      nr.collapse(true);
      s.removeAllRanges();
      s.addRange(nr);
    }
  }
});
document.addEventListener("mousedown", (e) => {
  if (e.target.closest("[data-cmd]")) e.preventDefault();
});
document.addEventListener("click", (e) => {
  const g = (s) => e.target.closest(s);
  let x;
  if (g("[data-ob-next]")) {
    if (obStep >= OB.length - 1) endOb();
    else {
      obStep++;
      ob();
    }
  } else if (g("[data-ob-back]")) {
    obStep--;
    ob();
  } else if (g("[data-ob-skip]")) endOb();
  else if (g("[data-help]")) {
    obStep = 0;
    ob();
  } else if (g("[data-theme-toggle]")) {
    const n = eff() === "dark" ? "light" : "dark";
    root.dataset.theme = n;
    try {
      localStorage.setItem(TK, n);
    } catch (e) {}
    meta();
    render();
  } else if ((x = g("[data-tab]"))) {
    tab = x.dataset.tab;
    render();
  } else if (g("[data-new]")) {
    cur = null;
    view = "edit";
    render();
  } else if ((x = g("[data-open]")) && !g(".hb")) {
    const id = x.dataset.open,
      was = cur === id;
    cur = was ? null : id;
    document.querySelectorAll(".strip").forEach((z) => {
      const o = z.dataset.id === cur;
      z.classList.toggle("open", o);
      z.classList.toggle("shut", was && z === x.closest(".strip"));
      z.querySelector(".tg").setAttribute("aria-expanded", o);
    });
    $(".stack").classList.toggle("has-open", !!cur);
    if (cur)
      setTimeout(
        () =>
          x
            .closest(".strip")
            .scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            }),
        50,
      );
  } else if ((x = g("[data-cmd]"))) cmd(x.dataset.cmd);
  else if (g("[data-cancel]")) {
    view = "gallery";
    render();
  } else if (g("[data-done]")) {
    const items = parse($("#ed")),
      t = $("#ttl").value.trim();
    if (!items.length && !t) {
      view = "gallery";
      return render();
    }
    if (cur) {
      const l = lists.find((y) => y.id === cur);
      l.t = t;
      l.items = items;
      l.s = "active";
    } else {
      const l = { id: uid(), t, items, s: "active", n: 0 };
      lists.unshift(l);
      cur = l.id;
    }
    save();
    view = "gallery";
    tab = "active";
    render();
  } else if ((x = g("[data-edit]"))) {
    cur = x.dataset.edit;
    view = "edit";
    render();
  } else if ((x = g("[data-del]"))) {
    if (!x.classList.contains("armed")) {
      x.classList.add("armed");
      x.title = T.ui.deleteConfirm;
      x.setAttribute("aria-label", T.ui.deleteConfirm);
      setTimeout(() => {
        x.classList.remove("armed");
        x.title = T.ui.deleteList;
        x.setAttribute("aria-label", T.ui.deleteList);
      }, 3000);
      return;
    }
    lists = lists.filter((y) => y.id !== x.dataset.del);
    save();
    cur = null;
    render();
  } else if ((x = g("[data-tick]"))) {
    const l = lists.find((y) => y.id === x.dataset.l);
    cur = l.id;
    const it = l.items[+x.dataset.tick];
    it.d = !it.d;
    save();
    const [d, t] = prog(l);
    modal = t > 0 && d === t && l.s !== "resolved";
    render();
  } else if (g("[data-repeat]")) {
    const l = lists.find((y) => y.id === cur);
    l.items.forEach((i) => {
      if (i.k === "check") i.d = false;
    });
    l.n = (l.n || 0) + 1;
    save();
    modal = false;
    render();
  } else if (g("[data-resolve]")) {
    const l = lists.find((y) => y.id === cur);
    l.s = "resolved";
    save();
    modal = false;
    view = "gallery";
    tab = "resolved";
    cur = null;
    render();
  } else if ((x = g("[data-restore]"))) {
    const l = lists.find((y) => y.id === x.dataset.restore);
    l.s = "active";
    l.items.forEach((i) => {
      if (i.k === "check") i.d = false;
    });
    save();
    cur = null;
    render();
  }
});
document.addEventListener("mouseout", (e) => {
  const z = e.target.closest && e.target.closest(".strip.shut");
  if (z && !z.contains(e.relatedTarget)) z.classList.remove("shut");
});
document.addEventListener(
  "wheel",
  (e) => {
    const k = e.target.closest && e.target.closest(".stack");
    if (
      k &&
      !e.target.closest(".in") &&
      Math.abs(e.deltaY) > Math.abs(e.deltaX)
    )
      k.scrollLeft += e.deltaY;
  },
  { passive: true },
);
/* daily */
const dayKey = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
};
const dayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
let lastDay = null;
try {
  lastDay = localStorage.getItem("listpad:day");
} catch (e) {}
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    t.hidden = true;
  }, 6000);
}
function rollDay() {
  const k = dayKey();
  if (lastDay === k) return false;
  const first = !lastDay;
  lastDay = k;
  try {
    localStorage.setItem("listpad:day", k);
  } catch (e) {}
  let c = 0;
  if (!first)
    lists.forEach((l) => {
      if (l.s !== "resolved" && l.items.some((i) => i.k === "check" && i.d)) {
        l.items.forEach((i) => {
          if (i.k === "check") i.d = false;
        });
        l.n = (l.n || 0) + 1;
        c++;
      }
    });
  if (c) {
    modal = false;
    save();
    toast(c === 1 ? T.ui.resetOne : fmt(T.ui.resetMany, { n: c }));
  }
  return true;
}
const tick = () => {
  if (!T) return;
  if (rollDay() && view !== "edit") render();
};
setInterval(tick, 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick();
});
addEventListener("focus", tick);
/* boot: load copy from content.json, then start */
async function boot() {
  try {
    const r = await fetch("content.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    T = await r.json();
  } catch (e) {
    $("#app").innerHTML =
      '<p class="empty">Couldn’t load content.json. Open the app from a web server (for example GitHub Pages, or <code>python -m http.server</code>), not straight from the file.</p>';
    return;
  }
  OB = T.onboarding || [];
  if (!OB.length) obStep = null;
  rollDay();
  render();
  ob();
}
boot();
if ("serviceWorker" in navigator)
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
