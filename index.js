const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const readline = require('readline');
const { obtenerSuscriptores, guardarPedido } = require('./sheets');

console.log("🚀 Iniciando bot...");

// =============================
// CONFIGURACIÓN CLIENTE OPTIMIZADA
// =============================

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "bot-session"
  }),
  puppeteer: {
    headless: true,
    protocolTimeout: 180000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-features=site-per-process',
      '--no-zygote',
      '--single-process'
    ]
  }
});

// =============================
// VARIABLES
// =============================

const estados = {};

const ORIGENES = [
  "Gajo de Toro",
  "Barahona Honey",
  "Tropical Poetry",
  "Ocoa Lavado",
  "Pico Duarte",
  "Arroyo Bonito",
  "Season´s Blend",
];

const PESOS = ['8oz', '12oz', '16oz(1 libra)'];


// =============================
// COMANDOS DESDE CONSOLA
// =============================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {

  if (input.trim().toLowerCase() === "estado") {

    const activos = Object.values(estados);

    if (!activos.length) {
      console.log("\n📊 No hay pedidos en proceso.\n");
      return;
    }

    console.log("\n📊 PEDIDOS EN PROCESO\n");

    activos.forEach(e => {
      console.log(
        `${e.nombre} — paso: ${e.paso} — cafés: ${e.pedidos.length}`
      );
    });

    console.log("");
  }

});


// =============================
// QR
// =============================

client.on('qr', qr => {
  console.log('\n📲 Escanea el QR:\n');
  qrcode.generate(qr, { small: true });
});


// =============================
// READY
// =============================

client.on('ready', async () => {

  console.log('✅ Bot listo ☕');

  try {

    console.log("📨 Enviando mensajes inmediatamente...");

    await enviarMensajesASuscriptores("☕ Sistema de pedidos activado");

    cron.schedule(
      '0 9 10,25 * *',
      async () => {
        console.log('⏰ Enviando mensajes programados...');
        await enviarMensajesASuscriptores();
      },
      { timezone: "America/Santo_Domingo" }
    );

  } catch (error) {
    console.error("Error en ready:", error);
  }

});


// =============================
// ENVIAR MENSAJES
// =============================

async function enviarMensajesASuscriptores(prefijo = "") {

  try {

    const suscriptores = await obtenerSuscriptores();

    if (!suscriptores.length) {
      console.log("⚠️ No hay suscriptores activos.");
      return;
    }

    console.log(`📊 Suscriptores encontrados: ${suscriptores.length}`);

    for (const user of suscriptores) {

      estados[user.telefono] = {
        paso: 'origen',
        pedidos: [],
        nombre: user.nombre,
        editando: null
      };

      console.log(`🟡 ${user.nombre} inició proceso de pedido`);

      await client.sendMessage(
        user.telefono,
`${prefijo ? prefijo + '\n\n' : ''}Hola ${user.nombre} ☕✨

¡Bienvenid@ al nuevo formato de elección de suscripción!

A continuación presentamos los orígenes disponible para elegir.

Responde el chat con el número del café que deseas.
${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}

La recomendación del tostador para este  mes es: Gajo de Toro`
      );

      console.log(`📩 Mensaje enviado a ${user.nombre}`);

    }

  } catch (error) {
    console.error("❌ Error enviando mensajes:", error);
  }

}


// =============================
// MANEJO DE MENSAJES
// =============================

client.on('message', async msg => {

  try {

    const telefono = msg.from;
    const texto = msg.body.trim().toLowerCase();

    if (!estados[telefono]) return;

    const estado = estados[telefono];

    console.log(`💬 ${estado.nombre}: ${texto}`);

    if (estado.paso === 'origen') {

      const origen = ORIGENES[parseInt(texto) - 1];
      if (!origen) return msg.reply('Número inválido.');

      console.log(`☕ ${estado.nombre} eligió origen: ${origen}`);

      estado.temp = { origen };
      estado.paso = 'peso';

      return msg.reply(`Elegiste *${origen}*.

Pesos disponibles:
${PESOS.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);

    }

    if (estado.paso === 'peso') {

      const peso = PESOS[parseInt(texto) - 1];
      if (!peso) return msg.reply('Número inválido.');

      console.log(`⚖️ ${estado.nombre} eligió peso: ${peso}`);

      estado.temp.peso = peso;
      estado.paso = 'molienda';

      return msg.reply(`¿Cómo lo prefieres?

1. Molido
2. En granos`);

    }

    if (estado.paso === 'molienda') {

      const molienda =
        texto === '1' ? 'Molido' :
        texto === '2' ? 'En granos' :
        null;

      if (!molienda) return msg.reply('Número inválido.');

      console.log(`🌀 ${estado.nombre} eligió molienda: ${molienda}`);

      estado.temp.molienda = molienda;

      if (estado.editando !== null) {
        estado.pedidos[estado.editando] = estado.temp;
        estado.editando = null;
      } else {
        estado.pedidos.push(estado.temp);
      }

      estado.temp = null;
      estado.paso = 'otro';

      console.log(`📦 ${estado.nombre} agregó un café`);

      return msg.reply(`✅ Café guardado.

1. Agregar otro café
2. Ver resumen y confirmar`);

    }

    if (estado.paso === 'otro') {

      if (texto === '1') {

        console.log(`➕ ${estado.nombre} agregará otro café`);

        estado.paso = 'origen';

        return msg.reply(`Selecciona otro origen:

${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);

      }

      if (texto === '2') {

        if (!estado.pedidos.length) {
          return msg.reply("No tienes cafés en tu pedido.");
        }

        estado.paso = 'confirmacion';

        const resumen = estado.pedidos
          .map((p, i) =>
            `${i + 1}. ${p.origen} - ${p.peso} - ${p.molienda}`
          )
          .join('\n');

        console.log(`📋 ${estado.nombre} viendo resumen`);

        return msg.reply(`📋 *Resumen de tu pedido:*

${resumen}

1. Confirmar pedido
2. Editar un café`);

      }

    }

    if (estado.paso === 'confirmacion') {

      if (texto === '1') {

        for (const p of estado.pedidos) {

          await guardarPedido({
            nombre: estado.nombre,
            telefono: telefono.replace('@c.us', ''),
            ...p,
            estado: "Confirmado"
          });

        }

        console.log(`✅ ${estado.nombre} TERMINÓ su pedido`);

        await msg.reply(`🎉 Pedido confirmado.

Gracias ${estado.nombre} por ser parte de nuestra familia poética ☕`);

        delete estados[telefono];
        return;

      }

      if (texto === '2') {

        console.log(`✏️ ${estado.nombre} editará su pedido`);

        const lista = estado.pedidos
          .map((p, i) =>
            `${i + 1}. ${p.origen} - ${p.peso} - ${p.molienda}`
          )
          .join('\n');

        estado.paso = 'editar';

        return msg.reply(`¿Cuál deseas editar?

${lista}

Responde con el número.`);

      }

    }

    if (estado.paso === 'editar') {

      const index = parseInt(texto) - 1;

      if (index < 0 || index >= estado.pedidos.length)
        return msg.reply('Número inválido.');

      console.log(`🔧 ${estado.nombre} editará café ${index + 1}`);

      estado.editando = index;
      estado.paso = 'origen';

      return msg.reply(`Selecciona nuevo origen:

${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);

    }

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
  }

});


// =============================
// ERRORES GLOBALES
// =============================

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
});


// =============================
// INICIAR
// =============================

client.initialize();