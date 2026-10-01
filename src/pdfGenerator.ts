import jsPDF from 'jspdf';
import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';

export function generatePDF(route: Route): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // === СТРАНИЦА 1: ОБЛОЖКА ===
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.text('ПРОЙТИ', pageWidth / 2, 60, { align: 'center' });
  doc.text('САНКТ-ПЕТЕРБУРГЪ', pageWidth / 2, 75, { align: 'center' });
  
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.text('Не гулять. Пересечь город.', pageWidth / 2, 95, { align: 'center' });
  
  // Линия-разделитель
  doc.setLineWidth(0.5);
  doc.line(margin, 110, pageWidth - margin, 110);
  
  // Параметры маршрута
  doc.setFontSize(12);
  let y = 130;
  
  doc.setFont('times', 'bold');
  doc.text(`Маршрут №${route.routeNumber}`, margin, y);
  y += 10;
  
  doc.setFont('times', 'normal');
  doc.text(`Направление: ${route.direction}`, margin, y);
  y += 8;
  doc.text(`Расстояние: ${formatDistance(route.distanceMeters)}`, margin, y);
  y += 8;
  doc.text(`Время: ${formatDuration(route.durationSeconds)}`, margin, y);
  y += 8;
  doc.text(`Статус: пешком`, margin, y);
  y += 15;
  
  doc.setFont('times', 'bold');
  doc.text('Старт:', margin, y);
  doc.setFont('times', 'normal');
  const startLabel = route.start.name 
    ? route.start.name.split(',').slice(0, 2).join(',')
    : `${route.start.lat.toFixed(4)}, ${route.start.lon.toFixed(4)}`;
  doc.text(startLabel, margin + 30, y);
  y += 8;
  
  doc.setFont('times', 'bold');
  doc.text('Финиш:', margin, y);
  doc.setFont('times', 'normal');
  const finishLabel = route.finish.name 
    ? route.finish.name.split(',').slice(0, 2).join(',')
    : `${route.finish.lat.toFixed(4)}, ${route.finish.lon.toFixed(4)}`;
  doc.text(finishLabel, margin + 30, y);
  y += 15;
  
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text(`Создано: ${route.createdAt.toLocaleDateString('ru-RU')} ${route.createdAt.toLocaleTimeString('ru-RU')}`, margin, y);
  
  // === СТРАНИЦА 2: КАРТА (схема) ===
  doc.addPage();
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('Карта маршрута', pageWidth / 2, margin, { align: 'center' });
  
  // Рисуем простую схему маршрута
  const mapY = 40;
  const mapHeight = 180;
  const mapWidth = contentWidth;
  
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.rect(margin, mapY, mapWidth, mapHeight);
  
  // Находим bounds маршрута
  if (route.geometry.length > 0) {
    const lats = route.geometry.map(g => g[0]);
    const lons = route.geometry.map(g => g[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const latRange = maxLat - minLat || 0.01;
    const lonRange = maxLon - minLon || 0.01;
    
    // Рисуем линию маршрута
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    
    const points: [number, number][] = route.geometry.map(([lat, lon]) => {
      const x = margin + ((lon - minLon) / lonRange) * mapWidth;
      const y = mapY + mapHeight - ((lat - minLat) / latRange) * mapHeight;
      return [x, y];
    });
    
    // Рисуем упрощённую линию (каждые N-ные точки)
    const step = Math.max(1, Math.floor(points.length / 200));
    for (let i = 0; i < points.length - step; i += step) {
      doc.line(points[i][0], points[i][1], points[i + step][0], points[i + step][1]);
    }
    
    // Стартовая точка
    doc.setFillColor(34, 197, 94);
    doc.circle(points[0][0], points[0][1], 3, 'F');
    
    // Финишная точка
    doc.setFillColor(239, 68, 68);
    const lastPoint = points[points.length - 1];
    doc.circle(lastPoint[0], lastPoint[1], 3, 'F');
    
    // Подписи
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text('СТАРТ', points[0][0] + 5, points[0][1]);
    doc.setTextColor(239, 68, 68);
    doc.text('ФИНИШ', lastPoint[0] + 5, lastPoint[1]);
    doc.setTextColor(0, 0, 0);
  }
  
  // Подпись карты
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text(`Маршрут №${route.routeNumber} · ${route.direction} · ${formatDistance(route.distanceMeters)}`, pageWidth / 2, mapY + mapHeight + 10, { align: 'center' });
  
  // === СТРАНИЦЫ 3+: ОПИСАНИЕ МАРШРУТА ===
  doc.addPage();
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('Описание маршрута', pageWidth / 2, margin, { align: 'center' });
  
  let descY = margin + 15;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  
  // Группируем шаги по названиям улиц
  const streetSegments: { name: string; distance: number }[] = [];
  let currentStreet = '';
  let currentDistance = 0;
  
  for (const step of route.steps) {
    const streetName = step.name || 'безымянная дорога';
    if (streetName !== currentStreet) {
      if (currentStreet && currentDistance > 0) {
        streetSegments.push({ name: currentStreet, distance: currentDistance });
      }
      currentStreet = streetName;
      currentDistance = step.distance;
    } else {
      currentDistance += step.distance;
    }
  }
  if (currentStreet && currentDistance > 0) {
    streetSegments.push({ name: currentStreet, distance: currentDistance });
  }
  
  // Выводим описание
  doc.setFont('times', 'bold');
  doc.text('Путь пролегает по:', margin, descY);
  descY += 8;
  doc.setFont('times', 'normal');
  
  for (const segment of streetSegments) {
    if (descY > pageHeight - margin - 20) {
      doc.addPage();
      descY = margin;
    }
    const distStr = segment.distance >= 1000 
      ? `${(segment.distance / 1000).toFixed(1)} км`
      : `${Math.round(segment.distance)} м`;
    doc.text(`• ${segment.name} — ${distStr}`, margin + 5, descY);
    descY += 7;
  }
  
  // Итог
  descY += 10;
  if (descY > pageHeight - margin - 30) {
    doc.addPage();
    descY = margin;
  }
  doc.setLineWidth(0.3);
  doc.line(margin, descY, pageWidth - margin, descY);
  descY += 10;
  
  doc.setFont('times', 'bold');
  doc.text(`Итого: ${formatDistance(route.distanceMeters)}`, margin, descY);
  descY += 8;
  doc.text(`Время в пути: ${formatDuration(route.durationSeconds)}`, margin, descY);
  
  // === ПОСЛЕДНЯЯ СТРАНИЦА: ЛИСТ ПРОХОЖДЕНИЯ ===
  doc.addPage();
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('ЛИСТ ПРОХОЖДЕНИЯ', pageWidth / 2, margin + 10, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
  
  let passY = margin + 35;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  
  doc.text(`Маршрут №${route.routeNumber}`, margin, passY);
  passY += 10;
  doc.text(`Направление: ${route.direction}`, margin, passY);
  passY += 10;
  doc.text(`Расстояние: ${formatDistance(route.distanceMeters)}`, margin, passY);
  passY += 20;
  
  // Поля для заполнения
  doc.setFont('times', 'bold');
  doc.text('Дата прохождения:', margin, passY);
  passY += 10;
  doc.setLineWidth(0.3);
  doc.line(margin, passY, pageWidth - margin, passY);
  passY += 15;
  
  doc.text('Время старта:', margin, passY);
  passY += 10;
  doc.line(margin, passY, margin + 80, passY);
  passY += 15;
  
  doc.text('Время финиша:', margin, passY);
  passY += 10;
  doc.line(margin, passY, margin + 80, passY);
  passY += 15;
  
  doc.text('Фактическое время:', margin, passY);
  passY += 10;
  doc.line(margin, passY, margin + 80, passY);
  passY += 20;
  
  doc.text('Заметки:', margin, passY);
  passY += 10;
  for (let i = 0; i < 5; i++) {
    doc.line(margin, passY, pageWidth - margin, passY);
    passY += 12;
  }
  
  // Сохраняем
  doc.save(`proiti-spb-${route.routeNumber}.pdf`);
}
