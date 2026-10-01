import { useState, useCallback } from 'react';
import { Route, GenerationMode, GeoPoint } from './types';
import { generateRoute, formatDistance, formatDuration } from './routeGenerator';
import RouteMap from './RouteMap';
import { generatePDF } from './pdfGenerator';
import PointPicker from './PointPicker';

type Screen = 'landing' | 'route' | 'loading' | 'pick-start' | 'pick-finish';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  // Сохранённая пользовательская точка (для пересоздания маршрута)
  const [savedUserPoint, setSavedUserPoint] = useState<{
    point: GeoPoint;
    mode: 'from-start' | 'to-finish';
  } | null>(null);
  
  const handleGenerate = useCallback(async (mode: GenerationMode = 'random', userPoint?: GeoPoint) => {
    setScreen('loading');
    setError(null);
    
    // Сохраняем пользовательскую точку для возможности пересоздания
    if ((mode === 'from-start' || mode === 'to-finish') && userPoint) {
      setSavedUserPoint({ point: userPoint, mode });
    }
    
    try {
      const newRoute = await generateRoute(mode, userPoint);
      if (newRoute) {
        setRoute(newRoute);
        setScreen('route');
      } else {
        setError('Не удалось сгенерировать маршрут. Попробуйте ещё раз.');
        setScreen('landing');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при генерации маршрута. Проверьте подключение к интернету.');
      setScreen('landing');
    }
  }, []);
  
  // Новый случайный маршрут (сбрасывает сохранённую точку)
  const handleNewRoute = useCallback(() => {
    setSavedUserPoint(null);
    handleGenerate('random');
  }, [handleGenerate]);
  
  // Пересоздать маршрут с той же указанной точкой
  const handleRegenerate = useCallback(() => {
    if (savedUserPoint) {
      handleGenerate(savedUserPoint.mode, savedUserPoint.point);
    }
  }, [savedUserPoint, handleGenerate]);
  
  // Изменить точку (вернуться к выбору)
  const handleChangePoint = useCallback(() => {
    if (savedUserPoint) {
      setScreen(savedUserPoint.mode === 'from-start' ? 'pick-start' : 'pick-finish');
    }
  }, [savedUserPoint]);
  
  const handleDownloadPDF = useCallback(() => {
    if (route) {
      generatePDF(route);
    }
  }, [route]);
  
  const handleBack = useCallback(() => {
    setScreen('landing');
    setRoute(null);
    setShowDescription(false);
    setSavedUserPoint(null);
  }, []);
  
  // === ЭКРАН ЗАГРУЗКИ ===
  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-8 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-stone-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-800 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-blue-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-stone-700 text-xl font-serif mb-2">Прокладываем маршрут через город...</p>
          <p className="text-stone-400 text-sm font-serif">Ищем путь от одной стороны Петербурга к другой</p>
        </div>
      </div>
    );
  }
  
  // === ЭКРАН ВЫБОРА ТОЧКИ ===
  if (screen === 'pick-start' || screen === 'pick-finish') {
    return (
      <PointPicker
        mode={screen === 'pick-start' ? 'start' : 'finish'}
        onSelect={(point) => {
          handleGenerate(screen === 'pick-start' ? 'from-start' : 'to-finish', point);
        }}
        onCancel={() => setScreen('landing')}
      />
    );
  }
  
  // === ЭКРАН МАРШРУТА ===
  if (screen === 'route' && route) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="text-stone-600 hover:text-stone-900 flex items-center gap-2 transition-colors font-serif"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Назад</span>
            </button>
            <h1 className="font-serif text-lg text-stone-800">Маршрут №{route.routeNumber}</h1>
            <div className="w-16"></div>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Route Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-stone-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded">пешком</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-800">
                  {route.direction}
                </h2>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-800">{formatDistance(route.distanceMeters)}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mt-1">расстояние</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-stone-700">{formatDuration(route.durationSeconds)}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mt-1">время</p>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm mt-1.5 flex-shrink-0"></span>
                <div className="text-stone-600">
                  <p className="font-medium text-stone-700">
                    Старт{route.start.name ? ': ' + route.start.name.split(',').slice(0, 2).join(',') : ''}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {route.start.lat.toFixed(4)}, {route.start.lon.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm mt-1.5 flex-shrink-0"></span>
                <div className="text-stone-600">
                  <p className="font-medium text-stone-700">
                    Финиш{route.finish.name ? ': ' + route.finish.name.split(',').slice(0, 2).join(',') : ''}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {route.finish.lat.toFixed(4)}, {route.finish.lon.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-stone-100" style={{ height: '450px' }}>
            <RouteMap route={route} />
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {savedUserPoint ? (
              <>
                <button
                  onClick={handleRegenerate}
                  className="px-6 py-3 bg-blue-800 text-white rounded-lg font-serif hover:bg-blue-900 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Пересоздать маршрут
                </button>
                <button
                  onClick={handleChangePoint}
                  className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Изменить точку
                </button>
                <button
                  onClick={handleNewRoute}
                  className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Случайный маршрут
                </button>
              </>
            ) : (
              <button
                onClick={handleNewRoute}
                className="px-6 py-3 bg-blue-800 text-white rounded-lg font-serif hover:bg-blue-900 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Новый маршрут
              </button>
            )}
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showDescription ? 'Скрыть описание' : 'Описание маршрута'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Скачать PDF
            </button>
          </div>
          
          {/* Hint about saved point */}
          {savedUserPoint && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-blue-900 font-serif">
                  {savedUserPoint.mode === 'from-start' 
                    ? 'Маршрут начинается в заданной вами точке' 
                    : 'Маршрут заканчивается в заданной вами точке'}
                </p>
                <p className="text-blue-700 mt-0.5">
                  Нажмите «Пересоздать маршрут», чтобы получить новый путь с той же точкой.
                </p>
              </div>
            </div>
          )}
          
          {/* Description */}
          {showDescription && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-stone-100">
              <h3 className="text-xl font-serif font-bold text-stone-800 mb-4">Описание маршрута</h3>
              <RouteDescription route={route} />
            </div>
          )}
        </main>
      </div>
    );
  }
  
  // === ЛЕНДИНГ ===
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-800/5"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-800/5"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-stone-200/30"></div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 relative z-10">
          <p className="text-red-700 text-center text-sm font-serif">{error}</p>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-lg">
          {/* Decorative compass */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-800/10 to-blue-600/5 border border-blue-800/10">
              <svg className="w-12 h-12 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-stone-900 tracking-tight mb-1 leading-tight">
            ПРОЙТИ
          </h1>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-700 tracking-tight mb-6">
            САНКТ-ПЕТЕРБУРГЪ
          </h1>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-stone-300"></div>
            <div className="w-2 h-2 rounded-full bg-blue-800/40"></div>
            <div className="h-px w-12 bg-stone-300"></div>
          </div>
          
          {/* Slogan */}
          <p className="text-stone-500 text-lg md:text-xl font-serif italic mb-12">
            Не гулять. Пересечь город.
          </p>
          
          {/* Main action */}
          <button
            onClick={() => handleGenerate('random')}
            className="group px-14 py-5 bg-blue-800 text-white text-2xl font-serif rounded-xl hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-8 relative overflow-hidden"
          >
            <span className="relative z-10">ПРОЙТИ</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          {/* Secondary actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button
              onClick={() => setScreen('pick-start')}
              className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 hover:border-stone-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
              </svg>
              Начну отсюда
            </button>
            <button
              onClick={() => setScreen('pick-finish')}
              className="px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-lg font-serif hover:bg-stone-50 hover:border-stone-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
              </svg>
              Закончу здесь
            </button>
          </div>
          
          {/* Info */}
          <div className="mt-16 flex items-center justify-center gap-6 text-stone-400 text-xs font-serif">
            <span>от 10 км</span>
            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
            <span>через весь город</span>
            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
            <span>пешком</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center py-4 text-stone-400 text-xs font-serif relative z-10">
        Маршруты построены на данных OpenStreetMap · OSRM
      </footer>
    </div>
  );
}

