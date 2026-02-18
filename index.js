const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const { obtenerSuscriptores, guardarPedido } = require('./sheets');

const client = new Client({
  authStrategy: new LocalAuth()
});

const estados = {};

const ORIGENES = [
  "Jamamucito",
  "Barahona Honey",
  "Tropical Poetry",
  "Ocoa Lavado",
  "Pico Duarte",
  "Arroyo Bonito"
];

// ---------------- QR ----------------
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// ---------------- BOT LISTO ----------------
client.on('ready', () => {
  console.log('Bot listo ☕');

  cron.schedule(
    '0 9 10,25 * *',
    async () => {
      console.log('Enviando mensajes programados...');
      await enviarMensajesASuscriptores();
    },
    { timezone: "America/Santo_Domingo" }
  );

  setTimeout(async () => {
    console.log('Enviando prueba en 10 segundos...');
    await enviarMensajesASuscriptores("PRUEBA ☕");
  }, 10000);
});

// ---------------- INICIO CONVERSACIÓN ----------------
async function enviarMensajesASuscriptores(prefijo = "") {
  const suscriptores = await obtenerSuscriptores();

  if (!suscriptores.length) {
    console.log("No hay suscriptores activos.");
    return;
  }

  for (const user of suscriptores) {
    estados[user.telefono] = {
      paso: 'origen',
      pedidos: [],
      nombre: user.nombre
    };

    await client.sendMessage(
      user.telefono,
`${prefijo ? prefijo + '\n\n' : ''}Hola ${user.nombre} ☕✨

Ya estamos en día de suscripción.

Estos son los orígenes disponibles:

${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Responde con el número del café que deseas.`
    );
  }
}

// ---------------- MANEJO DE RESPUESTAS ----------------
client.on('message', async msg => {
  const telefono = msg.from;
  const texto = msg.body.trim();

  if (!estados[telefono]) return;

  const estado = estados[telefono];

  // PASO ORIGEN
  if (estado.paso === 'origen') {
    const origen = ORIGENES[parseInt(texto) - 1];
    if (!origen) return msg.reply('Número inválido.');

    estado.origen = origen;
    estado.paso = 'peso';

    return msg.reply(`Elegiste *${origen}*.

Pesos disponibles:
1. 220gr
2. 330gr
3. 1 libra`);
  }

  // PASO PESO
  if (estado.paso === 'peso') {
    const pesos = ['220gr', '330gr', '1 libra'];
    const peso = pesos[parseInt(texto) - 1];
    if (!peso) return msg.reply('Número inválido.');

    estado.peso = peso;
    estado.paso = 'molienda';

    return msg.reply(`¿Cómo lo prefieres?

1. Molido
2. En granos`);
  }

  // PASO MOLIENDA
  if (estado.paso === 'molienda') {
    const molienda =
      texto === '1' ? 'Molido' :
      texto === '2' ? 'En granos' :
      null;

    if (!molienda) return msg.reply('Número inválido.');

    estado.pedidos.push({
      origen: estado.origen,
      peso: estado.peso,
      molienda
    });

    estado.paso = 'otro';

    return msg.reply(`✅ Café agregado.

¿Qué deseas hacer ahora?

1. Agregar otro café
2. Ver resumen y confirmar
3. Cancelar pedido`);
  }

  // PASO OPCIONES
  if (estado.paso === 'otro') {

    if (texto === '1') {
      estado.paso = 'origen';
      return msg.reply(`Perfecto ☕

${ORIGENES.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
    }

    if (texto === '2') {
      estado.paso = 'confirmacion';

      const resumen = estado.pedidos
        .map((p, i) =>
          `${i + 1}. ${p.origen} - ${p.peso} - ${p.molienda}`
        )
        .join('\n');

      return msg.reply(`📋 *Resumen de tu pedido:*

${resumen}

¿Confirmas tu pedido?

1. Confirmar
2. Cancelar`);
    }

    if (texto === '3') {
      delete estados[telefono];
      return msg.reply('❌ Pedido cancelado.');
    }
  }

  // PASO CONFIRMACIÓN FINAL
  if (estado.paso === 'confirmacion') {

    if (texto === '1') {
      for (const p of estado.pedidos) {
        await guardarPedido({
          nombre: estado.nombre,
          telefono: telefono.replace('@c.us', ''),
          ...p
        });
      }

      await msg.reply(`🎉 Pedido confirmado.

Gracias ${estado.nombre} por tu pedido de este mes ☕`);

      delete estados[telefono];
    }

    if (texto === '2') {
      delete estados[telefono];
      return msg.reply('❌ Pedido cancelado.');
    }
  }
});

client.initialize();
