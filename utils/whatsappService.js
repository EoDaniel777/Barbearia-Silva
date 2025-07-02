const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'server.log');

function logWhatsappMessage(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WHATSAPP]: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log do WhatsApp:', err);
        }
    });
}

const whatsappService = {
    sendMessage: (to, message) => {
        const msg = `Mensagem WhatsApp enviada para ${to}: ${message}`;
        logWhatsappMessage(msg);
        console.log(msg); // Também loga no console para feedback imediato
    }
};

module.exports = whatsappService;