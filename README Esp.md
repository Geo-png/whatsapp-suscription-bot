# Bot de Suscripción de Café por WhatsApp

## Descripción General

El Bot de Suscripción de Café por WhatsApp es una herramienta de automatización desarrollada en Node.js diseñada para gestionar pedidos recurrentes de suscripciones de café a través de una conversación interactiva en WhatsApp. El bot guía a los suscriptores mediante un proceso estructurado de pedido en el que pueden seleccionar el origen del café, el tamaño del paquete y la preferencia de molienda. Los usuarios pueden revisar sus selecciones, agregar múltiples cafés, editar artículos y confirmar su pedido.

Una vez confirmado, los pedidos se almacenan automáticamente en Google Sheets, permitiendo que el negocio gestione el cumplimiento de las suscripciones de manera eficiente.

Este proyecto demuestra el uso de flujos conversacionales, manejo de estados, automatización programada e integración con servicios de datos externos.

---

# Características Principales

- Interacción automatizada en WhatsApp utilizando whatsapp-web.js
- Flujo de pedido guiado mediante mensajes conversacionales
- Selección de origen del café
- Selección del tamaño del paquete
- Selección del tipo de molienda (molido o en granos)
- Posibilidad de agregar múltiples cafés en un solo pedido
- Edición del pedido antes de la confirmación
- Vista previa del resumen del pedido
- Almacenamiento automático de pedidos en Google Sheets
- Envío programado de solicitudes de pedido
- Monitoreo en tiempo real de pedidos activos desde la consola
- Autenticación persistente utilizando LocalAuth
- Manejo de errores para evitar que el proceso se detenga

---

# Tecnologías Utilizadas

- Node.js
- whatsapp-web.js
- Puppeteer
- node-cron
- qrcode-terminal
- Google Sheets API

---

# Descripción de la Arquitectura

La aplicación sigue un enfoque de máquina de estados conversacional.

Cada suscriptor que interactúa con el bot tiene un estado interno almacenado en memoria. El bot cambia entre diferentes pasos de conversación dependiendo de las respuestas del usuario.

Componentes principales:

**Cliente de WhatsApp**  
Gestiona la conexión y el envío de mensajes a través de WhatsApp Web.

**Gestor de Estados de Conversación**  
Realiza el seguimiento del progreso de cada usuario durante el proceso de pedido.

**Lógica de Pedidos**  
Gestiona la selección de atributos del café y la validación del pedido.

**Planificador (Scheduler)**  
Envía solicitudes automáticas de pedido a los suscriptores en fechas programadas.

**Integración con Google Sheets**  
Almacena los pedidos confirmados para su posterior gestión y cumplimiento.

---

# Flujo de Conversación

El proceso de pedido está estructurado como una interacción paso a paso.

## Paso 1 — Selección del Origen del Café

El usuario recibe una lista de orígenes disponibles y selecciona uno respondiendo con el número correspondiente.

Ejemplo:

1. Gajo de Toro  
2. Barahona Honey  
3. Tropical Poetry  
4. Ocoa Lavado  
5. Pico Duarte  
6. Arroyo Bonito  
7. Season's Blend  

---

## Paso 2 — Selección del Tamaño del Paquete

El usuario selecciona el tamaño del paquete de café.

1. 8oz  
2. 12oz  
3. 16oz (1 libra)

---

## Paso 3 — Preferencia de Molienda

El usuario elige el tipo de molienda.

1. Molido  
2. En granos  

---

## Paso 4 — Opciones Adicionales

Después de agregar un café al pedido, el usuario puede:

1. Agregar otro café  
2. Ver el resumen del pedido  

---

## Paso 5 — Confirmación del Pedido

El usuario revisa el resumen del pedido y puede confirmarlo o editarlo.

1. Confirmar pedido  
2. Editar un café  

Cuando el pedido es confirmado:

