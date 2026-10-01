import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint } from './types';

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

interface PointPickerProps {
  mode: 'start' | 'finish';
  onSelect: (point: GeoPoint) => void;
  onCancel: () => void;
}

export default function PointPicker({ mode, onSelect, onCancel }: PointPickerProps) {
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(null);
  
  const isStart = mode === 'start';
  const title = isStart ? 'Выберите стартовую точку' : 'Выберите конечную точку';
  const icon = isStart ? startIcon : finishIcon;
  
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
      
      {/* Instructions */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <p className="text-center text-stone-600 text-sm font-serif">
          Кликните на карту, чтобы выбрать {isStart ? 'стартовую' : 'конечную'} точку
        </p>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <MapContainer
          center={[59.9343, 30.3351]}
          zoom={11}
          className="w-full h-full"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={(point) => setSelectedPoint(point)} />
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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {selectedPoint ? (
            <p className="text-sm text-stone-600 font-serif">
              Точка: {selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}
            </p>
          ) : (
            <p className="text-sm text-stone-400 font-serif italic">
              Точка не выбрана
            </p>
          )}
          <button
            onClick={() => selectedPoint && onSelect(selectedPoint)}
            disabled={!selectedPoint}
            className={`px-8 py-3 rounded-lg font-serif transition-all ${
              selectedPoint
                ? 'bg-blue-800 text-white hover:bg-blue-900 shadow-md'
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
