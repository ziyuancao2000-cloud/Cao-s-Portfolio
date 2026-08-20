import { memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import landTopology from 'world-atlas/land-110m.json';

const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const REGION_CLUSTER_RADIUS_KM = 80;
const CLUSTER_BREAK_ZOOM = 1.34;
const EXPANDED_MARKER_GAP = 22;

const landFeature = feature(landTopology, landTopology.objects.land);
const landGeometries = landFeature.type === 'FeatureCollection'
  ? landFeature.features.map((item) => item.geometry)
  : [landFeature.geometry];
const LAND_POLYGONS = landGeometries.flatMap((geometry) => (
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
));
const LAND_RINGS = LAND_POLYGONS.map((polygon) => polygon[0]).filter((ring) => ring.length > 4);

function project(lon, lat, yaw, pitch, radius, cx, cy) {
  const lambda = lon * DEG + yaw;
  const phi = lat * DEG;
  const x = Math.cos(phi) * Math.sin(lambda);
  const y0 = -Math.sin(phi);
  const z0 = Math.cos(phi) * Math.cos(lambda);
  const y = y0 * Math.cos(pitch) - z0 * Math.sin(pitch);
  const z = y0 * Math.sin(pitch) + z0 * Math.cos(pitch);
  return { x: cx + x * radius, y: cy + y * radius, z };
}

function drawGeoLine(ctx, points, state, stroke, width) {
  let drawing = false;
  ctx.beginPath();
  for (const [lon, lat] of points) {
    const p = project(lon, lat, ...state);
    if (p.z > 0.01) {
      if (!drawing) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
      drawing = true;
    } else drawing = false;
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function geographicDistanceKm(a, b) {
  const latA = a.lat * DEG;
  const latB = b.lat * DEG;
  const deltaLat = (b.lat - a.lat) * DEG;
  const deltaLon = (b.lon - a.lon) * DEG;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);
  const h = sinLat * sinLat + Math.cos(latA) * Math.cos(latB) * sinLon * sinLon;
  const boundedH = Math.min(1, h);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(boundedH), Math.sqrt(1 - boundedH));
}

function getRegionLabel(regionProjects) {
  const counts = new Map();
  for (const projectItem of regionProjects) {
    const label = projectItem.clusterCity ?? projectItem.city;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

function groupNearbyProjects(projectItems) {
  const locatedProjects = projectItems.filter(
    ({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon),
  );
  const visited = new Set();
  const regions = [];

  for (const projectItem of locatedProjects) {
    if (visited.has(projectItem.id)) continue;
    const regionProjects = [];
    const queue = [projectItem];
    visited.add(projectItem.id);

    while (queue.length) {
      const current = queue.shift();
      regionProjects.push(current);
      for (const candidate of locatedProjects) {
        if (visited.has(candidate.id)) continue;
        if (geographicDistanceKm(current, candidate) <= REGION_CLUSTER_RADIUS_KM) {
          visited.add(candidate.id);
          queue.push(candidate);
        }
      }
    }

    regions.push({
      id: regionProjects.map(({ id }) => id).join('--'),
      label: getRegionLabel(regionProjects),
      projects: regionProjects,
    });
  }

  return regions;
}

function spreadOverlappingMarkers(projectedProjects) {
  const markers = projectedProjects.map(({ item, point }) => ({
    item,
    point,
    x: point.x,
    y: point.y,
  }));

  for (let iteration = 0; iteration < 14; iteration += 1) {
    for (let i = 0; i < markers.length; i += 1) {
      for (let j = i + 1; j < markers.length; j += 1) {
        let dx = markers[j].x - markers[i].x;
        let dy = markers[j].y - markers[i].y;
        let distance = Math.hypot(dx, dy);
        if (distance >= EXPANDED_MARKER_GAP) continue;
        if (distance < 0.01) {
          const angle = ((i + 1) * 2.39996) % (Math.PI * 2);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        const offset = (EXPANDED_MARKER_GAP - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;
        markers[i].x -= nx * offset;
        markers[i].y -= ny * offset;
        markers[j].x += nx * offset;
        markers[j].y += ny * offset;
      }
    }
  }

  return markers;
}

function GlobeCanvas({ projects, onHover, onSelect }) {
  const regions = useMemo(() => groupNearbyProjects(projects), [projects]);
  const terrainRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({
    yaw: -108 * DEG,
    pitch: -10 * DEG,
    zoom: 1,
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    pointerX: -1000,
    pointerY: -1000,
    hovered: null,
    hoveringGlobe: false,
    interacted: false,
    cx: 0,
    cy: 0,
    radius: 0,
  });
  const propsRef = useRef({ regions, onHover, onSelect });
  propsRef.current = { regions, onHover, onSelect };

  useEffect(() => {
    const canvas = canvasRef.current;
    const terrainCanvas = terrainRef.current;
    const ctx = canvas.getContext('2d');
    const renderer = new THREE.WebGLRenderer({
      canvas: terrainCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 3000);
    camera.position.z = 1200;

    const pitchGroup = new THREE.Group();
    const yawGroup = new THREE.Group();
    pitchGroup.add(yawGroup);
    scene.add(pitchGroup);

    const textureLoader = new THREE.TextureLoader();
    const surfaceTexture = textureLoader.load('/textures/earth-atmos-2048.jpg');
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const normalTexture = textureLoader.load('/textures/earth-normal-2048.jpg');
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: surfaceTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(1.12, 1.12),
      roughness: 0.92,
      metalness: 0.01,
      color: 0xaaa39a,
      emissive: 0x2a2520,
      emissiveIntensity: 0.22,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 144, 96), earthMaterial);
    earth.rotation.y = -Math.PI / 2;
    yawGroup.add(earth);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 4.1);
          float lightSide = smoothstep(-0.08, 0.88, dot(vNormal, normalize(vec3(-0.82, 0.56, 0.12))));
          gl_FragColor = vec4(0.72, 0.67, 0.59, rim * lightSide * 0.055);
        }
      `,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.004, 144, 96), atmosphereMaterial);
    earth.add(atmosphere);

    scene.add(new THREE.HemisphereLight(0xd8cbb9, 0x17130f, 1.02));
    const keyLight = new THREE.DirectionalLight(0xe7d4bb, 2.55);
    keyLight.position.set(-680, 720, 860);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x807468, 0.3);
    fillLight.position.set(480, -280, 520);
    scene.add(fillLight);
    let frame;
    let last = performance.now();
    const markerHits = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      camera.left = -rect.width / 2;
      camera.right = rect.width / 2;
      camera.top = rect.height / 2;
      camera.bottom = -rect.height / 2;
      camera.updateProjectionMatrix();
    };

    const draw = (now) => {
      const s = stateRef.current;
      const dt = Math.min(32, now - last);
      last = now;
      if (!s.hoveringGlobe && !s.dragging && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        s.yaw += dt * 0.000038;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const base = Math.min(h * 0.535, w * 0.447);
      const radius = base * s.zoom;
      if (radius <= 1) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const cx = w * 0.61;
      const cy = h * 0.64;
      s.cx = cx;
      s.cy = cy;
      s.radius = radius;
      const pState = [s.yaw, s.pitch, radius, cx, cy];

      pitchGroup.position.set(cx - w / 2, h / 2 - cy, 0);
      pitchGroup.rotation.x = -s.pitch;
      yawGroup.rotation.y = s.yaw;
      earth.scale.setScalar(radius);
      renderer.render(scene, camera);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI * 1.01, Math.PI * 1.73);
      const boundaryLight = ctx.createLinearGradient(
        cx - radius,
        cy - radius * 0.2,
        cx + radius * 0.3,
        cy - radius,
      );
      boundaryLight.addColorStop(0, 'rgba(237,233,223,.025)');
      boundaryLight.addColorStop(0.34, 'rgba(237,233,223,.19)');
      boundaryLight.addColorStop(0.68, 'rgba(237,233,223,.055)');
      boundaryLight.addColorStop(1, 'rgba(237,233,223,0)');
      ctx.strokeStyle = boundaryLight;
      ctx.lineWidth = 0.38;
      ctx.shadowColor = 'rgba(237,233,223,.08)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
      ctx.clip();

      for (let lon = -180; lon <= 180; lon += 20) {
        const line = [];
        for (let lat = -90; lat <= 90; lat += 2) line.push([lon, lat]);
        drawGeoLine(ctx, line, pState, 'rgba(207,195,178,.045)', 0.65);
      }
      for (let lat = -80; lat <= 80; lat += 20) {
        const line = [];
        for (let lon = -180; lon <= 180; lon += 2) line.push([lon, lat]);
        drawGeoLine(ctx, line, pState, 'rgba(207,195,178,.045)', 0.65);
      }

      for (const ring of LAND_RINGS) {
        drawGeoLine(ctx, ring, pState, 'rgba(207,195,178,.34)', 0.55);
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      ctx.clip();
      const depthFade = ctx.createRadialGradient(
        cx - radius * 0.34,
        cy - radius * 0.32,
        radius * 0.08,
        cx - radius * 0.08,
        cy - radius * 0.08,
        radius * 1.13,
      );
      depthFade.addColorStop(0, 'rgba(3,3,3,0)');
      depthFade.addColorStop(0.44, 'rgba(3,3,3,.018)');
      depthFade.addColorStop(0.72, 'rgba(20,16,13,.09)');
      depthFade.addColorStop(0.9, 'rgba(16,13,11,.27)');
      depthFade.addColorStop(1, 'rgba(13,11,9,.46)');
      ctx.fillStyle = depthFade;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      const directionalShade = ctx.createLinearGradient(
        cx - radius * 0.52,
        cy - radius * 0.58,
        cx + radius * 0.82,
        cy + radius * 0.86,
      );
      directionalShade.addColorStop(0, 'rgba(2,2,2,0)');
      directionalShade.addColorStop(0.43, 'rgba(2,2,2,.012)');
      directionalShade.addColorStop(0.65, 'rgba(17,13,10,.12)');
      directionalShade.addColorStop(0.84, 'rgba(14,11,9,.34)');
      directionalShade.addColorStop(1, 'rgba(11,9,8,.58)');
      ctx.fillStyle = directionalShade;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();

      markerHits.length = 0;
      const expanded = s.zoom >= CLUSTER_BREAK_ZOOM;

      for (const region of propsRef.current.regions) {
        const regionProjects = region.projects;
        const projectedProjects = regionProjects.map((item) => ({
          item,
          point: project(item.lon, item.lat, ...pState),
        }));
        const visibleRegionProjects = projectedProjects.filter(({ point }) => point.z > 0.03);
        if (!visibleRegionProjects.length) continue;
        const basePoint = visibleRegionProjects.reduce((center, { point }) => ({
          x: center.x + point.x / visibleRegionProjects.length,
          y: center.y + point.y / visibleRegionProjects.length,
          z: center.z + point.z / visibleRegionProjects.length,
        }), { x: 0, y: 0, z: 0 });
        if (basePoint.z <= 0.03) continue;
        const clustered = regionProjects.length > 1 && !expanded;
        const renderMarkers = clustered
          ? [{ ...visibleRegionProjects[0], x: basePoint.x, y: basePoint.y }]
          : spreadOverlappingMarkers(visibleRegionProjects);

        renderMarkers.forEach(({ item, point, x, y }) => {
          const hitId = clustered ? `cluster-${region.id}` : item.id;
          const isHovered = s.hovered === hitId;
          const r = clustered ? 16 : isHovered ? 6 : 4;
          if (!clustered && Math.hypot(x - point.x, y - point.y) > 3) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(237,233,223,.34)';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
          if (!clustered || isHovered) {
            ctx.beginPath();
            ctx.arc(x, y, r + (isHovered ? 3 : 1.5), 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? 'rgba(177,112,77,.16)' : 'rgba(237,233,223,.07)';
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = clustered ? '#ede9df' : (isHovered ? '#b1704d' : '#ede9df');
          ctx.fill();
          if (clustered) {
            ctx.strokeStyle = isHovered ? '#b1704d' : 'rgba(11,11,10,.72)';
            ctx.lineWidth = isHovered ? 1.25 : 0.7;
            ctx.stroke();
            ctx.fillStyle = '#0b0b0a';
            ctx.font = '800 15px "Cascadia Mono", ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(regionProjects.length), x, y + 0.25);
          }
          markerHits.push({
            id: hitId,
            x,
            y,
            radius: (clustered ? 23 : 16) + Math.max(0, 1 - basePoint.z) * 7,
            project: item,
            cluster: clustered ? regionProjects : null,
            clusterCity: region.label,
          });
        });
      }


      frame = requestAnimationFrame(draw);
    };

    const hitAt = (x, y) => markerHits.reduce((nearest, hit) => {
      const distance = Math.hypot(hit.x - x, hit.y - y);
      if (distance > hit.radius || (nearest && nearest.distance <= distance)) return nearest;
      return { ...hit, distance };
    }, null);
    const pointerPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
    };
    const onPointerDown = (event) => {
      const s = stateRef.current;
      s.dragging = true;
      s.moved = false;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
      s.interacted = true;
      s.hovered = null;
      propsRef.current.onHover(null);
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (event) => {
      const s = stateRef.current;
      if (s.dragging) {
        const dx = event.clientX - s.lastX;
        const dy = event.clientY - s.lastY;
        if (Math.abs(dx) + Math.abs(dy) > 2) s.moved = true;
        s.yaw += dx * 0.006;
        s.pitch = Math.max(-0.8, Math.min(0.8, s.pitch + dy * 0.004));
        s.lastX = event.clientX;
        s.lastY = event.clientY;
        return;
      }
      const { x, y, rect } = pointerPosition(event);
      s.hoveringGlobe = Math.hypot(x - s.cx, y - s.cy) <= s.radius;
      const hit = hitAt(x, y);
      const id = hit?.id ?? null;
      if (id !== s.hovered) {
        s.hovered = id;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
        propsRef.current.onHover(
          hit
            ? {
                project: hit.project,
                cluster: hit.cluster,
                clusterCity: hit.clusterCity,
                screen: { x: rect.left + hit.x, y: rect.top + hit.y },
              }
            : null,
        );
      }
    };
    const onPointerLeave = () => {
      const s = stateRef.current;
      s.hoveringGlobe = false;
      s.hovered = null;
      s.dragging = false;
      canvas.style.cursor = 'grab';
      propsRef.current.onHover(null);
    };
    const onPointerUp = (event) => {
      const s = stateRef.current;
      const { x, y } = pointerPosition(event);
      const hit = hitAt(x, y);
      if (!s.moved && hit) {
        if (hit.cluster) {
          s.zoom = Math.max(s.zoom, 1.55);
          s.yaw -= 0.015;
          s.hovered = null;
          propsRef.current.onHover(null);
        } else propsRef.current.onSelect(hit.project);
      }
      s.dragging = false;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const onWheel = (event) => {
      event.preventDefault();
      const s = stateRef.current;
      s.interacted = true;
      s.zoom = Math.max(0.86, Math.min(1.72, s.zoom - event.deltaY * 0.001));
      s.hovered = null;
      propsRef.current.onHover(null);
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      earth.geometry.dispose();
      earthMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphereMaterial.dispose();
      surfaceTexture.dispose();
      normalTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="globe-canvas-stack">
      <canvas ref={terrainRef} className="terrain-canvas" aria-hidden="true" />
      <canvas ref={canvasRef} className="globe-canvas" aria-label="Interactive globe showing portfolio project locations" />
    </div>
  );
}

export default memo(GlobeCanvas);
