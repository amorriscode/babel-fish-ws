export default {
	async fetch(request, env, ctx) {
		const id = env.WEBSOCKET_HIBERNATION_SERVER.idFromName('foo');
		const stub = env.WEBSOCKET_HIBERNATION_SERVER.get(id);

		return await stub.fetch(request);
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
		// Send messages to any connected users
		ws.send(message);
	}

	async webSocketClose(ws, code, reason, wasClean) {
		// If the client closes the connection, we will close it too.
		ws.close(code, 'Durable Object is closing WebSocket');
	}
}
