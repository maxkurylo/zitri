import {Socket, Server} from 'socket.io';
import { Server as HTTPServer} from "http";
import { PassportStatic } from "passport";
import { Subject } from 'rxjs'

const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);

class WebSockets {
    private io: any;

    private eventSubject = new Subject<SocketMessage>();
    public event$ = this.eventSubject.asObservable();

    /**
     *
     * @param server - HttpServer
     * @param passport - Passport strategy
     */
    public init(server: HTTPServer, passport?: PassportStatic) {
        this.io = new Server(server);

        if (passport) {
            this.setupAuthentication(passport);
        }

        this.io.on('connection', (socket: Socket) => {
            const authUser = (socket.request as any).user;
            // const { roomId } = socket.handshake.query;
            if (authUser && authUser.id) {
                socket.join(authUser.id);
            }
            this.setupSocketEvents(socket);
        });
    }

    private setupAuthentication(passport: PassportStatic) {
        this.io.use(wrap(passport.initialize()));
        this.io.use(wrap(passport.session()));
        this.io.use(wrap(passport.authenticate(['jwt'])));

        this.io.use((socket: Socket, next: any) => {
            const authUser = (socket.request as any).user;
            if (authUser && authUser.id) {
                next();
            } else {
                console.warn('Unauthorized socket connection attempt');
                next(new Error("Unauthorized"))
            }
        });
    }

    private setupSocketEvents(socket: Socket) {
        socket.on("disconnecting", () => {
            const authUser = (socket.request as any).user;
            if (authUser && authUser.id) {
                this.eventSubject.next({
                    type: 'user-disconnected',
                    message: authUser.id
                });
            }
        });

        socket.on('message', (message: SocketMessage) => {
            const authUser = (socket.request as any).user;
            if (!message || !authUser) {
                return;
            }
            message.from = authUser.id;
            if (message.forServer) {
                this.eventSubject.next(message);
            }
            if (message.to) {
                message.to.forEach(roomId => socket.to(roomId).emit('message', message));
            }
        });
    }

    /**
     * @param socketMessage
     */
    public sendMessage(socketMessage: SocketMessage) {
        if (socketMessage.to) {
            socketMessage.to.forEach(to => {
                this.io.to(to).emit('message', socketMessage as any);
            });
        }

    }


    public joinRoom(userId: string, roomName: string) {
        const socket = this.getSocketsByRoomName(userId)[0];
        if (socket) {
            socket.join(roomName);
        } else {
            console.warn(`Join room: Socket with room ${userId} no found`);
        }
    }

    public leaveRoom(userId: string, roomName: string) {
        const socket = this.getSocketsByRoomName(userId)[0];
        if (socket) {
            socket.leave(roomName);
        } else {
            console.warn(`Leave room: Socket with room ${userId} no found`);
        }
    }


    private getSocketsByRoomName(roomName: string): Socket[] {
        const sockets: Socket[] = [];
        const ids = this.io.sockets.adapter.rooms.get(roomName);
        ids?.forEach((id: string) => sockets.push(this.io.sockets.sockets.get(id)));
        return sockets;
    }
}

// Singleton
const webSockets = new WebSockets();
export default webSockets;


// Socket message which will be transferred directly to
export interface SocketMessage {
    type: SocketMessageType;
    message: any;
    to?: string[];   // broadcast to socket.io roomId
    from?: string;        // user id who send an event
    forServer?: boolean;  // is this message for BE
}

export type SocketMessageType = 'user-disconnected' | 'room-user-joined' | 'room-user-left';