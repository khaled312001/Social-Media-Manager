import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, { userId: string; workspaceId?: string }>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      });

      this.connectedClients.set(client.id, { userId: payload.sub });
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(@ConnectedSocket() client: Socket, @MessageBody() data: { workspaceId: string }) {
    client.join(`workspace:${data.workspaceId}`);
    const clientData = this.connectedClients.get(client.id);
    if (clientData) clientData.workspaceId = data.workspaceId;
    return { event: 'joined', workspaceId: data.workspaceId };
  }

  @SubscribeMessage('leave_workspace')
  handleLeaveWorkspace(@ConnectedSocket() client: Socket, @MessageBody() data: { workspaceId: string }) {
    client.leave(`workspace:${data.workspaceId}`);
    return { event: 'left', workspaceId: data.workspaceId };
  }

  // ─── Emit helpers used by other services ──────────────────────

  emitToWorkspace(workspaceId: string, event: string, data: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitNewMessage(workspaceId: string, message: unknown) {
    this.emitToWorkspace(workspaceId, 'new_message', message);
  }

  emitPostPublished(workspaceId: string, post: unknown) {
    this.emitToWorkspace(workspaceId, 'post_published', post);
  }

  emitPostFailed(workspaceId: string, post: unknown) {
    this.emitToWorkspace(workspaceId, 'post_failed', post);
  }

  emitNotification(userId: string, notification: unknown) {
    this.emitToUser(userId, 'notification', notification);
  }

  emitAnalyticsUpdate(workspaceId: string, data: unknown) {
    this.emitToWorkspace(workspaceId, 'analytics_update', data);
  }
}
