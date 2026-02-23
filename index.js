const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
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
    protocolTimeout: 180000, // 3 minutos para evitar timeout
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
  "Jamamucito",
  "Barahona Honey",
  "Tropical Poetry",
  "Ocoa Lavado",
  "Pico Duarte",
  "Arroyo Bonito"
];

const PESOS = ['8oz', '12oz', '16oz(1 libra)'];


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
    // 🔥 PRUEBA INMEDIATA
    await enviarMensajesASuscriptores("🧪 PRUEBA REAL");

    // ⏰ CRON 10 y 25 a las 9AM RD
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

    for (const user of suscriptores) {

      estados[user.telefono] = {
        paso: 'origen',
        pedidos: [],
        nombre: user.nombre,
        editando: null
      };

      await client.sendMessage(
        user.telefono,
`${prefijo ? prefijo + '\n\n' : ''}Hola ${user.nombre} ☕✨

Ya estamos en día de suscripción.

Estos son los orígenes disponibles:

${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Responde con el número del café que deseas.
La recomendación del tostador para este  mes es: Ocoa Lavado!`
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

    if (estado.paso === 'origen') {
      const origen = ORIGENES[parseInt(texto) - 1];
      if (!origen) return msg.reply('Número inválido.');

      estado.temp = { origen };
      estado.paso = 'peso';

      return msg.reply(`Elegiste *${origen}*.

Pesos disponibles:
${PESOS.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
    }

    if (estado.paso === 'peso') {
      const peso = PESOS[parseInt(texto) - 1];
      if (!peso) return msg.reply('Número inválido.');

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

      estado.temp.molienda = molienda;

      if (estado.editando !== null) {
        estado.pedidos[estado.editando] = estado.temp;
        estado.editando = null;
      } else {
        estado.pedidos.push(estado.temp);
      }

      estado.temp = null;
      estado.paso = 'otro';

      return msg.reply(`✅ Café guardado.

1. Agregar otro café
2. Ver resumen y confirmar`);
    }

    if (estado.paso === 'otro') {

      if (texto === '1') {
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

        await msg.reply(`🎉 Pedido confirmado.

Gracias ${estado.nombre} por ser parte de nuestra familia poética ☕`);

        delete estados[telefono];
        return;
      }

      if (texto === '2') {
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