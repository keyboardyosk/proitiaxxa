import { v4 as uuidv4 } from 'uuid';
import { GeoPoint, Route, RouteStep } from './types';

// Центр Санкт-Петербурга
const SPB_CENTER = { lat: 59.9343, lon: 30.3351 };

// Границы Санкт-Петербурга (внутри КАД, без кольцевой)
// Увеличены для поддержки маршрутов между ветками метро
const SPB_BOUNDS = {
  north: 60.08,  // Увеличено для Парнаса/Севера
  south: 59.78,  // Увеличено для Купчино/Юга
  east: 30.58,   // Увеличено для Правобережной/Востока
  west: 30.10,   // Увеличено для Приморской/Запада
};

// Проверка, что точка не слишком близко к КАД
function isTooCloseToKAD(lat: number, lon: number): boolean {
  // Примерная проверка расстояния от центра
  // КАД примерно на расстоянии 0.12-0.15 градусов от центра
  const distFromCenter = Math.sqrt(
    Math.pow(lat - SPB_CENTER.lat, 2) + 
    Math.pow(lon - SPB_CENTER.lon, 2)
  );
  
  // Если точка слишком далеко от центра (близко к КАД или за ним)
  return distFromCenter > 0.16; // Увеличено для поддержки маршрутов до окраин
}

// Проверка, что маршрут не идёт по КАД
function isRouteOnKAD(geometry: [number, number][]): boolean {
  if (geometry.length === 0) return false;
  
  // Подсчитываем, сколько точек маршрута находятся близко к КАД
  // КАД — это кольцо на расстоянии ~0.13-0.16 от центра
  let kadPoints = 0;
  const sampleStep = Math.max(1, Math.floor(geometry.length / 100)); // Берём ~100 точек
  
  for (let i = 0; i < geometry.length; i += sampleStep) {
    const [lat, lon] = geometry[i];
    const distFromCenter = Math.sqrt(
      Math.pow(lat - SPB_CENTER.lat, 2) + 
      Math.pow(lon - SPB_CENTER.lon, 2)
    );
    
    // Если точка на расстоянии 0.13-0.18 от центра — вероятно, это КАД
    if (distFromCenter > 0.13 && distFromCenter < 0.18) {
      kadPoints++;
    }
  }
  
  const totalSampled = Math.ceil(geometry.length / sampleStep);
  const kadPercentage = kadPoints / totalSampled;
  
  // Если больше 25% маршрута проходит по КАД — отбрасываем
  return kadPercentage > 0.25;
}

// Расчёт расстояния по прямой между двумя точками (в градусах)
function straightLineDistance(p1: GeoPoint, p2: GeoPoint): number {
  return Math.sqrt(
    Math.pow(p1.lat - p2.lat, 2) + 
    Math.pow(p1.lon - p2.lon, 2)
  );
}

// Зоны для генерации точек по направлениям
interface Zone {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

function getZonesForDirection(angleDeg: number): { startZone: Zone; finishZone: Zone } {
  // Нормализуем угол к 0-360
  const angle = ((angleDeg % 360) + 360) % 360;
  
  // Определяем зоны на основе направления
  // Направление 0° = Север, 90° = Восток, 180° = Юг, 270° = Запад
  
  const centerLat = SPB_CENTER.lat;
  const centerLon = SPB_CENTER.lon;
  const latRange = (SPB_BOUNDS.north - SPB_BOUNDS.south) / 2;
  const lonRange = (SPB_BOUNDS.east - SPB_BOUNDS.west) / 2;
  
  // Определяем смещение для стартовой зоны
  const rad = (angle * Math.PI) / 180;
  const offsetLat = Math.cos(rad) * latRange * 0.55; // Увеличено для маршрутов между ветками метро
  const offsetLon = Math.sin(rad) * lonRange * 0.55;
  
  const startCenterLat = centerLat + offsetLat;
  const startCenterLon = centerLon + offsetLon;
  
  const finishCenterLat = centerLat - offsetLat;
  const finishCenterLon = centerLon - offsetLon;
  
  const zoneRadius = 0.05; // Увеличено до 0.05 (~5-6 км) для маршрутов между ветками метро
  
  return {
    startZone: {
      minLat: Math.max(SPB_BOUNDS.south, startCenterLat - zoneRadius),
      maxLat: Math.min(SPB_BOUNDS.north, startCenterLat + zoneRadius),
      minLon: Math.max(SPB_BOUNDS.west, startCenterLon - zoneRadius),
      maxLon: Math.min(SPB_BOUNDS.east, startCenterLon + zoneRadius),
    },
    finishZone: {
      minLat: Math.max(SPB_BOUNDS.south, finishCenterLat - zoneRadius),
      maxLat: Math.min(SPB_BOUNDS.north, finishCenterLat + zoneRadius),
      minLon: Math.max(SPB_BOUNDS.west, finishCenterLon - zoneRadius),
      maxLon: Math.min(SPB_BOUNDS.east, finishCenterLon + zoneRadius),
    },
  };
}

function randomInZone(zone: Zone): GeoPoint {
  // Пытаемся сгенерировать точку, которая не слишком близко к КАД
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const lat = zone.minLat + Math.random() * (zone.maxLat - zone.minLat);
    const lon = zone.minLon + Math.random() * (zone.maxLon - zone.minLon);
    
    if (!isTooCloseToKAD(lat, lon)) {
      return { lat, lon };
    }
  }
  
