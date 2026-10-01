import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { GeoPoint } from './types';
import LocationSearch from './LocationSearch';

const startIcon = new L.DivIcon({
  html: `<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const finishIcon = new L.DivIcon({
  html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onMapClick }: { onMapClick: (point: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

function FlyToPoint({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lon], 14, { duration: 0.8 });
    }
  }, [point, map]);
  return null;
}

interface PointPickerProps {
  mode: 'start' | 'finish';
  onSelect: (point: GeoPoint) => void;
  onCancel: () => void;
}

export default function PointPicker({ mode, onSelect, onCancel }: PointPickerProps) {
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(null);
  
  const isStart = mode === 'start';
  const title = isStart ? 'Откуда начнём?' : 'Куда идём?';
  const icon = isStart ? startIcon : finishIcon;
  const accentColor = isStart ? 'green' : 'red';
  
  const handlePointSelect = (point: GeoPoint) => {
    setSelectedPoint(point);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onCancel}
            className="text-stone-600 hover:text-stone-900 flex items-center gap-2 transition-colors font-serif"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Отмена</span>
          </button>
          <h1 className="font-serif text-lg text-stone-800">{title}</h1>
          <div className="w-16"></div>
        </div>
      </header>
      
      {/* Search + info */}
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <LocationSearch
            onSelect={handlePointSelect}
            placeholder={isStart ? 'Адрес старта в Санкт-Петербурге...' : 'Адрес финиша в Санкт-Петербурге...'}
            selectedPoint={selectedPoint}
          />
          <p className="text-center text-stone-400 text-xs font-serif">
            Введите адрес или кликните на карту
          </p>
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <MapContainer
          center={[59.9343, 30.3351]}
          zoom={11}
          className="w-full h-full"
          style={{ minHeight: 'calc(100vh - 280px)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handlePointSelect} />
          <FlyToPoint point={selectedPoint} />
          {selectedPoint && (
            <Marker 
              position={[selectedPoint.lat, selectedPoint.lon]} 
              icon={icon}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Bottom bar */}
      <div className="bg-white border-t border-stone-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {selectedPoint ? (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-700 font-serif truncate">
                <span className={`inline-block w-2 h-2 rounded-full bg-${accentColor}-500 mr-2`}></span>
                {selectedPoint.name || `${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lon.toFixed(4)}`}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-stone-400 font-serif italic flex-1">
              Точка не выбрана
            </p>
          )}
          <button
            onClick={() => selectedPoint && onSelect(selectedPoint)}
            disabled={!selectedPoint}
            className={`px-8 py-3 rounded-lg font-serif transition-all flex-shrink-0 ${
              selectedPoint
                ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-md hover:shadow-lg'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Построить маршрут
          </button>
        </div>
      </div>
    </div>
  );
}
