import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Route } from './types';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.DivIcon({
  html: `<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const finishIcon = new L.DivIcon({
  html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ route }: { route: Route }) {
  const map = useMap();
  
  useEffect(() => {
    if (route.geometry.length > 0) {
      const bounds = L.latLngBounds(route.geometry.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [route, map]);
  
  return null;
}

interface RouteMapProps {
  route: Route;
}

export default function RouteMap({ route }: RouteMapProps) {
  const center: [number, number] = [route.start.lat, route.start.lon];
  
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={route.geometry}
        pathOptions={{ color: '#1e40af', weight: 4, opacity: 0.8 }}
      />
      <Marker position={[route.start.lat, route.start.lon]} icon={startIcon}>
        <Popup>
          <strong>Старт</strong>
          {route.start.name && (
            <>
              <br />
              <span style={{ fontSize: '12px' }}>
                {route.start.name.split(',').slice(0, 2).join(',')}
              </span>
            </>
          )}
          <br />
          <span style={{ fontSize: '11px', color: '#666' }}>
            {route.start.lat.toFixed(4)}, {route.start.lon.toFixed(4)}
          </span>
        </Popup>
      </Marker>
      <Marker position={[route.finish.lat, route.finish.lon]} icon={finishIcon}>
        <Popup>
          <strong>Финиш</strong>
          {route.finish.name && (
            <>
              <br />
              <span style={{ fontSize: '12px' }}>
                {route.finish.name.split(',').slice(0, 2).join(',')}
              </span>
            </>
          )}
          <br />
          <span style={{ fontSize: '11px', color: '#666' }}>
            {route.finish.lat.toFixed(4)}, {route.finish.lon.toFixed(4)}
          </span>
        </Popup>
      </Marker>
      <FitBounds route={route} />
    </MapContainer>
  );
}
