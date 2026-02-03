/**
 * Sistema de Fidelidade - 10 Cortes = 1 Grátis
 * Barbearia Silva - 2026
 */

(function() {
    'use strict';

    console.log('[FIDELIDADE] Sistema de fidelidade inicializado');

    /**
     * Verifica se o cliente tem direito a corte grátis
     * VERSÃO OTIMIZADA - Usa endpoint dedicado no backend
     * @param {string} clienteNome - Nome do cliente
     * @param {string} clienteTelefone - Telefone do cliente
     * @param {number} barbeiroId - ID do barbeiro
     * @returns {Promise<{temDireito: boolean, total: number, proximoGratis: number}>}
     */
    async function verificarFidelidade(clienteNome, clienteTelefone, barbeiroId) {
        try {
            console.log('[FIDELIDADE] Verificando fidelidade:', {
                cliente: clienteNome,
                telefone: clienteTelefone,
                barbeiroId
            });

            // Construir query params
            const params = new URLSearchParams();
            if (clienteNome) params.append('cliente_nome', clienteNome);
            if (clienteTelefone) params.append('telefone', clienteTelefone);
            params.append('barbeiro_id', barbeiroId);

            // ✅ OTIMIZAÇÃO: Endpoint dedicado que retorna apenas o resultado calculado
            const response = await fetch(`/api/v1/horarios/fidelidade?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Erro ao verificar fidelidade: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('[FIDELIDADE] Resultado:', resultado);

            return {
                temDireito: resultado.temDireito,
                total: resultado.total,
                proximoGratis: resultado.proximoGratis
            };
        } catch (error) {
            console.error('[FIDELIDADE] Erro ao verificar fidelidade:', error);
            return {
                temDireito: false,
                total: 0,
                proximoGratis: 10
            };
        }
    }

    /**
     * Exibe toast de fidelidade
     * @param {number} totalCortes - Total de cortes realizados
     */
    function exibirToastFidelidade(totalCortes) {
        // Verificar se já exibiu toast recentemente (evitar spam)
        const ultimoToast = localStorage.getItem('ultimoToastFidelidade');
        const agora = Date.now();

        if (ultimoToast && (agora - parseInt(ultimoToast)) < 60000) {
            console.log('[FIDELIDADE] Toast já exibido recentemente, pulando...');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast-fidelidade';
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.5s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 48px;">🎉</div>
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">
                            Parabéns! Corte Grátis!
                        </h3>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                            Você completou ${totalCortes} cortes com este barbeiro!<br>
                            <strong>Seu próximo corte é GRÁTIS! 🎊</strong>
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Salvar timestamp
        localStorage.setItem('ultimoToastFidelidade', agora.toString());

        // Remover após 8 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 8000);

        // Adicionar animações CSS
        if (!document.getElementById('toast-fidelidade-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-fidelidade-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        console.log('[FIDELIDADE] ✅ Toast de fidelidade exibido!');
    }

    /**
     * Verifica fidelidade após criar/concluir horário
     * @param {object} horario - Dados do horário
     */
    async function verificarAposConclusao(horario) {
        if (horario.status !== 'concluido') {
            return;
        }

        const resultado = await verificarFidelidade(
            horario.cliente_nome,
            horario.telefone,
            horario.barbeiro_id
        );

        console.log('[FIDELIDADE] Resultado da verificação:', resultado);

        if (resultado.temDireito) {
            exibirToastFidelidade(resultado.total);
        } else if (resultado.proximoGratis <= 3) {
            // Exibir toast motivacional quando estiver perto (faltam 3 ou menos)
            exibirToastMotivacional(resultado.proximoGratis);
        }
    }

    /**
     * Exibe toast motivacional quando está perto de ganhar
     */
    function exibirToastMotivacional(faltam) {
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #0D7CA4;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            ">
                <strong>🔥 Faltam apenas ${faltam} corte${faltam > 1 ? 's' : ''} para ganhar 1 GRÁTIS!</strong>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Expor API global
    window.Fidelidade = {
        verificarFidelidade,
        exibirToastFidelidade,
        verificarAposConclusao
    };

    console.log('[FIDELIDADE] API exposta globalmente');
})();
