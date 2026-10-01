import jsPDF from 'jspdf';

// Загрузка шрифта с поддержкой полной кириллицы
export async function loadCyrillicFont(pdf: jsPDF): Promise<void> {
  try {
    // Используем Open Sans с поддержкой кириллицы
    const fontRegularUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/opensans/static/OpenSans-Regular.ttf';
    const fontBoldUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/opensans/static/OpenSans-Bold.ttf';
    
    console.log('Loading Open Sans font...');
    
    // Загружаем обычный шрифт
    const responseRegular = await fetch(fontRegularUrl);
    if (!responseRegular.ok) {
      throw new Error('Failed to load regular font');
    }
    
    const bufferRegular = await responseRegular.arrayBuffer();
    const uint8ArrayRegular = new Uint8Array(bufferRegular);
    
    // Конвертируем в base64
    let binaryRegular = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8ArrayRegular.length; i += chunkSize) {
      const chunk = uint8ArrayRegular.subarray(i, i + chunkSize);
      binaryRegular += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Regular = btoa(binaryRegular);
    
    console.log('Regular font loaded, adding to PDF...');
    
    pdf.addFileToVFS('OpenSans-Regular.ttf', base64Regular);
    pdf.addFont('OpenSans-Regular.ttf', 'OpenSans', 'normal');
    
    // Загружаем жирный шрифт
    const responseBold = await fetch(fontBoldUrl);
    if (!responseBold.ok) {
      throw new Error('Failed to load bold font');
    }
    
    const bufferBold = await responseBold.arrayBuffer();
    const uint8ArrayBold = new Uint8Array(bufferBold);
    
    let binaryBold = '';
    for (let i = 0; i < uint8ArrayBold.length; i += chunkSize) {
      const chunk = uint8ArrayBold.subarray(i, i + chunkSize);
      binaryBold += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Bold = btoa(binaryBold);
    
    console.log('Bold font loaded, adding to PDF...');
    
    pdf.addFileToVFS('OpenSans-Bold.ttf', base64Bold);
    pdf.addFont('OpenSans-Bold.ttf', 'OpenSans', 'bold');
    
    // Устанавливаем шрифт по умолчанию
    pdf.setFont('OpenSans', 'normal');
    
    console.log('Font successfully loaded');
  } catch (error) {
    console.error('Error loading font:', error);
    console.log('Using fallback font (may not support Cyrillic)');
    // Fallback
    pdf.setFont('helvetica');
  }
}
