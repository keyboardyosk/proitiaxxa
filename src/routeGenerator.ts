import { v4 as uuidv4 } from 'uuid';
import { GeoPoint, Route, RouteStep } from './types';

// Центр Санкт-Петербурга
const SPB_CENTER = { lat: 59.9343, lon: 30.3351 };

// Границы Санкт-Петербурга (приблизительные)
const SPB_BOUNDS = {
  north: 60.15,
  south: 59.72,
  east: 30.65,
  west: 30.05,
};

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
  const offsetLat = Math.cos(rad) * latRange * 0.6;
  const offsetLon = Math.sin(rad) * lonRange * 0.6;
  
  const startCenterLat = centerLat + offsetLat;
  const startCenterLon = centerLon + offsetLon;
  
  const finishCenterLat = centerLat - offsetLat;
  const finishCenterLon = centerLon - offsetLon;
  
  const zoneRadius = 0.08; // Примерно 8-9 км
  
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

async function fetchWalkingRoute(start: GeoPoint, finish: GeoPoint): Promise<{
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
} | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${start.lon},${start.lat};${finish.lon},${finish.lat}?overview=full&geometries=geojson&steps=true`;
    
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
    
    return {
      geometry: coordinates,
      distance: route.distance,
      duration: route.duration,
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
  const maxAttempts = 10;
  
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
    
    // Запрашиваем маршрут
    const routeData = await fetchWalkingRoute(startPoint, finishPoint);
    
    if (!routeData) {
      continue;
    }
    
    // Проверяем минимальную длину (10 км)
    if (routeData.distance < 10000) {
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
