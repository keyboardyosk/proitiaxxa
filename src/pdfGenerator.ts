import jsPDF from 'jspdf';
import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';
import { loadCyrillicFont } from './pdfFont';

export async function generatePDF(route: Route, mapImages?: string[]): Promise<void> {
  const routeNum = String(route.routeNumber).padStart(5, '0');
  const startName = route.start.name || `${route.start.lat.toFixed(4)}, ${route.start.lon.toFixed(4)}`;
  const finishName = route.finish.name || `${route.finish.lat.toFixed(4)}, ${route.finish.lon.toFixed(4)}`;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Загружаем шрифт с поддержкой кириллицы
  await loadCyrillicFont(pdf);
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  
  // Цвета
  const INK = [23, 23, 23] as const;
  const MUTED = [98, 98, 98] as const;
  const ROUTE = [217, 47, 47] as const;
  const PAPER = [241, 239, 232] as const;
  
  // ========== СТРАНИЦА 1: ОБЛОЖКА ==========
  pdf.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Рамка
  pdf.setDrawColor(184, 181, 173);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  
  // Верхняя информация
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('59.9°N · 30.3°E · САНКТ-ПЕТЕРБУРГ', margin + 10, margin + 10);
  pdf.text('EST. 2026', pageWidth - margin - 10, margin + 10, { align: 'right' });
  
  // Логотип
  const logoY = margin + 25;
  pdf.setFillColor(INK[0], INK[1], INK[2]);
  pdf.rect(margin + 10, logoY, 4, 4, 'F');
  pdf.setDrawColor(INK[0], INK[1], INK[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin + 14, logoY + 2, pageWidth - margin - 14, logoY + 2);
  pdf.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.circle(pageWidth - margin - 12, logoY + 2, 2, 'F');
  
  // Заголовок
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(54);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text('ПРОЙТИ', pageWidth / 2, 90, { align: 'center' });
  
  pdf.setFontSize(28);
  pdf.text('САНКТ-ПЕТЕРБУРГЪ', pageWidth / 2, 105, { align: 'center' });
  
  // Разделитель
  pdf.setDrawColor(184, 181, 173);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth / 2 - 30, 115, pageWidth / 2 + 30, 115);
  
  // Номер маршрута
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('МАРШРУТ', pageWidth / 2, 130, { align: 'center' });
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(48);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(`№${routeNum}`, pageWidth / 2, 150, { align: 'center' });
  
  // Направление
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('НАПРАВЛЕНИЕ', pageWidth / 2, 165, { align: 'center' });
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(route.direction, pageWidth / 2, 175, { align: 'center' });
  
  // Расстояние
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('РАССТОЯНИЕ', pageWidth / 2, 190, { align: 'center' });
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(42);
  pdf.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.text(`${(route.distanceMeters / 1000).toFixed(1)}`, pageWidth / 2 - 10, 210, { align: 'right' });
  pdf.setFontSize(20);
  pdf.text('КМ', pageWidth / 2 - 5, 210, { align: 'left' });
  
  // Старт
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('СТАРТ', margin + 10, 230);
  
  pdf.setFillColor(INK[0], INK[1], INK[2]);
  pdf.rect(margin + 10, 233, 3, 3, 'F');
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(startName.substring(0, 50), margin + 16, 236);
  
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.text(`${route.start.lat.toFixed(5)}, ${route.start.lon.toFixed(5)}`, margin + 15, 241);
  
  // Финиш
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('ФИНИШ', margin + 10, 250);
  
  pdf.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.circle(margin + 11.5, 254, 1.5, 'F');
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(finishName.substring(0, 50), margin + 16, 255);
  
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.text(`${route.finish.lat.toFixed(5)}, ${route.finish.lon.toFixed(5)}`, margin + 15, 260);
  
  // Время и дата
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text(`≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}`, margin + 10, 270);
  pdf.text(route.createdAt.toLocaleDateString('ru-RU'), pageWidth - margin - 10, 270, { align: 'right' });
  
  // Слоган
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(10);
  pdf.text('Не гулять. Пересечь город.', pageWidth / 2, 278, { align: 'center' });
  
  // ========== СТРАНИЦЫ КАРТ (если есть) ==========
  if (mapImages && mapImages.length > 0) {
    for (let i = 0; i < mapImages.length; i++) {
      const mapImage = mapImages[i];
      pdf.addPage();
      pdf.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      pdf.setDrawColor(184, 181, 173);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
      
      // Заголовок
      pdf.setFont('Roboto', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      pdf.text(mapImages.length > 1 ? `ПЕЧАТНАЯ КАРТА · ${i + 1}/${mapImages.length}` : 'ПЕЧАТНАЯ КАРТА', margin + 10, margin + 10);
      
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text(`Маршрут №${routeNum}`, margin + 10, margin + 18);
      
      pdf.setFont('Roboto', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      pdf.text(route.direction, pageWidth - margin - 10, margin + 10, { align: 'right' });
      pdf.text(formatDistance(route.distanceMeters), pageWidth - margin - 10, margin + 18, { align: 'right' });
      
      // Карта
      try {
        pdf.addImage(mapImage, 'JPEG', margin + 10, margin + 25, pageWidth - margin * 2 - 20, 180);
      } catch (err) {
        console.error('Error adding map image:', err);
      }
      
      // Легенда
      const legendY = margin + 210;
      
      pdf.setFillColor(INK[0], INK[1], INK[2]);
      pdf.rect(margin + 10, legendY, 3, 3, 'F');
      pdf.setFont('Roboto', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      pdf.text('A · СТАРТ', margin + 15, legendY + 2);
      
      pdf.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
      pdf.circle(margin + 40, legendY + 1.5, 1.5, 'F');
      pdf.text('B · ФИНИШ', margin + 44, legendY + 2);
      
      pdf.setDrawColor(ROUTE[0], ROUTE[1], ROUTE[2]);
      pdf.setLineWidth(0.8);
      pdf.line(margin + 70, legendY + 1.5, margin + 78, legendY + 1.5);
      pdf.text('МАРШРУТ', margin + 80, legendY + 2);
      
      pdf.text('© OpenStreetMap', pageWidth - margin - 10, legendY + 2, { align: 'right' });
    }
  }
  
  // ========== СТРАНИЦА 3: МАРШРУТНЫЙ ЛИСТ ==========
  pdf.addPage();
  pdf.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setDrawColor(184, 181, 173);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  
  // Заголовок
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('МАРШРУТНЫЙ ЛИСТ', margin + 10, margin + 10);
  pdf.text(`№${routeNum}`, pageWidth - margin - 10, margin + 10, { align: 'right' });
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(route.direction, margin + 10, margin + 20);
  
  pdf.setDrawColor(INK[0], INK[1], INK[2]);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 10, margin + 23, pageWidth - margin - 10, margin + 23);
  
  // Старт
  pdf.setFillColor(INK[0], INK[1], INK[2]);
  pdf.rect(margin + 10, margin + 27, 2.5, 2.5, 'F');
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text('A · СТАРТ', margin + 15, margin + 29);
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(10);
  pdf.text(startName.substring(0, 50), pageWidth - margin - 10, margin + 29, { align: 'right' });
  
  pdf.line(margin + 10, margin + 33, pageWidth - margin - 10, margin + 33);
  
  // Путь
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('ПУТЬ', margin + 10, margin + 38);
  
  const allSteps = route.steps.filter(s => s.distance > 10).slice(0, 60);
  let y = margin + 43;
  
  for (let i = 0; i < allSteps.length; i++) {
    const step = allSteps[i];
    const num = String(i + 1).padStart(2, '0');
    const dist = step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} км` : `${Math.round(step.distance)} м`;
    
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    pdf.text(num, margin + 10, y);
    
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(INK[0], INK[1], INK[2]);
    const stepName = (step.name || 'Продолжайте движение').substring(0, 60);
    pdf.text(stepName, margin + 18, y);
    
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
    pdf.text(dist, pageWidth - margin - 10, y, { align: 'right' });
    
    y += 4;
    
    if (y > pageHeight - margin - 30) {
      break;
    }
  }
  
  // Финиш
  y += 3;
  pdf.setDrawColor(INK[0], INK[1], INK[2]);
  pdf.line(margin + 10, y, pageWidth - margin - 10, y);
  y += 4;
  
  pdf.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.circle(margin + 11.5, y + 1.5, 1.5, 'F');
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.text('B · ФИНИШ', margin + 15, y + 2);
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(finishName.substring(0, 50), pageWidth - margin - 10, y + 2, { align: 'right' });
  
  // Итог
  y += 8;
  pdf.setDrawColor(184, 181, 173);
  pdf.line(margin + 10, y, pageWidth - margin - 10, y);
  y += 5;
  
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('ИТОГО', margin + 10, y);
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(formatDistance(route.distanceMeters), margin + 30, y);
  
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('≈ ВРЕМЯ', pageWidth / 2, y);
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(formatDuration(route.durationSeconds), pageWidth / 2 + 22, y);
  
  // ========== СТРАНИЦА 4: ЛИСТ ПРОХОЖДЕНИЯ ==========
  pdf.addPage();
  pdf.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setDrawColor(184, 181, 173);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  
  // Заголовок
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ', margin + 10, margin + 10);
  pdf.text(`№${routeNum}`, pageWidth - margin - 10, margin + 10, { align: 'right' });
  
  pdf.setFont('Roboto', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text('МАРШРУТ ПРОЙДЕН', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Символ
  pdf.setFillColor(INK[0], INK[1], INK[2]);
  pdf.rect(pageWidth / 2 - 20, margin + 35, 3, 3, 'F');
  pdf.setDrawColor(INK[0], INK[1], INK[2]);
  pdf.setLineWidth(0.4);
  pdf.line(pageWidth / 2 - 17, margin + 36.5, pageWidth / 2 + 17, margin + 36.5);
  pdf.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  pdf.circle(pageWidth / 2 + 18.5, margin + 36.5, 1.5, 'F');
  
  // Поля для заполнения
  let passY = margin + 55;
  
  const fields = [
    { label: 'ДАТА', width: pageWidth - margin * 2 - 20 },
    { label: 'ВРЕМЯ СТАРТА', width: (pageWidth - margin * 2 - 30) / 2 },
    { label: 'ВРЕМЯ ФИНИША', width: (pageWidth - margin * 2 - 30) / 2 },
    { label: 'ФАКТИЧЕСКОЕ ВРЕМЯ', width: pageWidth - margin * 2 - 20 },
  ];
  
  for (const field of fields) {
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    pdf.text(field.label, margin + 10, passY);
    passY += 3;
    pdf.setDrawColor(184, 181, 173);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 10, passY + 5, margin + 10 + field.width, passY + 5);
    passY += 14;
  }
  
  // Заметки
  passY += 5;
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('ЗАМЕТКИ', margin + 10, passY);
  passY += 5;
  
  for (let i = 0; i < 7; i++) {
    pdf.setDrawColor(184, 181, 173);
    pdf.setLineWidth(0.2);
    pdf.line(margin + 10, passY, pageWidth - margin - 10, passY);
    passY += 8;
  }
  
  // Слоган
  pdf.setFont('Roboto', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  pdf.text('Не гулять. Пересечь город.', pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
  
  // Сохраняем PDF
  pdf.save(`proiti-spb-${routeNum}.pdf`);
}
