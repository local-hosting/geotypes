/**
 * Geotypes map preview — esbuild entry (geokit + taxonomy YAML).
 */
import yaml from 'js-yaml';
import '@geokit/ui/ui/theme.css';
import { configure, MapTilerUIProvider, registerUIProvider, setUIProvider } from '@geokit/ui/ui';

const MAJOR_CITIES = [
  { latitude: 40.7128, longitude: -74.006 },
  { latitude: 34.0522, longitude: -118.2437 },
  { latitude: 41.8781, longitude: -87.6298 },
  { latitude: 29.7604, longitude: -95.3698 },
  { latitude: 39.9526, longitude: -75.1652 },
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 47.6062, longitude: -122.3321 },
  { latitude: 25.7617, longitude: -80.1918 },
  { latitude: 43.6532, longitude: -79.3832 },
];

/** @type {Array<Record<string, unknown>>} */
let taxonomy = [];

/** @type {Array<{ instanceId: string; row: Record<string, unknown>; geometry: Record<string, unknown> }>} */
let instances = [];

const els = {
  map: /** @type {HTMLElement & { setBounds?: Function; flyTo?: Function } | null} */ (null),
  hint: /** @type {HTMLElement | null} */ (null),
  list: /** @type {HTMLElement | null} */ (null),
  items: /** @type {HTMLElement | null} */ (null),
  statFeatures: /** @type {HTMLElement | null} */ (null),
  statTaxonomy: /** @type {HTMLElement | null} */ (null),
  btnExport: /** @type {HTMLButtonElement | null} */ (null),
};

function randomId() {
  return Math.random().toString(36).slice(2, 6);
}

function randomLocation() {
  const city = MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
  return {
    latitude: city.latitude + (Math.random() - 0.5) * 2,
    longitude: city.longitude + (Math.random() - 0.5) * 2,
  };
}

/** @param {string} geometryType */
function buildGeometry(geometryType) {
  if (geometryType === 'linestring') {
    const start = randomLocation();
    const end = randomLocation();
    return {
      type: 'linestring',
      coordinates: [start, end],
    };
  }

  if (geometryType === 'polygon') {
    const center = randomLocation();
    const size = 0.01;
    const ring = [
      { latitude: center.latitude - size, longitude: center.longitude - size },
      { latitude: center.latitude - size, longitude: center.longitude + size },
      { latitude: center.latitude + size, longitude: center.longitude + size },
      { latitude: center.latitude + size, longitude: center.longitude - size },
      { latitude: center.latitude - size, longitude: center.longitude - size },
    ];
    return { type: 'polygon', ring };
  }

  return { type: 'point', coordinates: randomLocation() };
}

async function loadTaxonomy() {
  const res = await fetch('/data/features.yml');
  if (!res.ok) throw new Error(`Failed to load taxonomy (${res.status})`);
  const text = await res.text();
  const data = yaml.load(text);
  taxonomy = Array.isArray(data) ? data : data?.features;
  if (!Array.isArray(taxonomy)) throw new Error('features.yml must be a list');
  if (els.statTaxonomy) els.statTaxonomy.textContent = String(taxonomy.length);
}

function addRandomFeature() {
  if (!taxonomy.length) return;
  const row = taxonomy[Math.floor(Math.random() * taxonomy.length)];
  const geometryType = String(row.geometry_type || 'point');
  instances.push({
    instanceId: randomId(),
    row,
    geometry: buildGeometry(geometryType),
  });
  renderInstances();
}

function removeFeature(instanceId) {
  instances = instances.filter(item => item.instanceId !== instanceId);
  renderInstances();
}

function clearAll() {
  instances = [];
  renderInstances();
}

function latLngPairsFromGeometry(geometry) {
  if (geometry.type === 'point') {
    return [[geometry.coordinates.latitude, geometry.coordinates.longitude]];
  }
  if (geometry.type === 'linestring') {
    return geometry.coordinates.map(c => [c.latitude, c.longitude]);
  }
  return geometry.ring.map(c => [c.latitude, c.longitude]);
}

function boundsForGeometry(geometry) {
  const pairs = latLngPairsFromGeometry(geometry);
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lat, lng] of pairs) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  if (geometry.type === 'point') {
    const pad = 0.05;
    return [minLng - pad, minLat - pad, maxLng + pad, maxLat + pad];
  }
  return [minLng, minLat, maxLng, maxLat];
}

function centerOn(instanceId) {
  const item = instances.find(entry => entry.instanceId === instanceId);
  const mapEl = els.map;
  if (!item || !mapEl?.setBounds) return;
  void mapEl.setBounds(boundsForGeometry(item.geometry), { padding: 80, maxZoom: 6 });
}

