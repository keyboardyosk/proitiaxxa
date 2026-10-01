import { useState, useCallback, useEffect } from 'react';
import { Route, GenerationMode, GeoPoint } from './types';
import { generateRoute, formatDistance, formatDuration } from './routeGenerator';
import RouteMap from './RouteMap';
import { generatePDF } from './pdfGenerator';
import PointPicker from './PointPicker';
import BrandMark from './BrandMark';

type Screen = 'landing' | 'route' | 'loading' | 'pick-start' | 'pick-finish';

// Этапы генерации для анимированного экрана загрузки
const LOADING_STAGES = [
  { label: 'ГОРОД ВЫБИРАЕТ МАРШРУТ', duration: 900 },
  { label: 'НАПРАВЛЕНИЕ ОПРЕДЕЛЕНО', duration: 700 },
  { label: 'ТОЧКИ НАЙДЕНЫ', duration: 700 },
  { label: 'МАРШРУТ ГОТОВ', duration: 500 },
];

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [savedUserPoint, setSavedUserPoint] = useState<{
    point: GeoPoint;
    mode: 'from-start' | 'to-finish';
  } | null>(null);
  
  const handleGenerate = useCallback(async (mode: GenerationMode = 'random', userPoint?: GeoPoint) => {
    setScreen('loading');
    setError(null);
    setLoadingStage(0);
    
    if ((mode === 'from-start' || mode === 'to-finish') && userPoint) {
      setSavedUserPoint({ point: userPoint, mode });
    }
    
    // Анимация этапов
    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      stageIndex++;
      if (stageIndex < LOADING_STAGES.length) {
        setLoadingStage(stageIndex);
      }
    }, 800);
    
    try {
      const newRoute = await generateRoute(mode, userPoint);
      clearInterval(stageInterval);
      setLoadingStage(LOADING_STAGES.length - 1);
      
      // Небольшая задержка, чтобы пользователь увидел «МАРШРУТ ГОТОВ»
      await new Promise((r) => setTimeout(r, 400));
      
      if (newRoute) {
        setRoute(newRoute);
        setScreen('route');
      } else {
        setError('Не удалось сгенерировать маршрут. Попробуйте ещё раз.');
        setScreen('landing');
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error(err);
      setError('Ошибка при генерации маршрута. Проверьте подключение к интернету.');
      setScreen('landing');
    }
  }, []);
  
  const handleNewRoute = useCallback(() => {
    setSavedUserPoint(null);
    handleGenerate('random');
  }, [handleGenerate]);
  
  const handleRegenerate = useCallback(() => {
    if (savedUserPoint) {
      handleGenerate(savedUserPoint.mode, savedUserPoint.point);
    }
  }, [savedUserPoint, handleGenerate]);
  
  const handleChangePoint = useCallback(() => {
    if (savedUserPoint) {
      setScreen(savedUserPoint.mode === 'from-start' ? 'pick-start' : 'pick-finish');
    }
  }, [savedUserPoint]);
  
  const handleDownloadPDF = useCallback(() => {
    if (route) generatePDF(route);
  }, [route]);
  
  const handleBack = useCallback(() => {
    setScreen('landing');
    setRoute(null);
    setShowDescription(false);
    setSavedUserPoint(null);
  }, []);
  
  // === ЭКРАН ГЕНЕРАЦИИ ===
  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center paper-texture">
        <div className="text-center px-6 w-full max-w-md">
          {/* Логотип сверху */}
          <div className="mb-12 flex justify-center">
            <BrandMark size="md" showText />
          </div>
          
          {/* Этапы */}
          <div className="space-y-3 mb-12">
            {LOADING_STAGES.map((stage, i) => {
              const isActive = i === loadingStage;
              const isDone = i < loadingStage;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 transition-all duration-500 ${
                    isActive ? 'opacity-100' : isDone ? 'opacity-40' : 'opacity-20'
                  }`}
                >
                  <div className="flex-shrink-0 w-6 flex justify-center">
                    {isDone ? (
                      <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 bg-route animate-pulse-dot"></div>
                    ) : (
                      <div className="w-2 h-2 bg-line-soft"></div>
                    )}
                  </div>
                  <div className="font-technical text-xs uppercase tracking-[0.2em] text-ink text-left">
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Прогресс-линия */}
          <div className="relative h-px bg-line-soft overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-route transition-all duration-700"
              style={{ width: `${((loadingStage + 1) / LOADING_STAGES.length) * 100}%` }}
            ></div>
          </div>
          
          <p className="mt-6 text-xs text-ink-muted font-technical uppercase tracking-widest">
            Санкт-Петербург · 59.9°N 30.3°E
          </p>
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
      <div className="min-h-screen bg-paper flex flex-col">
        {/* Тонкий верхний бар */}
        <header className="bg-paper border-b border-line-soft relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="text-ink-muted hover:text-ink flex items-center gap-2 transition-colors font-technical text-[10px] uppercase tracking-[0.2em]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Назад</span>
            </button>
            
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <div className="hidden sm:block h-4 w-px bg-line-soft"></div>
              <div className="hidden sm:block font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                Маршрут №{String(route.routeNumber).padStart(5, '0')}
              </div>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="text-ink-muted hover:text-ink flex items-center gap-2 transition-colors font-technical text-[10px] uppercase tracking-[0.2em]"
            >
              <span className="hidden sm:inline">PDF</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </header>
        
        {/* Desktop: карта слева, инфо справа. Mobile: карта сверху, инфо снизу */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Карта */}
          <div className="lg:w-3/5 relative" style={{ height: '50vh', minHeight: '360px' }}>
            <div className="absolute inset-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]">
              <RouteMap route={route} />
              
              {/* Оверлей с номером маршрута на карте */}
              <div className="absolute top-4 left-4 bg-paper/95 backdrop-blur-sm border border-line-soft px-4 py-3 z-10">
                <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                  Маршрут
                </div>
                <div className="font-display text-3xl text-ink leading-none mt-1">
                  №{String(route.routeNumber).padStart(5, '0')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Инфо */}
          <div className="lg:w-2/5 lg:overflow-y-auto lg:max-h-[calc(100vh-57px)]">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Направление */}
              <div>
                <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">
                  Направление
                </div>
                <div className="font-display text-2xl sm:text-3xl text-ink leading-tight">
                  {route.direction}
                </div>
              </div>
              
              {/* Старт / Финиш */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-2 border-ink pl-3">
                  <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-1">
                    Старт
                  </div>
                  <div className="text-sm text-ink leading-tight">
                    {route.start.name 
                      ? route.start.name.split(',').slice(0, 2).join(',')
                      : 'Точка на карте'}
                  </div>
                  <div className="text-[11px] text-ink-muted font-mono mt-1">
                    {route.start.lat.toFixed(3)}° · {route.start.lon.toFixed(3)}°
                  </div>
                </div>
                <div className="border-l-2 border-route pl-3">
                  <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-1">
                    Финиш
                  </div>
                  <div className="text-sm text-ink leading-tight">
                    {route.finish.name 
                      ? route.finish.name.split(',').slice(0, 2).join(',')
                      : 'Точка на карте'}
                  </div>
                  <div className="text-[11px] text-ink-muted font-mono mt-1">
                    {route.finish.lat.toFixed(3)}° · {route.finish.lon.toFixed(3)}°
                  </div>
                </div>
              </div>
              
              {/* Расстояние / Время */}
              <div className="border-t border-line-soft pt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">
                    Расстояние
                  </div>
                  <div className="font-display text-4xl sm:text-5xl text-ink leading-none">
                    {(route.distanceMeters / 1000).toFixed(1)}
                  </div>
                  <div className="font-technical text-sm text-ink mt-1">
                    КМ
                  </div>
                </div>
                <div>
                  <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">
                    ≈ Время
                  </div>
                  <div className="font-display text-4xl sm:text-5xl text-ink-muted leading-none">
                    {formatDuration(route.durationSeconds).split(' ')[0]}
                  </div>
                  <div className="font-technical text-sm text-ink-muted mt-1">
                    {formatDuration(route.durationSeconds).split(' ').slice(1).join(' ')}
                  </div>
                </div>
              </div>
              
              {/* Подсказка о сохранённой точке */}
              {savedUserPoint && (
                <div className="border border-line-soft p-4 bg-paper-dark/40">
                  <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-1">
                    {savedUserPoint.mode === 'from-start' ? 'Старт задан вами' : 'Финиш задан вами'}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Нажмите «Пересоздать» для нового маршрута с той же точкой.
                  </p>
                </div>
              )}
              
              {/* Действия */}
              <div className="border-t border-line-soft pt-6 space-y-2">
                {savedUserPoint ? (
                  <>
                    <button
                      onClick={handleRegenerate}
                      className="w-full px-6 py-4 bg-ink text-paper font-technical text-xs uppercase tracking-[0.15em] hover:bg-ink-soft transition-colors flex items-center justify-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Пересоздать маршрут
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleChangePoint}
                        className="px-4 py-3 bg-paper border border-line-soft text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:bg-paper-dark transition-colors"
                      >
                        Изменить точку
                      </button>
                      <button
                        onClick={handleNewRoute}
                        className="px-4 py-3 bg-paper border border-line-soft text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:bg-paper-dark transition-colors"
                      >
                        Случайный
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleNewRoute}
                    className="w-full px-6 py-4 bg-ink text-paper font-technical text-xs uppercase tracking-[0.15em] hover:bg-ink-soft transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Новый маршрут
                  </button>
                )}
                
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="w-full px-6 py-3 bg-paper border border-line-soft text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:bg-paper-dark transition-colors"
                >
                  {showDescription ? 'Скрыть описание' : 'Описание маршрута'}
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="w-full px-6 py-3 bg-paper border border-line-soft text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:bg-paper-dark transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать PDF
                </button>
              </div>
              
              {/* Описание */}
              {showDescription && (
                <div className="border-t border-line-soft pt-6">
                  <RouteDescription route={route} />
                </div>
              )}
              
              {/* Нижний технический блок */}
              <div className="border-t border-line-soft pt-4 font-technical text-[10px] uppercase tracking-[0.15em] text-ink-muted flex items-center justify-between">
                <span>Пешком</span>
                <span>{route.createdAt.toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // === ГЛАВНЫЙ ЭКРАН ===
  return (
    <div className="min-h-screen bg-paper flex flex-col paper-texture relative overflow-hidden">
      {/* Сетка на фоне */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none"></div>
      
      {error && (
        <div className="border-b border-route/30 bg-route/5 px-4 py-3 relative z-10">
          <p className="text-route text-center text-xs font-technical uppercase tracking-widest">{error}</p>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Технический верхний блок */}
          <div className="flex items-center justify-between mb-12 font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            <span>59.9°N · 30.3°E</span>
            <span>Санкт-Петербург</span>
          </div>
          
          {/* Логотип-символ */}
          <div className="mb-10 flex justify-center">
            <svg width="280" height="24" viewBox="0 0 280 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="6" width="12" height="12" fill="#171717" />
              <line x1="12" y1="12" x2="268" y2="12" stroke="#171717" strokeWidth="1.5" />
              <circle cx="274" cy="12" r="6" fill="#D92F2F" />
            </svg>
          </div>
          
          {/* Главный заголовок */}
          <h1 className="font-display text-center text-6xl sm:text-7xl md:text-8xl text-ink mb-2">
            ПРОЙТИ
          </h1>
          <h1 className="font-display text-center text-3xl sm:text-4xl md:text-5xl text-ink mb-8">
            САНКТ-ПЕТЕРБУРГЪ
          </h1>
          
          {/* Разделитель */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-line"></div>
            <div className="font-technical text-[10px] uppercase tracking-[0.3em] text-ink-muted">
              Est. 2026
            </div>
            <div className="h-px w-16 bg-line"></div>
          </div>
          
          {/* Слоган */}
          <p className="text-center text-lg sm:text-xl text-ink-soft mb-16 font-sans font-light tracking-wide">
            Не гулять. Пересечь город.
          </p>
          
          {/* Главная кнопка */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => handleGenerate('random')}
              className="group relative px-16 py-5 bg-ink text-paper font-display text-2xl tracking-wide hover:bg-route transition-colors"
            >
              <span className="relative z-10">ПРОЙТИ</span>
            </button>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full max-w-md">
              <button
                onClick={() => setScreen('pick-start')}
                className="flex-1 px-6 py-3 bg-paper border border-ink/20 text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:border-ink hover:bg-paper-dark transition-all flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 bg-ink"></span>
                Начну здесь
              </button>
              <button
                onClick={() => setScreen('pick-finish')}
                className="flex-1 px-6 py-3 bg-paper border border-ink/20 text-ink font-technical text-[10px] uppercase tracking-[0.15em] hover:border-ink hover:bg-paper-dark transition-all flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 bg-route rounded-full"></span>
                Закончу здесь
              </button>
            </div>
          </div>
          
          {/* Нижняя техническая строка */}
          <div className="mt-20 flex items-center justify-between font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            <span>Min · 10 км</span>
            <span>Пешком</span>
            <span>Через город</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center py-4 text-ink-muted text-[10px] font-technical uppercase tracking-[0.2em] relative z-10 border-t border-line-soft">
        OpenStreetMap · OSRM
      </footer>
    </div>
  );
}

// Компонент описания маршрута — в виде маршрутного листа
function RouteDescription({ route }: { route: Route }) {
  const streetSegments: { name: string; distance: number }[] = [];
  let currentStreet = '';
  let currentDistance = 0;
  
  for (const step of route.steps) {
    const streetName = step.name || 'безымянная дорога';
    if (streetName !== currentStreet) {
      if (currentStreet && currentDistance > 50) {
        streetSegments.push({ name: currentStreet, distance: currentDistance });
      }
      currentStreet = streetName;
      currentDistance = step.distance;
    } else {
      currentDistance += step.distance;
    }
  }
  if (currentStreet && currentDistance > 50) {
    streetSegments.push({ name: currentStreet, distance: currentDistance });
  }
  
  return (
    <div className="space-y-4">
      {/* Заголовок маршрутного листа */}
      <div className="border border-line-soft p-4 bg-paper-dark/30">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Маршрутный лист
          </div>
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            №{String(route.routeNumber).padStart(5, '0')}
          </div>
        </div>
        <div className="font-display text-xl text-ink">
          {route.direction}
        </div>
      </div>
      
      {/* Старт */}
      <div className="flex items-start gap-3 pb-3 border-b border-line-soft">
        <div className="font-display text-2xl text-ink leading-none w-8">A</div>
        <div className="flex-1">
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Старт
          </div>
          <div className="text-sm text-ink mt-0.5">
            {route.start.name 
              ? route.start.name.split(',').slice(0, 2).join(',')
              : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`}
          </div>
        </div>
      </div>
      
      {/* Путь */}
      <div>
        <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-3">
          Путь
        </div>
        <div className="space-y-1.5">
          {streetSegments.slice(0, 30).map((seg, i) => (
            <div key={i} className="flex items-baseline gap-3 text-sm">
              <div className="font-mono text-[10px] text-ink-muted w-6 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1 text-ink truncate">
                {seg.name}
              </div>
              <div className="font-mono text-[11px] text-ink-muted flex-shrink-0">
                {seg.distance >= 1000 ? `${(seg.distance / 1000).toFixed(1)} км` : `${Math.round(seg.distance)} м`}
              </div>
            </div>
          ))}
        </div>
        {streetSegments.length > 30 && (
          <div className="mt-2 font-technical text-[10px] uppercase tracking-[0.15em] text-ink-muted">
            + ещё {streetSegments.length - 30} участков
          </div>
        )}
      </div>
      
      {/* Финиш */}
      <div className="flex items-start gap-3 pt-3 border-t border-line-soft">
        <div className="font-display text-2xl text-route leading-none w-8">B</div>
        <div className="flex-1">
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Финиш
          </div>
          <div className="text-sm text-ink mt-0.5">
            {route.finish.name 
              ? route.finish.name.split(',').slice(0, 2).join(',')
              : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`}
          </div>
        </div>
      </div>
      
      {/* Итог */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-line-soft">
        <div>
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">Итого</div>
          <div className="font-display text-2xl text-ink mt-1">{formatDistance(route.distanceMeters)}</div>
        </div>
        <div>
          <div className="font-technical text-[10px] uppercase tracking-[0.2em] text-ink-muted">Время</div>
          <div className="font-display text-2xl text-ink mt-1">{formatDuration(route.durationSeconds)}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
