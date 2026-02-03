// Firebase Configuration - HOMOLOGAÇÃO
// Configuração do projeto Barbearia Silva (Ambiente de Homologação)
// https://console.firebase.google.com/project/barbeariahom

// ⚠️ NOTA: Essas credenciais são PÚBLICAS (frontend)
// Elas podem estar no código porque são para o Firebase Web SDK
// Para produção, será configurado via variáveis de ambiente no painel de hospedagem

const firebaseConfig = {
    apiKey: "REMOVED_KEY",
    authDomain: "barbeariahom.firebaseapp.com",
    projectId: "barbeariahom",
    storageBucket: "barbeariahom.firebasestorage.app",
    messagingSenderId: "799723640449",
    appId: "1:799723640449:web:1b99cf357e7fca8c009f80",
    measurementId: "G-EN75CG86CW"
};

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
