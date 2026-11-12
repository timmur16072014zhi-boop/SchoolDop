const C='ss-v7',F=['/','/style.css','/app.js','/config.js','/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});
/* push-повідомлення */
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};
e.waitUntil(self.registration.showNotification(d.title||'SchoolDop',{body:d.body||'',icon:'icon.svg',badge:'icon.svg',data:{url:d.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();
e.waitUntil(clients.matchAll({type:'window'}).then(cs=>cs[0]?cs[0].focus():clients.openWindow(e.notification.data.url)))});
