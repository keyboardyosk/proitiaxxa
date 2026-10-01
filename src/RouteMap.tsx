import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Route } from './types';

// Стартовая точка — чёрный квадрат (как в ТЗ)
const startIcon = new L.DivIcon({
  html: `<div style="
    background: #171717;
    width: 16px;
    height: 16px;
    border: 2.5px solid #F1EFE8;
    box-shadow: 0 0 0 1px #171717, 0 2px 6px rgba(23,23,23,0.3);
  "></div>`,
  className: 'custom-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Финиш — красный круг
const finishIcon = new L.DivIcon({
  html: `<div style="
    background: #D92F2F;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2.5px solid #F1EFE8;
    box-shadow: 0 0 0 1px #D92F2F, 0 2px 6px rgba(217,47,47,0.4);
  "></div>`,
  className: 'custom-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ route }: { route: Route }) {
  const map = useMap();
  
  useEffect(() => {
    if (route.geometry.length > 0) {
      const bounds = L.latLngBounds(route.geometry.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [route, map]);
  
  return null;
}

interface RouteMapProps {
  route: Route;
  interactive?: boolean;
}

export default function RouteMap({ route, interactive = true }: RouteMapProps) {
  const center: [number, number] = [route.start.lat, route.start.lon];
  
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full"
      style={{ minHeight: '400px', background: '#E8E5DB' }}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
    >
      {/* Монохромная карта — акцент на маршруте */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {/* Тонкая «тень» маршрута для глубины */}
      <Polyline
        positions={route.geometry}
        pathOptions={{
          color: '#171717',
          weight: 9,
          opacity: 0.12,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      
      {/* Основная маршрутная линия */}
      <Polyline
        positions={route.geometry}
        pathOptions={{
          color: '#D92F2F',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      
      <Marker position={[route.start.lat, route.start.lon]} icon={startIcon}>
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#626262', letterSpacing: '0.1em', marginBottom: '4px' }}>
              START
            </div>
            {route.start.name && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#171717', marginBottom: '2px' }}>
                {route.start.name.split(',').slice(0, 2).join(',')}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#626262', fontFamily: 'JetBrains Mono, monospace' }}>
              {route.start.lat.toFixed(4)}°N, {route.start.lon.toFixed(4)}°E
            </div>
          </div>
        </Popup>
      </Marker>
      
      <Marker position={[route.finish.lat, route.finish.lon]} icon={finishIcon}>
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#D92F2F', letterSpacing: '0.1em', marginBottom: '4px' }}>
              FINISH
            </div>
            {route.finish.name && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#171717', marginBottom: '2px' }}>
                {route.finish.name.split(',').slice(0, 2).join(',')}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#626262', fontFamily: 'JetBrains Mono, monospace' }}>
              {route.finish.lat.toFixed(4)}°N, {route.finish.lon.toFixed(4)}°E
            </div>
          </div>
        </Popup>
      </Marker>
      
      <FitBounds route={route} />
    </MapContainer>
  );
}
