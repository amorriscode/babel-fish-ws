function NotFound() {
	return new Response('Not found', { status: 404 });
}

function MethodNotAllowed() {
	return new Response('Method not allowed', { status: 405 });
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.slice(1).split('/');

		switch (path[0]) {
			case 'api':
				return handleApiRequest(path.slice(1), request, env);
			default:
				return NotFound();
		}
	},
};

async function handleApiRequest(path, request, env) {
	switch (path[0]) {
		case 'room': {
			// Handle room creation
			if (!path[1]) {
				switch (request.method) {
					case 'POST':
						return new Response(env.chats.newUniqueId().toString(), { headers: { 'Access-Control-Allow-Origin': '*' } });
					default:
						return MethodNotAllowed();
				}
			}

			// Handle existing room
			const id = env.chats.idFromString(path[1]);
			const chat = env.chats.get(id);

			// Remove /api/chat/<id> from the URL and forward it to the Durable Object
			const url = new URL(request.url);
			url.pathname = `/${path.slice(2).join('/')}`;

			return chat.fetch(url, request);
		}
		default:
			return NotFound();
	}
}

export class Chat {
	constructor(state, env) {
		this.state = state;

		// Store all connections as sessions
		this.sessions = new Map();

		this.state.getWebSockets().forEach((webSocket) => {
			this.sessions.set(webSocket, { ...webSocket.deserializeAttachment() });
		});
	}

	async connectWebSocket() {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		await this.handleSession(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async handleSession(webSocket) {
		this.state.acceptWebSocket(webSocket);

		const session = webSocket.serializeAttachment({ messages: [], ...webSocket.deserializeAttachment() });

		this.sessions.set(webSocket, session);
	}

	broadcast(message) {
		this.sessions.forEach((session, webSocket) => {
			try {
				webSocket.send(message);
			} catch (error) {
				// Handle dead connections
				this.sessions.delete(webSocket);
			}
		});
	}

	async fetch(request) {
		const url = new URL(request.url);

		switch (url.pathname) {
			case '/join':
				return this.connectWebSocket();
			default:
				return new Response('Not found', { status: 404 });
		}
	}

	async webSocketMessage(webSocket, message) {
		this.broadcast(message);
	}

	async webSocketClose(ws, code, reason, wasClean) {
		// If the client closes the connection, we will close it too.
		ws.close(code, 'Durable Object is closing WebSocket');
	}
}
