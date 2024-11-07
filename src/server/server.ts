import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import * as net from 'net';

export class CustomServer extends Server implements CustomTransportStrategy {
  private server: net.Server;
  private port: number;
  private host: string;

  constructor(port: number, host: string) {
    super();
    this.port = port;
    this.host = host;
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  listen(callback: (err?: unknown, ...optionalParams: unknown[]) => void) {
    try {
      this.server = net.createServer();
      this.server.listen(this.port, this.host, undefined, () => {
        console.log(`CustomerServer listening on ${this.host}:${this.port}`);
        this.setupListener();
      });
    } catch (err) {
      callback(err);
    }
  }

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    this.server.close();
  }

  private async setupListener() {
    this.server.on('connection', (socket) => {
      let message = '';
      const onlineHandler = this.getHandlerByPattern('server/online');
      const offlineHandler = this.getHandlerByPattern('server/offline');

      socket.setKeepAlive(true);

      //   this.server.getConnections((err, count) => {
      //     console.log('connections', count);
      //   });

      socket.on('data', (data) => {
        try {
          message = data.toString().trim();
          onlineHandler(message);
        } catch (err) {
          console.log('err', err);
        }
      });

      socket.on('close', () => {
        offlineHandler(message);
      });
    });
  }
}
