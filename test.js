const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1-fK28mp5-BLpoKeQaJSPTGmtGD3hJZfv2CKyM4K1MdM';

async function test() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Suscriptores!A2:C',
  });

  const rows = res.data.values || [];

  const activos = rows
    .filter(row => row[2] && row[2].toLowerCase() === 'si') // valida Activo
    .map(row => ({
      nombre: row[0],
      telefono: row[1],
    }));

  console.log("Todos los registros:");
  console.log(rows);

  console.log("\nSolo activos:");
  console.log(activos);
}

test();