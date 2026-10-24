// TKD Mate — دستیار تمرین تکواندو | نسخه استاتیک مناسب GitHub Pages
const DEFAULT_URL = "https://api.metisai.ir/deepseek/v1";
const DEFAULT_MODEL = "deepseek-v4-flash";
const SYSTEM_MESSAGE = `تو «مربی هوشمند TKD Mate» هستی؛ یک دستیار تمرین تکواندو.
- بر اساس خلاصه جلسه‌های ثبت‌شده کاربر، پیشنهادهای عمومی و ایمن برای تمرین بعدی بده.
- دوز یا برنامه پزشکی تعیین نکن؛ اگر بحث آسیب یا درد شد، کاربر را به مربی و متخصص سلامت ارجاع بده.
- توصیه‌هایت کلی، ایمن و قابل اجرا باشد.
- فارسی روان، انگیزشی و کوتاه بنویس.`;

const $ = (id) => document.getElementById(id);
const safeGet = (key, fallback = "") => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
const safeRemove = (key) => { try { localStorage.removeItem(key); } catch {} };

// ===== API Settings (دقیقاً شبیه پروژه پالس) =====
$("baseUrl").value = safeGet("tkd_base_url", DEFAULT_URL);
$("modelName").value = safeGet("tkd_model", DEFAULT_MODEL);
$("apiKey").value = safeGet("tkd_api_key");

function setConnection(connected, message = "") {
  $("status").textContent = connected ? "کلید ثبت شده" : "قطع";
  $("status").classList.toggle("connected", connected);
  $("connectionMsg").textContent = message;
  $("connectionMsg").classList.toggle("error", !connected && !!message);
}
setConnection(!!$("apiKey").value);

$("toggleKey").addEventListener("click", () => $("apiKey").type = $("apiKey").type === "password" ? "text" : "password");

$("saveApi").addEventListener("click", () => {
  const key = $("apiKey").value.trim(), base = $("baseUrl").value.trim(), model = $("modelName").value.trim();
  if (!key) { setConnection(false, "لطفاً API Key را وارد کنید."); $("apiKey").focus(); return; }
  if (!base) { setConnection(false, "آدرس پایه API را وارد کنید."); return; }
  if (!model) { setConnection(false, "نام مدل را وارد کنید."); return; }
  const normalized = base.replace(/\/+$/, "");
  const ok = safeSet("tkd_api_key", key) && safeSet("tkd_base_url", normalized) && safeSet("tkd_model", model);
  setConnection(ok, ok ? "تنظیمات در همین مرورگر ذخیره شد. برای بررسی اتصال، یک سؤال ارسال کنید." : "ذخیره‌سازی مرورگر در دسترس نیست؛ کلید تا زمان بازبودن صفحه استفاده می‌شود.");
});

$("clearApi").addEventListener("click", () => {
  ["tkd_api_key", "tkd_base_url", "tkd_model"].forEach(safeRemove);
  $("apiKey").value = ""; $("baseUrl").value = DEFAULT_URL; $("modelName").value = DEFAULT_MODEL;
  setConnection(false, "کلید و تنظیمات ذخیره‌شده پاک شد.");
});

$("menuBtn").addEventListener("click", () => $("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a => a.addEventListener("click", () => $("nav").classList.remove("open")));

// ===== تمرین‌ها =====
const LOG_KEY = "tkd_logs";
let logs = [];
try { logs = JSON.parse(safeGet(LOG_KEY, "[]")); if (!Array.isArray(logs)) logs = []; } catch { logs = []; }

const persistLogs = () => safeSet(LOG_KEY, JSON.stringify(logs));
const faNumber = v => new Intl.NumberFormat("fa-IR").format(v);

function renderLogs() {
  const tbody = $("logRows");
  tbody.innerHTML = "";
  if (!logs.length) {
    const tr = document.createElement("tr"); tr.className = "empty-row";
    const td = document.createElement("td"); td.colSpan = 5;
    td.textContent = "هنوز جلسه‌ای ثبت نشده است. فرم ثبت تمرین را پر کنید.";
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    logs.slice().reverse().forEach((log, revIndex) => {
      const index = logs.length - 1 - revIndex;
      const tr = document.createElement("tr");
      const cells = [
        log.skill,
        `${faNumber(log.duration)} دقیقه`,
        `${faNumber(log.difficulty)} / ۵`,
        log.date || "—"
      ];
      cells.forEach(text => {
        const td = document.createElement("td"); td.textContent = text; tr.appendChild(td);
      });
      const action = document.createElement("td");
      const del = document.createElement("button");
      del.className = "delete-row"; del.textContent = "حذف";
      del.addEventListener("click", () => { logs.splice(index, 1); persistLogs(); renderLogs(); renderStats(); });
      action.appendChild(del); tr.appendChild(action); tbody.appendChild(tr);
    });
  }
  renderStats();
}

function renderStats() {
  const count = logs.length;
  const totalTime = logs.reduce((sum, l) => sum + Number(l.duration || 0), 0);
  const avg = count ? (logs.reduce((sum, l) => sum + Number(l.difficulty || 0), 0) / count) : 0;
  $("statCount").textContent = faNumber(count);
  $("statTime").textContent = faNumber(totalTime);
  $("statAvg").textContent = count ? avg.toFixed(1).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]) : "۰";
}