  // Если не удалось найти подходящую точку, возвращаем последнюю попытку
  const lat = zone.minLat + Math.random() * (zone.maxLat - zone.minLat);
  const lon = zone.minLon + Math.random() * (zone.maxLon - zone.minLon);
  return { lat, lon };
}

function getDirectionName(angleDeg: number): string {
  const angle = ((angleDeg % 360) + 360) % 360;
  
  if (angle >= 337.5 || angle < 22.5) return 'Север → Юг';
  if (angle >= 22.5 && angle < 67.5) return 'Северо-восток → Юго-запад';
  if (angle >= 67.5 && angle < 112.5) return 'Восток → Запад';
  if (angle >= 112.5 && angle < 157.5) return 'Юго-восток → Северо-запад';
  if (angle >= 157.5 && angle < 202.5) return 'Юг → Север';
  if (angle >= 202.5 && angle < 247.5) return 'Юго-запад → Северо-восток';
  if (angle >= 247.5 && angle < 292.5) return 'Запад → Восток';
  if (angle >= 292.5 && angle < 337.5) return 'Северо-запад → Юго-восток';
  
  return 'Через город';
}

// Генерация случайной промежуточной точки для разнообразия маршрутов
function generateRandomWaypoint(start: GeoPoint, finish: GeoPoint): GeoPoint | null {
  // 60% шанс добавить waypoint
  if (Math.random() > 0.6) return null;
  
  // Случайная точка между start и finish, смещённая в сторону
  const t = 0.3 + Math.random() * 0.4; // 30-70% от расстояния
  const midLat = start.lat + (finish.lat - start.lat) * t;
  const midLon = start.lon + (finish.lon - start.lon) * t;
  
  // Случайное смещение перпендикулярно маршруту
  const offset = (Math.random() - 0.5) * 0.03; // ±1.5 км
  const angle = Math.atan2(finish.lon - start.lon, finish.lat - start.lat);
  const perpAngle = angle + Math.PI / 2;
  
  const waypointLat = midLat + offset * Math.cos(perpAngle);
  const waypointLon = midLon + offset * Math.sin(perpAngle);
  
  // Проверяем, что waypoint не слишком близко к КАД
  if (isTooCloseToKAD(waypointLat, waypointLon)) {
    return null;
  }
  
  return { lat: waypointLat, lon: waypointLon };
}

