// Placeholder for SeletorUsuario

import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { ChatUser, buscarUsuarios, findOrCreateConversation } from '../../services/chatInternoService';
import { useAuth } from '../../context/AuthContext';

interface SeletorUsuarioProps {
    onConversaIniciada: (conversaId: string) => void;
}

const SeletorUsuario: React.FC<SeletorUsuarioProps> = ({ onConversaIniciada }) => {
    const { user, escolaId } = useAuth();
    const [termoBusca, setTermoBusca] = useState('');
    const [resultados, setResultados] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);
    
    const debouncedBusca = useDebounce(termoBusca, 500);

    React.useEffect(() => {
        if (debouncedBusca && user && escolaId) {
            setLoading(true);
            buscarUsuarios(debouncedBusca, user.id, escolaId).then(data => {
                setResultados(data);
                setLoading(false);
            });
        } else {
            setResultados([]);
        }
    }, [debouncedBusca, user, escolaId]);

    const handleIniciarConversa = async (outroUsuarioId: string) => {
        if (!user) return;
        try {
            const novaConversa = await findOrCreateConversation(user.id, outroUsuarioId);
            onConversaIniciada(novaConversa.id);
        } catch (error) {
            console.error("Erro ao iniciar nova conversa", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por nome..."
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
            {loading && <p>Buscando...</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {resultados.map(u => (
                    <li key={u.user_id} onClick={() => handleIniciarConversa(u.user_id)} style={{cursor: 'pointer', padding: '8px', borderBottom: '1px solid #f0f0f0'}}>
                        {u.nome} ({u.role})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SeletorUsuario; 