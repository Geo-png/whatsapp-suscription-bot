# WhatsApp Coffee Subscription Bot

## Overview

The WhatsApp Coffee Subscription Bot is a Node.js automation tool designed to manage recurring coffee subscription orders through an interactive WhatsApp conversation. The bot guides subscribers through a structured ordering process where they can select coffee origin, package size, and grind preference. Users can review their selections, add multiple coffees, edit items, and confirm their order.

Once confirmed, orders are automatically stored in Google Sheets, allowing the business to manage subscription fulfillment efficiently.

This project demonstrates the use of conversational workflows, state management, scheduled automation, and integration with external data services.

---

## Key Features

- Automated WhatsApp interaction using whatsapp-web.js
- Guided order workflow through conversational prompts
- Coffee origin selection
- Package size selection
- Grind preference selection (ground or whole bean)
- Ability to add multiple coffees to a single order
- Order editing before confirmation
- Order summary preview
- Automatic order storage in Google Sheets
- Scheduled order request messages
- Real-time console monitoring of active orders
- Persistent authentication using LocalAuth
- Error handling to prevent process crashes

---

## Technologies Used

- Node.js
- whatsapp-web.js
- Puppeteer
- node-cron
- qrcode-terminal
- Google Sheets API

---

## Architecture Overview

The application follows a conversational state-machine approach.

Each subscriber interacting with the bot has an internal state stored in memory. The bot transitions between different conversation steps depending on user responses.

Main components:

- **WhatsApp Client**  
  Handles connection and messaging through WhatsApp Web.

- **Conversation State Manager**  
  Tracks the progress of each user during the ordering process.

- **Order Logic**  
  Handles selection of coffee attributes and order validation.

- **Scheduler**  
  Sends automated order prompts to subscribers on scheduled dates.

- **Google Sheets Integration**  
  Stores confirmed orders for fulfillment.

---

## Conversation Flow

The ordering process is structured as a step-by-step interaction.

### Step 1 — Coffee Origin Selection

The user receives a list of available coffee origins and selects one by replying with the corresponding number.

Example:
Gajo de Toro

Barahona Honey

Tropical Poetry

Ocoa Lavado

Pico Duarte

Arroyo Bonito

Season's Blend

---

### Step 2 — Package Size Selection

The user selects the size of the coffee package.


---

### Step 3 — Grind Preference

The user chooses the grind type.

---

### Step 4 — Additional Options

After adding a coffee to the order, the user can either add another coffee or proceed to the order summary.

---

### Step 5 — Order Confirmation

The user reviews the order summary and confirms or edits the order.

When the order is confirmed:

- Each coffee item is saved in Google Sheets
- The conversation state is cleared
- The order session is completed

---

## Scheduled Automation

The bot automatically sends order prompts to all subscribers on specific days of the month using a cron scheduler.

Current configuration:

- Day 10 of each month
- Day 25 of each month
- Time: 09:00 AM
- Timezone: America/Santo_Domingo

The bot also sends an initial notification immediately after startup.

---

## State Management

Each user interaction is tracked using an in-memory state object.

Example structure:
telefono: {
paso: 'peso',
pedidos: [],
nombre: 'Juan',
editando: null
}


This allows the bot to handle multiple simultaneous conversations with different subscribers without conflicts.

Conversation steps include:

- origen
- peso
- molienda
- otro
- confirmacion
- editar

---

## Console Monitoring

The bot includes a terminal command to monitor active orders in real time.

Command:
estado

Example output:
Active Orders

Juan Perez — step: peso — coffees: 1
Ana Garcia — step: origen — coffees: 0


This feature helps operators track which subscribers are currently placing orders.

---

## Project Structure
project-root
│
├── index.js
├── sheets.js
├── package.json
└── .wwebjs_auth


### File Descriptions

**index.js**  
Main bot application. Handles WhatsApp connection, conversation logic, scheduling, and message processing.

**sheets.js**  
Contains functions that interact with Google Sheets for retrieving subscribers and saving confirmed orders.

**package.json**  
Defines project dependencies and scripts.

**.wwebjs_auth**  
Stores the persistent authentication session used by whatsapp-web.js.

---

## Installation

### 1. Clone the Repository
git clone https://github.com/yourusername/whatsapp-coffee-bot.git

cd whatsapp-coffee-bot

### 2. Install Dependencies
npm install


Required packages:
npm install whatsapp-web.js qrcode-terminal node-cron


---

## Google Sheets Integration

The project expects a module named `sheets.js` that exposes two functions:

- `obtenerSuscriptores()`
- `guardarPedido()`

Example structure:

```javascript
module.exports = {
  obtenerSuscriptores,
  guardarPedido
};

obtenerSuscriptores()

Returns a list of subscribers:
[
  {
    nombre: "Juan Perez",
    telefono: "1234567890@c.us"
  }
]
guardarPedido()

Stores each confirmed coffee item as a new entry in Google Sheets.
Running the Bot

Start the application with:

node index.js

When the bot starts, a QR code will appear in the terminal.

Scan the QR code using WhatsApp to authenticate the session.

Authentication is stored locally using LocalAuth, allowing the bot to reconnect automatically on future runs.
Error Handling

The application includes global error handlers to prevent unexpected shutdowns.

Handled events:

unhandledRejection

uncaughtException

Errors are logged to the console to facilitate debugging and monitoring.

Practical Use Case

This system is designed for businesses that manage recurring coffee orders through a subscription model.

Examples include:

Specialty coffee roasters

Coffee subscription services

Coffee clubs

Direct-to-consumer coffee brands

The bot reduces manual order collection and standardizes the ordering process.

Author @Geo-png

Developed as a practical automation solution for managing subscription-based coffee orders through WhatsApp.
