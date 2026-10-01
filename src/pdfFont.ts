import jsPDF from 'jspdf';

// Загрузка шрифта с поддержкой кириллицы
export async function loadCyrillicFont(pdf: jsPDF): Promise<void> {
  try {
    // Загружаем шрифт Roboto с поддержкой кириллицы
    const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2';
    const response = await fetch(fontUrl);
    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    // Добавляем шрифт в jsPDF
    pdf.addFileToVFS('Roboto-Regular.ttf', base64);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    // Устанавливаем шрифт по умолчанию
    pdf.setFont('Roboto');
  } catch (error) {
    console.error('Error loading font:', error);
    // Fallback на стандартный шрифт
    pdf.setFont('helvetica');
  }
}
