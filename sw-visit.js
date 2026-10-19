/* Keeps the home visit page and report preview working with no signal.
   Only touches the visit page, the report page and the shared quote script; everything else on the site is left alone. */
var CACHE = "ra-visit-v4";
var KEEP = ["/quote/visit/", "/report/", "/quote/q.js?v=41", "/img/visit-icon.png", "/report/policy.js?v=1"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(KEEP); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf("ra-visit-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  var path = u.pathname;
  var page = path === "/quote/visit/" || path === "/quote/visit/index.html" ? "/quote/visit/" : path === "/report/" || path === "/report/index.html" ? "/report/" : null;
  if (page) {
    /* Latest version when online, saved copy when not */
    e.respondWith(fetch(e.request).then(function (r) {
      if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(page, copy); }); }
      return r;
    }).catch(function () { return caches.match(page); }));
    return;
  }
  if (path === "/quote/q.js" || path === "/img/visit-icon.png" || path === "/report/policy.js") {
    e.respondWith(fetch(e.request).then(function (r) {
      if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return r;
    }).catch(function () { return caches.match(e.request); }));
  }
});
