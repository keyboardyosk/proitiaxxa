import jsPDF from 'jspdf';

// Загрузка шрифта с поддержкой полной кириллицы
export async function loadCyrillicFont(pdf: jsPDF): Promise<void> {
  try {
    // Используем Roboto из надёжного источника
    const fontRegularUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto%5Bwdth%2Cwght%5D.ttf';
    const fontBoldUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto%5Bwdth%2Cwght%5D.ttf';
    
    console.log('Loading font...');
    
    // Загружаем обычный шрифт
    const responseRegular = await fetch(fontRegularUrl);
    if (!responseRegular.ok) {
      throw new Error('Failed to load regular font');
    }
    
    const bufferRegular = await responseRegular.arrayBuffer();
    const uint8ArrayRegular = new Uint8Array(bufferRegular);
    
    // Конвертируем в base64 более эффективно
    let binaryRegular = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8ArrayRegular.length; i += chunkSize) {
      const chunk = uint8ArrayRegular.subarray(i, i + chunkSize);
      binaryRegular += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Regular = btoa(binaryRegular);
    
    console.log('Font loaded, adding to PDF...');
    
    pdf.addFileToVFS('Roboto-Regular.ttf', base64Regular);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    // Для жирного используем тот же шрифт (variable font)
    pdf.addFileToVFS('Roboto-Bold.ttf', base64Regular);
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    
    // Устанавливаем шрифт по умолчанию
    pdf.setFont('Roboto', 'normal');
    
    console.log('Font successfully loaded');
  } catch (error) {
    console.error('Error loading font:', error);
    console.log('Using fallback font (may not support Cyrillic)');
    // Fallback
    pdf.setFont('helvetica');
  }
}
