export interface GeoPoint {
  lat: number;
  lon: number;
  name?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  name: string;
}

export interface Route {
  id: string;
  routeNumber: number;
  direction: string;
  directionAngle: number;
  start: GeoPoint;
  finish: GeoPoint;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lat, lon][]
  steps: RouteStep[];
  waypoints: GeoPoint[];
  createdAt: Date;
}

export type GenerationMode = 'random' | 'from-start' | 'to-finish';

export interface GenerationSettings {
  mode: GenerationMode;
  userPoint?: GeoPoint;
}
