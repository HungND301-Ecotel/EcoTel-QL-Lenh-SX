import { io, Socket } from 'socket.io-client';

class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(userId: string): void {
        if (!this.socket) {
            this.socket = io(process.env.REACT_APP_SOCKET_API || 'ws://localhost:8080', {
                transports: ['websocket'],
                autoConnect: false,
            });
        }

        if (!this.socket.connected) {
            this.socket.connect();
        }

        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.socket?.emit('notification', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('🔴 Disconnected from server');
        });
    }

    public on(event: string, callback: (data: any) => void): void {
        this.socket?.on(event, callback);
    }

    public emit(event: string, data: any): void {
        this.socket?.emit(event, data);
    }

    public off(event: string): void {
        this.socket?.off(event);
    }

    public disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }

    public get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    getSocket() {
        return this.socket;
    }
}

export default SocketService.getInstance();
