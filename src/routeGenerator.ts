import { v4 as uuidv4 } from 'uuid';
import { GeoPoint, Route, RouteStep } from './types';

// Центр Санкт-Петербурга
const SPB_CENTER = { lat: 59.9343, lon: 30.3351 };

// Границы Санкт-Петербурга (от конечной до конечной)
// Включают окраины с конечными станциями метро
const SPB_BOUNDS = {
  north: 60.10,  // Парнас, Проспект Просвещения
  south: 59.76,  // Купчино, Звёздная
  east: 30.62,   // Улица Дыбенко, Рыбацкое
  west: 30.08,   // Приморская, Беговая
};

// Проверка, что точка не слишком близко к КАД
function isTooCloseToKAD(lat: number, lon: number): boolean {
  // Примерная проверка расстояния от центра
  // КАД примерно на расстоянии 0.14-0.17 градусов от центра
  const distFromCenter = Math.sqrt(
    Math.pow(lat - SPB_CENTER.lat, 2) + 
    Math.pow(lon - SPB_CENTER.lon, 2)
  );
  
  // Если точка слишком далеко от центра (близко к КАД или за ним)
  return distFromCenter > 0.18; // Увеличено для поддержки маршрутов до окраин
}

// Проверка, что маршрут не идёт по КАД
function isRouteOnKAD(geometry: [number, number][]): boolean {
  if (geometry.length === 0) return false;
  
  // Подсчитываем, сколько точек маршрута находятся близко к КАД
  // КАД — это кольцо на расстоянии ~0.15-0.19 от центра
  let kadPoints = 0;
  const sampleStep = Math.max(1, Math.floor(geometry.length / 100)); // Берём ~100 точек
  
  for (let i = 0; i < geometry.length; i += sampleStep) {
    const [lat, lon] = geometry[i];
    const distFromCenter = Math.sqrt(
      Math.pow(lat - SPB_CENTER.lat, 2) + 
      Math.pow(lon - SPB_CENTER.lon, 2)
    );
    
    // Если точка на расстоянии 0.15-0.20 от центра — вероятно, это КАД
    if (distFromCenter > 0.15 && distFromCenter < 0.20) {
      kadPoints++;
    }
  }
  
  const totalSampled = Math.ceil(geometry.length / sampleStep);
  const kadPercentage = kadPoints / totalSampled;
  
  // Если больше 30% маршрута проходит по КАД — отбрасываем
  return kadPercentage > 0.30;
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
  // Точки генерируются на окраинах (как конечные станции метро)
  const rad = (angle * Math.PI) / 180;
  const offsetLat = Math.cos(rad) * latRange * 0.70; // 70% от центра к краю
  const offsetLon = Math.sin(rad) * lonRange * 0.70;
  
  const startCenterLat = centerLat + offsetLat;
  const startCenterLon = centerLon + offsetLon;
  
  const finishCenterLat = centerLat - offsetLat;
  const finishCenterLon = centerLon - offsetLon;
  
  const zoneRadius = 0.08; // ~8 км радиус для разнообразия на окраинах
  
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

// Генерация случайной промежуточной точки для крюков и разнообразия маршрутов
function generateRandomWaypoint(start: GeoPoint, finish: GeoPoint, index: number): GeoPoint | null {
  // 80% шанс добавить waypoint для создания крюков
  if (Math.random() > 0.8) return null;
  
  // Распределяем waypoints по длине маршрута
  const t = 0.2 + (index * 0.2) + (Math.random() * 0.15); // 20-95% от расстояния
  if (t > 0.95) return null;
  
  const midLat = start.lat + (finish.lat - start.lat) * t;
  const midLon = start.lon + (finish.lon - start.lon) * t;
  
  // Случайное смещение перпендикулярно маршруту для создания крюков
  // Увеличено до ±3 км для более выраженных отклонений
  const offset = (Math.random() - 0.5) * 0.06;
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
    // Генерируем 1-3 случайных waypoint для крюков и разнообразия
    const waypoints: GeoPoint[] = [];
    
    // Первый waypoint (20-40% от маршрута)
    const wp1 = generateRandomWaypoint(start, finish, 0);
    if (wp1) waypoints.push(wp1);
    
    // Второй waypoint (40-60% от маршрута)
    const wp2 = generateRandomWaypoint(start, finish, 1);
    if (wp2 && (!wp1 || Math.abs(wp2.lat - wp1.lat) > 0.015 || Math.abs(wp2.lon - wp1.lon) > 0.015)) {
      waypoints.push(wp2);
    }
    
    // Третий waypoint с 50% шансом (60-80% от маршрута)
    if (Math.random() < 0.5) {
      const wp3 = generateRandomWaypoint(start, finish, 2);
      if (wp3) {
        const tooClose = waypoints.some(wp => 
          Math.abs(wp3.lat - wp.lat) < 0.015 && Math.abs(wp3.lon - wp.lon) < 0.015
        );
        if (!tooClose) waypoints.push(wp3);
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
  const maxAttempts = 40; // Увеличено до 40 из-за расширенных границ и крюков
  
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
    // От конечки до конечки ≈ 0.25-0.30 градусов
    const directDistance = straightLineDistance(startPoint, finishPoint);
    if (directDistance > 0.32) {
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
    
    // Максимальная длина 45 км — от конечки до конечки с крюками
    if (routeData.distance > 45000) {
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