$("logForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const skill = $("skill").value.trim();
  const duration = Number($("duration").value);
  const difficulty = Number($("difficulty").value);
  const msg = $("logMsg");

  if (!skill) { msg.textContent = "نام مهارت را وارد کنید."; msg.classList.add("error"); return; }
  if (!duration || duration < 1 || duration > 600) { msg.textContent = "مدت تمرین باید بین ۱ تا ۶۰۰ دقیقه باشد."; msg.classList.add("error"); return; }
  if (!difficulty || difficulty < 1 || difficulty > 5) { msg.textContent = "سختی باید عددی بین ۱ تا ۵ باشد."; msg.classList.add("error"); return; }

  const now = new Date();
  logs.push({
    skill,
    duration,
    difficulty,
    date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  });
  persistLogs(); renderLogs();
  msg.textContent = "جلسه با موفقیت ثبت شد. 💪";
  msg.classList.remove("error");
  e.target.reset();
  setTimeout(() => { msg.textContent = ""; }, 3000);
});

$("clearLogs").addEventListener("click", () => {
  if (!logs.length) return;
  if (confirm("همه جلسه‌های ثبت‌شده پاک شوند؟")) {
    logs = []; persistLogs(); renderLogs();
  }
});

// ===== چت با هوش مصنوعی =====
const messages = $("chatMessages");
function addBubble(role, text, isError = false) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}${isError ? " error" : ""}`;
  const label = document.createElement("small");
  label.textContent = role === "user" ? "شما" : "مربی TKD Mate";
  bubble.appendChild(label);
  bubble.appendChild(document.createTextNode(text));
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function buildSummary() {
  if (!logs.length) return "هنوز هیچ جلسه‌ای ثبت نشده است.";
  const totalTime = logs.reduce((s, l) => s + Number(l.duration || 0), 0);
  const avg = (logs.reduce((s, l) => s + Number(l.difficulty || 0), 0) / logs.length).toFixed(1);
  const skills = logs.map(l => `${l.skill} (${l.duration} دقیقه، سختی ${l.difficulty})`).join("، ");
  return `تعداد جلسه‌ها: ${logs.length} | مجموع زمان: ${totalTime} دقیقه | میانگین سختی: ${avg}\nجلسه‌ها: ${skills}`;
}

async function askAI(question) {
  const apiKey = $("apiKey").value.trim() || safeGet("tkd_api_key");
  const baseUrl = ($("baseUrl").value.trim() || safeGet("tkd_base_url", DEFAULT_URL)).replace(/\/+$/, "");
  const model = $("modelName").value.trim() || safeGet("tkd_model", DEFAULT_MODEL);

  if (!apiKey) {
    addBubble("assistant", "برای استفاده از دستیار، ابتدا در بخش «اتصال به هوش مصنوعی» کلید API خود را وارد و ذخیره کنید.", true);
    document.querySelector("#connect").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const btn = $("sendBtn"); btn.disabled = true; btn.textContent = "…";
  const loading = addBubble("assistant", "دارم پاسخ را آماده می‌کنم…");

  try {
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
    const summary = buildSummary();
    const userContent = `خلاصه تمرین‌های من:\n${summary}\n\nسؤال من: ${question}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: userContent }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || `خطای HTTP ${response.status}`;
      throw new Error(detail);
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) throw new Error("پاسخ متنی از سرویس دریافت نشد. نام مدل و آدرس API را بررسی کنید.");

    loading.remove();
    addBubble("assistant", answer);
    setConnection(true, "پاسخ از API دریافت شد.");
  } catch (error) {
    loading.remove();
    let detail = error?.message || "خطای ناشناخته";
    if (detail.includes("Failed to fetch") || detail.includes("NetworkError"))
      detail = "اتصال برقرار نشد. آدرس API، اینترنت و اجازه CORS سرویس را بررسی کنید.";
    addBubble("assistant", `پاسخ دریافت نشد.\n${detail}\n\nتنظیمات API را بررسی کنید. کلید را در اختیار دیگران قرار ندهید.`, true);
    setConnection(false, "اتصال ناموفق بود؛ تنظیمات و دسترسی سرویس را بررسی کنید.");
  } finally {
    btn.disabled = false; btn.textContent = "↑";
  }
}

$("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("question").value.trim(); if (!q) return;
  addBubble("user", q);
  $("question").value = "";
  await askAI(q);
});

document.querySelectorAll(".suggestion").forEach(btn => {
  btn.addEventListener("click", () => {
    $("question").value = btn.textContent.trim();
    $("question").focus();
  });
});

$("clearChat").addEventListener("click", () => {
  messages.innerHTML = "";
  addBubble("assistant", "گفت‌وگوی تازه شروع شد. سؤالت را درباره تمرین بعدی بنویس؛ من خلاصه جلسه‌هایت را هم همراه سؤال می‌فرستم.");
});

// initial render
renderLogs();
