/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const id = env.WEBSOCKET_HIBERNATION_SERVER.idFromName("foo");
    const stub = env.WEBSOCKET_HIBERNATION_SERVER.get(id);

    return await stub.fetch(request);
    // const webSocketPair = new WebSocketPair();
    // const [client, server] = Object.values(webSocketPair);
  
    // server.accept();
    // server.addEventListener('message', event => {
    //   console.log(event.data);

    //   server.send("YOLO");
    // });
  
    // return new Response(null, {
    //   status: 101,
    //   webSocket: client,
    // });
  },
};

export class WebSocketHibernationServer {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws, message) {
    ws.send(`[Durable Object]: ${message}`);
  }

  async webSocketClose(ws, code, reason, wasClean) {
    // If the client closes the connection, we will close it too.
    ws.close(code, "Durable Object is closing WebSocket");
  }
}