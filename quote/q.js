/* Shared by the quote page and the quote builder */
var RA = (function () {
  var ITEMS = [
    ["Desktop study of recent planning approvals near your home", 1],
    ["Written design brief", 1],
    ["Site measurement survey", 1],
    ["Existing drawings (plans, sections and elevations)", 1],
    ["Proposed drawings (plans, sections and elevations)", 1],
    ["3D model and photo-real rendered images of the proposals", 1],
    ["Construction details", 1],
    ["Construction specification", 1],
    ["Details suitable for a Thames Water Build Over Agreement", 1],
    ["Unlimited free revisions up to planning submission, within the design brief written at the survey", 1],
    ["Ordnance Survey map", 1],
    ["CIL forms", 1],
    ["Submission of the planning application (application fees are not included)", 1],
    ["Submission of the Building Regulations application (application fees are not included)", 1],
    ["Submission of the Thames Water Build Over Agreement (application fees are not included)", 1],
    ["Follow-up and tracking of application progress", 1],
    ["Liaison with the council throughout the process", 1],
    ["Liaison with the Party Wall Surveyor", 1],
    ["A quotation for structural calculations following the approved design", 1],
    ["Introductions to local building companies", 1],
    ["Credit card payments accepted at no extra cost. Klarna available", 1],
    ["Planning guarantee: if planning is refused, I redraft and resubmit at no extra fee, or refund 50% of my fee", 1]
  ];
  var HOUR = 3600000, DAY = 24 * HOUR;
  /* Extra dates when the discount is offered again, e.g. bank-holiday promotions.
     Each entry: [first day, last day] as YYYY-MM-DD (inclusive, UK time on the visitor's device). */
  var PROMOS = [];

  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function hash(parts) {
    var s = parts.concat(["ra-7h2k"]).join("|"), h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  /* All checksum layouts ever issued, newest first, so older quote links keep working. */
  function sums(q) {
    var base = [q.n, q.a, q.p, q.f, q.s, (q.i || []).join("."), q.d, q.r], c = [q.c1 || "", q.c2 || ""], b = (q.b || []).join("~");
    return [hash(base.concat(c, [b])), hash(base.concat(c)), hash(base)];
  }
  function encode(q) { q.k = sums(q)[0]; return b64e(JSON.stringify(q)); }
  /* Offer windows can be added to the end of any quote link as ".o<start>-<end>-<check>" (times in minutes since 1970).
     They reopen the discount without changing the quote itself. */
  function windowCode(startMs, endMs) {
    var a = Math.floor(startMs / 60000).toString(36), b = Math.ceil(endMs / 60000).toString(36);
    return ".o" + a + "-" + b + "-" + hash(["win", a, b]);
  }
  function readWindows(parts) {
    var out = [];
    parts.forEach(function (x) {
      var m = /^o([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)$/.exec(x);
      if (m && hash(["win", m[1], m[2]]) === m[3]) out.push([parseInt(m[1], 36) * 60000, parseInt(m[2], 36) * 60000]);
    });
    return out;
  }
  function decode(str) {
    try { str = decodeURIComponent(str.trim()); } catch (e) {}
    try {
      var parts = str.split("."), q = JSON.parse(b64d(parts[0].replace(/[^A-Za-z0-9_-]/g, "")));
      if (!q || sums(q).indexOf(q.k) < 0) return null;
      q._own = !!q.d; q._w = readWindows(parts.slice(1)); if (q._w.length && !q.d) q.d = 25;
      q._words = parts.slice(1).filter(function (x) { return /^[A-Za-z][A-Za-z0-9]{2,23}$/.test(x) && !/^o[0-9a-z]+-/.test(x); }).map(function (x) { return x.toUpperCase(); });
      return q;
    } catch (e) { return null; }
  }
  function money(v) {
    var whole = Math.abs(v - Math.round(v)) < 0.005;
    return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
  }
  /* Returns the time the current discount window closes, or 0 if no discount applies now. */
  function offer(q, now) {
    if (!q.d) return null;
    var t = now - q.s, w = (q._w || []).concat(PROMOS.map(function (p) { return [new Date(p[0] + "T00:00:00").getTime(), new Date(p[1] + "T23:59:59").getTime()]; })), best = null;
    if (q._own !== false) {
      if (t >= 0 && t <= 24.25 * HOUR) best = { ends: q.s + 24.25 * HOUR, short: true };                               /* first 24 hours, plus 15 minutes' grace */
      else if (t >= 6 * DAY + 12 * HOUR && t <= 7 * DAY + 20 * HOUR) best = { ends: q.s + 7 * DAY + 20 * HOUR, short: true }; /* reopened a week later */
    }
    w.forEach(function (x) { if (now >= x[0] && now <= x[1] && (!best || x[1] > best.ends)) best = { ends: x[1], short: x[1] - x[0] <= 26 * HOUR }; });
    return best;
  }
  function offerEnds(q, now) { var o = offer(q, now); return o ? o.ends : 0; }
  function expired(q, now) { return now - q.s > 30 * DAY && !offerEnds(q, now); }
  function when(ms) {
    return new Date(ms).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true });
  }
  function day(ms) { return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  /* Google Sheet connection (Apps Script web app). Leave "" to run without it. */
  var API = "https://script.google.com/macros/s/AKfycbwJnTTSvvtFDtPIGp8PMDeTUCUwORV4ctNYPWNvFAXuqFKCEemJhoI7a5UWOKaYO4js5w/exec";
  function api(payload) {
    if (!API) return Promise.reject(new Error("no-api"));
    return fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" }).then(function (r) { return r.json(); });
  }
  /* Stripe publishable key (public by design). Used to show Klarna's own approved instalment message. */
  var PK = "pk_live_51UPQVHE9nTIfeUjZNHQADpusEadG8BFKLI6sBxgsvy3dKeMJmtFLtC2pICG0Rk4AUyJW9YlpyHdz3ucdS7ESg6Un0002acZCrr";
  function stripeJs() {
    return new Promise(function (ok, no) {
      if (window.Stripe) return ok();
      var s = document.createElement("script"); s.src = "https://js.stripe.com/v3/"; s.onload = function () { ok(); }; s.onerror = no; document.head.appendChild(s);
    });
  }
  /* Mounts Klarna's message for an amount in pounds. The wording comes from Klarna through Stripe and must not be rewritten here. */
  function klarna(el, pounds) {
    if (!PK || location.protocol !== "https:" || !el) return Promise.resolve(null);
    return stripeJs().then(function () {
      var e = window.Stripe(PK).elements({ appearance: { variables: { colorText: "#1F1E26", fontSizeBase: "15px" } } })
        .create("paymentMethodMessaging", { amount: Math.round(pounds * 100), currency: "GBP", countryCode: "GB", paymentMethodTypes: ["klarna"] });
      e.mount(el); return e;
    }).catch(function () { return null; });
  }
  function pass() { try { return localStorage.getItem("ra-pass") || ""; } catch (e) { return ""; } }
  return { klarna: klarna, stripeJs: stripeJs, api: api, pass: pass, hasApi: !!API, ITEMS: ITEMS, encode: encode, decode: decode, offer: offer, windowCode: windowCode, money: money, offerEnds: offerEnds, expired: expired, when: when, day: day, DAY: DAY };
})();
