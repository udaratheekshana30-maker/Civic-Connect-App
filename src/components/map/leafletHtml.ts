// HTML page that runs Leaflet + OpenStreetMap tiles inside react-native-webview.
// Free, no API key. RN → map: window.cc.* via injectJavaScript.
// Map → RN: window.ReactNativeWebView.postMessage(JSON).
// OSM tile policy: attribution is shown, and the WebView sends an app
// User-Agent + Referer (see OSMMap.tsx). https://operations.osmfoundation.org/policies/tiles/

export const leafletHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EEF2EA; }
  .leaflet-control-attribution { font-size: 11px; }
  .cc-pin { position: relative; width: 34px; height: 44px; }
  .cc-pin svg { filter: drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
  .cc-pin.active { transform: scale(1.25); transform-origin: bottom center; z-index: 1000 !important; }
  .cc-user { width: 18px; height: 18px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,.2); }
  #centerPin { position: absolute; left: 50%; top: 50%; z-index: 600; pointer-events: none; display: none; transform: translate(-50%, -100%); transition: transform .2s ease-out; }
  #centerPin.lift { transform: translate(-50%, calc(-100% - 12px)); }
  #centerShadow { position: absolute; left: 50%; top: 50%; z-index: 599; width: 14px; height: 6px; margin-left: -7px; margin-top: -3px; border-radius: 50%; background: rgba(0,0,0,.25); display: none; pointer-events: none; }
  #err { display:none; position:absolute; inset:0; align-items:center; justify-content:center; font: 15px sans-serif; color:#6B7280; text-align:center; padding: 24px; }
</style>
</head>
<body>
<div id="map"></div>
<div id="centerShadow"></div>
<div id="centerPin">
  <svg width="44" height="56" viewBox="0 0 24 30"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 30 12 30s12-9.6 12-18.3C24 5.2 18.6 0 12 0z" fill="#DC2626"/><circle cx="12" cy="11.5" r="4.5" fill="#fff"/></svg>
</div>
<div id="err">Map could not load. Check your internet connection.</div>
<script>
(function () {
  function send(msg) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  if (typeof L === 'undefined') { document.getElementById('err').style.display = 'flex'; send({ type: 'error', message: 'leaflet-not-loaded' }); return; }

  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([6.9344, 79.8428], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  map.attributionControl.setPrefix(false);

  var markers = {};
  var markerLayer = L.layerGroup().addTo(map);
  var userMarker = null;
  var pickMode = false;
  var activeId = null;

  function pinSvg(color) {
    return '<svg width="34" height="44" viewBox="0 0 24 30"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 30 12 30s12-9.6 12-18.3C24 5.2 18.6 0 12 0z" fill="' + color + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="11.5" r="4" fill="#fff"/></svg>';
  }
  function icon(m, active) {
    return L.divIcon({ className: '', html: '<div class="cc-pin' + (active ? ' active' : '') + '">' + pinSvg(m.color) + '</div>', iconSize: [34, 44], iconAnchor: [17, 44] });
  }

  window.cc = {
    setMarkers: function (list) {
      markerLayer.clearLayers(); markers = {};
      list.forEach(function (m) {
        var mk = L.marker([m.lat, m.lng], { icon: icon(m, m.id === activeId), title: m.label, keyboard: false, zIndexOffset: m.id === activeId ? 1000 : 0 });
        mk.on('click', function () { send({ type: 'markerPress', id: m.id }); });
        mk._cc = m;
        mk.addTo(markerLayer);
        markers[m.id] = mk;
      });
    },
    setActive: function (id) {
      activeId = id;
      Object.keys(markers).forEach(function (k) {
        var mk = markers[k];
        mk.setIcon(icon(mk._cc, k === id));
        mk.setZIndexOffset(k === id ? 1000 : 0);
      });
    },
    setView: function (lat, lng, zoom, animate) {
      if (animate) map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 0.6 });
      else map.setView([lat, lng], zoom || map.getZoom());
    },
    fitTo: function (points, maxZoom) {
      if (!points.length) return;
      if (points.length === 1) { map.setView([points[0].lat, points[0].lng], maxZoom || 16); return; }
      map.fitBounds(points.map(function (p) { return [p.lat, p.lng]; }), { padding: [40, 40], maxZoom: maxZoom || 16 });
    },
    setUser: function (lat, lng) {
      if (lat == null) { if (userMarker) { map.removeLayer(userMarker); userMarker = null; } return; }
      var ll = [lat, lng];
      if (!userMarker) userMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="cc-user"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, keyboard: false }).addTo(map);
      else userMarker.setLatLng(ll);
    },
    setPickMode: function (on) {
      pickMode = on;
      document.getElementById('centerPin').style.display = on ? 'block' : 'none';
      document.getElementById('centerShadow').style.display = on ? 'block' : 'none';
    },
    setInteractive: function (on) {
      var fns = ['dragging', 'touchZoom', 'doubleClickZoom', 'scrollWheelZoom', 'boxZoom', 'keyboard'];
      fns.forEach(function (f) { if (map[f]) { on ? map[f].enable() : map[f].disable(); } });
      if (map.tap) { on ? map.tap.enable() : map.tap.disable(); }
    }
  };

  map.on('movestart', function () { if (pickMode) document.getElementById('centerPin').classList.add('lift'); });
  map.on('moveend', function () {
    var c = map.getCenter();
    if (pickMode) document.getElementById('centerPin').classList.remove('lift');
    send({ type: 'moveEnd', lat: c.lat, lng: c.lng, zoom: map.getZoom(), user: !!map._ccUserMove });
    map._ccUserMove = false;
  });
  map.on('dragstart zoomstart', function () { map._ccUserMove = true; });
  map.on('click', function () { send({ type: 'mapPress' }); });

  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
