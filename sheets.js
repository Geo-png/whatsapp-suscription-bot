const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1-fK28mp5-BLpoKeQaJSPTGmtGD3hJZfv2CKyM4K1MdM';

// 🔹 OBTENER SUSCRIPTORES ACTIVOS
async function obtenerSuscriptores() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Suscriptores!A2:C',
  });

  const rows = res.data.values || [];

  return rows
    .filter(row => row[2] && row[2].toLowerCase() === 'si')
    .map(row => ({
      nombre: row[0],
      telefono: row[1] + '@c.us'
    }));
}

// 🔹 GUARDAR PEDIDO
async function guardarPedido(pedido) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pedidos!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toLocaleString(),
        pedido.nombre,
        pedido.telefono,
        pedido.origen,
        pedido.peso,
        pedido.molienda,
        pedido.estado || 'Pendiente'
      ]]
    }
  });
}

module.exports = { obtenerSuscriptores, guardarPedido };