async function fetchWalkingRoute(start: GeoPoint, finish: GeoPoint): Promise<{
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
} | null> {
  try {
    // Генерируем 1-2 случайных waypoint для разнообразия
    const waypoints: GeoPoint[] = [];
    const wp1 = generateRandomWaypoint(start, finish);
    if (wp1) waypoints.push(wp1);
    
    // Второй waypoint с 40% шансом
    if (Math.random() < 0.4) {
      const wp2 = generateRandomWaypoint(start, finish);
      if (wp2 && (!wp1 || Math.abs(wp2.lat - wp1.lat) > 0.01 || Math.abs(wp2.lon - wp1.lon) > 0.01)) {
        waypoints.push(wp2);
      }
    }
    
    // Формируем URL с waypoints
    let routeCoords = `${start.lon},${start.lat}`;
    for (const wp of waypoints) {
      routeCoords += `;${wp.lon},${wp.lat}`;
    }
    routeCoords += `;${finish.lon},${finish.lat}`;
    
    const url = `https://router.project-osrm.org/route/v1/foot/${routeCoords}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }
    
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
    
    const steps: RouteStep[] = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      for (const step of route.legs[0].steps) {
        steps.push({
          instruction: step.maneuver.type + (step.name ? ` на ${step.name}` : ''),
          distance: step.distance,
          duration: step.duration,
          name: step.name || '',
        });
      }
    }
    
    // Пересчитываем время по пешеходной скорости с учётом усталости
    // OSRM public demo может возвращать автомобильное время, поэтому используем свою формулу
    // Средняя скорость снижается на длинных дистанциях:
    // до 10 км — 5 км/ч, 10-20 км — 4.5 км/ч, 20-30 км — 4 км/ч, 30+ км — 3.5 км/ч
    let walkingDuration = 0;
    let remaining = route.distance;
    const segments = [
      { maxDist: 10000, speed: 5.0 },   // до 10 км: 5 км/ч
      { maxDist: 10000, speed: 4.5 },   // 10-20 км: 4.5 км/ч
      { maxDist: 10000, speed: 4.0 },   // 20-30 км: 4 км/ч
      { maxDist: Infinity, speed: 3.5 }, // 30+ км: 3.5 км/ч
    ];
    for (const seg of segments) {
      if (remaining <= 0) break;
      const dist = Math.min(remaining, seg.maxDist);
      walkingDuration += dist / (seg.speed * 1000 / 3600);
      remaining -= dist;
    }
    
    return {
      geometry: coordinates,
      distance: route.distance,
      duration: walkingDuration,
      steps,
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export async function generateRoute(
  mode: 'random' | 'from-start' | 'to-finish',
  userPoint?: GeoPoint
): Promise<Route | null> {
  const maxAttempts = 30; // Увеличено до 30 из-за строгих фильтров КАД
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Выбираем случайное направление
    const directionAngle = Math.random() * 360;
    const { startZone, finishZone } = getZonesForDirection(directionAngle);
    
    let startPoint: GeoPoint;
    let finishPoint: GeoPoint;
    
    if (mode === 'from-start' && userPoint) {
      startPoint = userPoint;
      finishPoint = randomInZone(finishZone);
    } else if (mode === 'to-finish' && userPoint) {
      finishPoint = userPoint;
      startPoint = randomInZone(startZone);
    } else {
      startPoint = randomInZone(startZone);
      finishPoint = randomInZone(finishZone);
    }
    
    // Проверяем расстояние по прямой между точками
    // Если слишком далеко (>0.22 градусов ≈ 25 км), OSRM будет использовать КАД
    const directDistance = straightLineDistance(startPoint, finishPoint);
    if (directDistance > 0.22) {
      continue;
    }
    
    // Запрашиваем маршрут
    const routeData = await fetchWalkingRoute(startPoint, finishPoint);
    
    if (!routeData) {
      continue;
    }
    
    // Проверяем минимальную длину (10 км)
    if (routeData.distance < 10000) {
      continue;
    }
    
    // Проверяем максимальную длину (35 км) — если больше, вероятно использует КАД
    if (routeData.distance > 35000) {
      continue;
    }
    
    // Проверяем, что маршрут не идёт по КАД
    if (isRouteOnKAD(routeData.geometry)) {
      continue;
    }
    
    // Создаём маршрут
    const route: Route = {
      id: uuidv4(),
      routeNumber: Math.floor(Math.random() * 9000) + 1000,
      direction: getDirectionName(directionAngle),
      directionAngle,
      start: startPoint,
      finish: finishPoint,
      distanceMeters: routeData.distance,
      durationSeconds: routeData.duration,
      geometry: routeData.geometry,
      steps: routeData.steps,
      waypoints: [],
      createdAt: new Date(),
    };
    
    return route;
  }
  
  return null;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }
  return `${Math.round(meters)} м`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}