- Cada café se guarda en Google Sheets
- El estado de la conversación se reinicia
- La sesión del pedido se completa

---

# Automatización Programada

El bot envía automáticamente solicitudes de pedido a todos los suscriptores en días específicos del mes utilizando un planificador cron.

Configuración actual:

- Día 10 de cada mes  
- Día 25 de cada mes  
- Hora: 09:00 AM  
- Zona horaria: America/Santo_Domingo  

El bot también envía una notificación inicial inmediatamente después de iniciar.

---

# Manejo de Estados

Cada interacción del usuario se rastrea mediante un objeto de estado almacenado en memoria.

Ejemplo de estructura:
telefono: {
paso: 'peso',
pedidos: [],
nombre: 'Juan',
editando: null
}


Esto permite que el bot gestione múltiples conversaciones simultáneas con diferentes suscriptores sin conflictos.

Los pasos de conversación incluyen:

- origen  
- peso  
- molienda  
- otro  
- confirmacion  
- editar  

---

# Monitoreo desde Consola

El bot incluye un comando de terminal para monitorear pedidos activos en tiempo real.

Comando:


estado


Ejemplo de salida:


Pedidos Activos

Juan Perez — paso: peso — cafés: 1
Ana Garcia — paso: origen — cafés: 0


Esta funcionalidad permite a los operadores ver qué suscriptores están realizando pedidos en ese momento.

---

# Estructura del Proyecto


project-root
│
├── index.js
├── sheets.js
├── package.json
└── .wwebjs_auth


## Descripción de Archivos

**index.js**  
Aplicación principal del bot. Maneja la conexión con WhatsApp, la lógica de conversación, la programación de tareas y el procesamiento de mensajes.

**sheets.js**  
Contiene las funciones que interactúan con Google Sheets para obtener suscriptores y guardar pedidos confirmados.

**package.json**  
Define las dependencias y scripts del proyecto.

**.wwebjs_auth**  
Almacena la sesión persistente de autenticación utilizada por whatsapp-web.js.

---

# Instalación

## 1. Clonar el repositorio


git clone https://github.com/yourusername/whatsapp-coffee-bot.git

cd whatsapp-coffee-bot


## 2. Instalar dependencias


npm install


Paquetes requeridos:


npm install whatsapp-web.js qrcode-terminal node-cron


---

# Integración con Google Sheets

El proyecto espera un módulo llamado `sheets.js` que exponga dos funciones:

- `obtenerSuscriptores()`
- `guardarPedido()`

Ejemplo de estructura:

```javascript
module.exports = {
  obtenerSuscriptores,
  guardarPedido
};
obtenerSuscriptores()

Devuelve una lista de suscriptores:

[
  {
    nombre: "Juan Perez",
    telefono: "1234567890@c.us"
  }
]
guardarPedido()

Guarda cada café confirmado como una nueva entrada en Google Sheets.

Ejecutar el Bot

Inicia la aplicación con:

node index.js

Cuando el bot se inicie, aparecerá un código QR en la terminal.

Escanea el código QR con WhatsApp para autenticar la sesión.

La autenticación se almacena localmente utilizando LocalAuth, permitiendo que el bot se reconecte automáticamente en futuras ejecuciones.

Manejo de Errores

La aplicación incluye manejadores globales de errores para evitar cierres inesperados del proceso.

Eventos gestionados:

unhandledRejection

uncaughtException

Los errores se registran en la consola para facilitar la depuración y el monitoreo.

Caso de Uso

Este sistema está diseñado para negocios que gestionan pedidos recurrentes de café mediante un modelo de suscripción.

Ejemplos:

Tostadores de café de especialidad

Servicios de suscripción de café

Clubes de café

Marcas de café directas al consumidor

El bot reduce la recolección manual de pedidos y estandariza el proceso de solicitud de órdenes.

Autor

@Geo-png

Desarrollado como una solución de automatización para gestionar pedidos de café por suscripción a través de WhatsApp.