function syncMapLayers() {
  const mapEl = els.map;
  if (!mapEl) return;

  mapEl.querySelectorAll('gk-point, gk-polyline, gk-polygon').forEach(node => node.remove());

  for (const { instanceId, row, geometry } of instances) {
    const name = String(row.name || instanceId);

    if (geometry.type === 'point') {
      const point = document.createElement('gk-point');
      point.setAttribute('lat', String(geometry.coordinates.latitude));
      point.setAttribute('lng', String(geometry.coordinates.longitude));
      point.setAttribute('point-id', instanceId);
      point.setAttribute('point-name', name);
      point.setAttribute('color', '#2563eb');
      point.setAttribute('size', '8');
      mapEl.appendChild(point);
      continue;
    }

    const points = JSON.stringify(latLngPairsFromGeometry(geometry));

    if (geometry.type === 'linestring') {
      const line = document.createElement('gk-polyline');
      line.setAttribute('points', points);
      line.setAttribute('color', '#dc2626');
      line.setAttribute('width', '3');
      mapEl.appendChild(line);
      continue;
    }

    const polygon = document.createElement('gk-polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill-color', '#2563eb');
    polygon.setAttribute('stroke-color', '#1d4ed8');
    polygon.setAttribute('fill-opacity', '0.25');
    mapEl.appendChild(polygon);
  }
}

function renderList() {
  if (!els.list || !els.items) return;

  if (!instances.length) {
    els.list.hidden = true;
    els.items.replaceChildren();
    return;
  }

  els.list.hidden = false;
  els.items.replaceChildren(
    ...instances.map(({ instanceId, row, geometry }) => {
      const li = document.createElement('li');
      li.className = 'feature-item';
      li.innerHTML = `
        <button type="button" aria-label="Remove">✕</button>
        <strong>${row.name}</strong>
        <small>ID ${instanceId} · ${geometry.type}</small>
        <small>${row.category || '—'}</small>
      `;
      li.querySelector('button')?.addEventListener('click', event => {
        event.stopPropagation();
        removeFeature(instanceId);
      });
      li.addEventListener('click', () => centerOn(instanceId));
      return li;
    }),
  );
}

function renderInstances() {
  if (els.statFeatures) els.statFeatures.textContent = String(instances.length);
  if (els.btnExport) els.btnExport.disabled = instances.length === 0;
  syncMapLayers();
  renderList();
}

function exportYaml() {
  const rows = instances.map(({ instanceId, row, geometry }) => ({
    id: instanceId,
    name: row.name,
    geometry_type: geometry.type === 'point' ? 'point' : geometry.type,
    category: row.category,
    tags: row.tags,
    preview_geometry: geometry,
  }));
  const blob = new Blob([yaml.dump(rows)], { type: 'text/yaml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `geotypes-preview-${new Date().toISOString().slice(0, 10)}.yml`;
  link.click();
}

async function importYaml(text, merge) {
  const data = yaml.load(text);
  const rows = Array.isArray(data) ? data : data?.features;
  if (!Array.isArray(rows)) throw new Error('YAML must be a feature list');

  if (!merge) instances = [];

  for (const row of rows) {
    const geometryType = String(row.geometry_type || 'point');
    instances.push({
      instanceId: String(row.id || randomId()),
      row,
      geometry: row.preview_geometry || buildGeometry(geometryType),
    });
  }
  renderInstances();
}

async function initMap() {
  const key = window.__GEOTYPES__?.maptilerKey || '';
  if (!key) {
    if (els.hint) {
      els.hint.textContent = 'Set maptilerKey in _secrets.yml (see _secrets.example.yml)';
    }
    return;
  }

  configure({ maptiler: { apiKey: key } });
  registerUIProvider('maptiler', new MapTilerUIProvider());
  await setUIProvider('maptiler', { apiKey: key });

  if (els.hint) els.hint.hidden = true;
}

function bindUi() {
  document.getElementById('btn-add')?.addEventListener('click', addRandomFeature);
  document.getElementById('btn-clear')?.addEventListener('click', clearAll);
  document.getElementById('btn-export')?.addEventListener('click', exportYaml);

  document.getElementById('file-import')?.addEventListener('change', async event => {
    const input = /** @type {HTMLInputElement} */ (event.target);
    const file = input.files?.[0];
    if (!file) return;
    try {
      const merge = confirm('Merge with existing features? (Cancel to replace)');
      await importYaml(await file.text(), merge);
    } catch (error) {
      alert(String(error));
    } finally {
      input.value = '';
    }
  });
}

async function main() {
  els.map = document.getElementById('map');
  els.hint = document.getElementById('map-hint');
  els.list = document.getElementById('feature-list');
  els.items = document.getElementById('feature-items');
  els.statFeatures = document.getElementById('stat-features');
  els.statTaxonomy = document.getElementById('stat-taxonomy');
  els.btnExport = /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-export'));

  bindUi();
  await loadTaxonomy();
  await initMap();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void main());
} else {
  void main();
}