// Компонент описания маршрута
function RouteDescription({ route }: { route: Route }) {
  const streetSegments: { name: string; distance: number; duration: number }[] = [];
  let currentStreet = '';
  let currentDistance = 0;
  let currentDuration = 0;
  
  for (const step of route.steps) {
    const streetName = step.name || 'безымянная дорога';
    if (streetName !== currentStreet) {
      if (currentStreet && currentDistance > 0) {
        streetSegments.push({ name: currentStreet, distance: currentDistance, duration: currentDuration });
      }
      currentStreet = streetName;
      currentDistance = step.distance;
      currentDuration = step.duration;
    } else {
      currentDistance += step.distance;
      currentDuration += step.duration;
    }
  }
  if (currentStreet && currentDistance > 0) {
    streetSegments.push({ name: currentStreet, distance: currentDistance, duration: currentDuration });
  }
  
  const significantSegments = streetSegments.filter(s => s.distance > 50);
  
  return (
    <div className="space-y-4">
      <p className="text-stone-600 leading-relaxed font-serif">
        Маршрут №{route.routeNumber} проходит в направлении <strong>{route.direction}</strong>. 
        Общая длина — {formatDistance(route.distanceMeters)}, ориентировочное время в пути — {formatDuration(route.durationSeconds)}.
      </p>
      
      <div className="mt-4">
        <h4 className="font-serif font-bold text-stone-700 mb-3">Путь пролегает по:</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {significantSegments.slice(0, 40).map((seg, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1 border-b border-stone-50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-800 flex-shrink-0"></span>
              <span className="text-stone-700 flex-1">{seg.name}</span>
              <span className="text-stone-400 ml-auto flex-shrink-0 font-mono text-xs">
                {seg.distance >= 1000 ? `${(seg.distance / 1000).toFixed(1)} км` : `${Math.round(seg.distance)} м`}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {significantSegments.length > 40 && (
        <p className="text-stone-400 text-sm italic font-serif">
          ... и ещё {significantSegments.length - 40} участков
        </p>
      )}
    </div>
  );
}

export default App;
