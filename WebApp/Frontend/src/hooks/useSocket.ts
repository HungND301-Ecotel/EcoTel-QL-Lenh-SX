// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/userAtoms';

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [user,setUser]=useAtom(userAtom)

    useEffect(() => {
        const userId = user?.id;

        if (userId && !socketService.isConnected) {
            socketService.connect(userId);
            setIsConnected(true);
        }
        if (!userId) {
            socketService.disconnect()
        }

    }, [user]);

    return socketService.getSocket();; // hoặc return socketService nếu muốn gọi thêm
};
