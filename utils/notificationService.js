const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'server.log');

function logNotification(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [NOTIFICATION]: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log de notificação:', err);
        }
    });
}

const notificationService = {
    sendEmail: (to, subject, body) => {
        const message = `Email enviado para ${to} com assunto: ${subject} e corpo: ${body}`;
        logNotification(message);
        console.log(message); // Também loga no console para feedback imediato
    },
    sendSMS: (to, message) => {
        const msg = `SMS enviado para ${to} com mensagem: ${message}`;
        logNotification(msg);
        console.log(msg); // Também loga no console para feedback imediato
    }
};

module.exports = notificationService;