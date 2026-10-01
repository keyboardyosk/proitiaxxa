import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { GeoPoint } from './types';
import LocationSearch from './LocationSearch';

const startIcon = new L.DivIcon({
  html: `<div style="background: #171717; width: 16px; height: 16px; border: 2.5px solid #F1EFE8; box-shadow: 0 0 0 1px #171717, 0 2px 6px rgba(23,23,23,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const finishIcon = new L.DivIcon({
  html: `<div style="background: #D92F2F; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid #F1EFE8; box-shadow: 0 0 0 1px #D92F2F, 0 2px 6px rgba(217,47,47,0.4);"></div>`,
  className: 'custom-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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
  const title = isStart ? 'НАЧНУ ЗДЕСЬ' : 'ЗАКОНЧУ ЗДЕСЬ';
  const subtitle = isStart ? 'Точка старта' : 'Точка финиша';
  const icon = isStart ? startIcon : finishIcon;
  
  const handlePointSelect = (point: GeoPoint) => {
    setSelectedPoint(point);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-paper border-b border-line-soft">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onCancel}
            className="text-ink-muted hover:text-ink flex items-center gap-2 transition-colors font-technical text-xs uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Отмена</span>
          </button>
          <div className="text-center">
            <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              {subtitle}
            </div>
            <h1 className="font-display text-lg text-ink">{title}</h1>
          </div>
          <div className="w-16"></div>
        </div>
      </header>
      
      {/* Search */}
      <div className="bg-paper border-b border-line-soft px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <LocationSearch
            onSelect={handlePointSelect}
            placeholder={isStart ? 'Адрес старта в Санкт-Петербурге' : 'Адрес финиша в Санкт-Петербурге'}
            selectedPoint={selectedPoint}
          />
          <p className="text-center text-ink-muted text-xs font-technical uppercase tracking-wider mt-3">
            Или кликните на карту
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
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
      <div className="bg-paper border-t border-line-soft px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {selectedPoint ? (
            <div className="flex-1 min-w-0">
              <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                {isStart ? 'START' : 'FINISH'}
              </div>
              <p className="text-sm text-ink truncate mt-0.5">
                {selectedPoint.name 
                  ? selectedPoint.name.split(',').slice(0, 2).join(',')
                  : `${selectedPoint.lat.toFixed(4)}°, ${selectedPoint.lon.toFixed(4)}°`}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 font-mono">
                {selectedPoint.lat.toFixed(4)}°N · {selectedPoint.lon.toFixed(4)}°E
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted italic flex-1">
              Точка не выбрана
            </p>
          )}
          <button
            onClick={() => selectedPoint && onSelect(selectedPoint)}
            disabled={!selectedPoint}
            className={`px-8 py-3.5 font-technical text-xs uppercase tracking-[0.15em] transition-all flex-shrink-0 ${
              selectedPoint
                ? 'bg-ink text-paper hover:bg-ink-soft'
                : 'bg-line-soft text-ink-muted cursor-not-allowed'
            }`}
          >
            Построить маршрут
          </button>
        </div>
      </div>
    </div>
  );
}
