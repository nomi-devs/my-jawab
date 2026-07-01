// src/utils/exportUtils.js

/**
 * Flattens a nested object into a single-level object with dot-notation keys.
 * @param {Object} obj - The object to flatten.
 * @param {string} prefix - The prefix for the keys (internal use).
 * @returns {Object} - The flattened object.
 */
export const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (
      typeof obj[k] === 'object' &&
      obj[k] !== null &&
      !Array.isArray(obj[k]) &&
      !(obj[k] instanceof Date)
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data - The data to convert.
 * @returns {string} - The CSV string.
 */
export const convertToCSV = (data) => {
  if (!data || !data.length) return '';

  const flattenedData = data.map((item) => flattenObject(item));
  const headers = Object.keys(flattenedData[0]);

  const csvRows = [
    headers.join(','), // Header row
    ...flattenedData.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName] ?? '';
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    ),
  ];

  return csvRows.join('\n');
};

/**
 * Converts an array of objects to a basic Excel-compatible HTML format.
 * @param {Array<Object>} data - The data to convert.
 * @returns {string} - The HTML string.
 */
export const convertToExcelHTML = (data) => {
  if (!data || !data.length) return '';

  const flattenedData = data.map((item) => flattenObject(item));
  const headers = Object.keys(flattenedData[0]);

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data Export</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc; }
        td { border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${flattenedData
            .map(
              (row) => `
            <tr>
              ${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
};

/**
 * Triggers a file download in the browser.
 * @param {string} content - The content to download.
 * @param {string} fileName - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 */
export const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
