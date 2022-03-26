import {Socket, Server} from 'socket.io';
import Database from "./database";
import { Server as HTTPServer} from "http";
import { PassportStatic } from "passport";

const MESSAGE_EVENTS = [
    'file-transfer',
    'private-message',
    'sdp-offer',
    'sdp-answer',
    'ice-candidate',
];

const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);

class WebSockets {
    private io: any;

    init(server: HTTPServer, passport: PassportStatic) {
        this.io = new Server(server);

        this.io.use(wrap(passport.initialize()));
        this.io.use(wrap(passport.session()));
        this.io.use(wrap(passport.authenticate(['jwt'])));

        this.io.use((socket: Socket, next: any) => {
            const { user } = socket.request as any;
            if (user) {
                next();
            } else {
                next(new Error("Unauthorized"))
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const { user } = socket.request as any;
            socket.join(`user-${user.id}`); // for personal events
            this.setupSocketEvents(socket);
            // const { roomId } = socket.handshake.query;
        });
    }

    setupSocketEvents(socket: Socket) {
        socket.on("disconnecting", (reason) => {
            const { user } = socket.request as any;
            // emit event that user disconnected
            socket.rooms.forEach(socketRoomId => {
                if (socketRoomId.startsWith('room-')) {
                    // remove user from all rooms
                    const roomId = socketRoomId.substring(5);
                    this.removeUserFromRoomInDatabase(user.id, roomId);
                    const leaveEvent = { type: 'user-left', userId: user.id, roomId };
                    this.emitEvent(`room-${roomId}`, 'room-members-update', leaveEvent);
                }
            });
            Database.removeUser(user.id);
        });

        MESSAGE_EVENTS.forEach(eventName => {
            socket.on(eventName, this.transmitMessage(socket, eventName));
        });
    }

    /**
     * @param to: string - can be either roomId or userId
     * @param eventName: string
     * @param message: object
     */
    public emitEvent(to: string, eventName: string, message: any) {
        this.io.to(to).emit(eventName, message);
    }


    public joinRoom(userId: string, roomName: string) {
        const socket = this.getSocketsByRoomName(`user-${userId}`)[0];
        socket.join(roomName);
    }

    public leaveRoom(userId: string, roomName: string) {
        const socket = this.getSocketsByRoomName(`user-${userId}`)[0];
        socket.leave(roomName);
    }


    private getSocketsByRoomName(roomName: string): Socket[] {
        const sockets: Socket[] = [];
        const ids = this.io.sockets.adapter.rooms.get(roomName);
        ids.forEach((id: string) => sockets.push(this.io.sockets.sockets.get(id)));
        return sockets;
    }


    // rubbish


    // TODO: emit event rather than have this method
    removeUserFromRoomInDatabase(userId: string, roomId: string) {
        const room = Database.getRoomById(roomId);

        if (room) {
            if (room.members.length <= 1) {
                // if this is the last user in room, just remove the entire room
                Database.removeRoom(roomId);
            } else {
                Database.removeUserFromRoom(userId, roomId);
            }
        }
    }

    transmitMessage(socket: Socket, eventName: string) {
        return (info: any) => {
            const { message, to } = info;
            const { user } = socket.request as any;
            socket.to(`user-${to}`).emit(eventName, {
                message,
                from: user.id,
            });
        }
    }
}

// Singleton
const webSockets = new WebSockets();
export default webSockets;
