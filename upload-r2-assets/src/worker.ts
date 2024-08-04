interface Env {
	KF_R2_BUCKET: R2Bucket;
	AUTH_SECRET: string;
}

export default {
	async fetch(request, env: Env): Promise<Response> {

		const auth = request.headers.get('Authorization');
		const expectedAuth = `Bearer ${env.AUTH_SECRET}`;

		if (!auth || auth !== expectedAuth) {
			return new Response('Unauthorized', { status: 401 });
		}

		if (request.method === 'PUT' || request.method === 'POST') {
			// For example, the request URL my-worker.account.workers.dev/image.png
			const url: URL = new URL(request.url);
			// the key is "image.png"
			const key: string = url.pathname.slice(1);
			await env.KF_R2_BUCKET.put(key, request.body);
			return new Response(`Object ${key} uploaded successfully!`);
		}

		if (request.method === 'GET') {
			// For example, the request URL my-worker.account.workers.dev/image.png
			const url: URL = new URL(request.url);
			// the key is "image.png"
			const key: string = url.pathname.slice(1);
			// Retrieve the key "image.png"
			const object: R2ObjectBody | null = await env.KF_R2_BUCKET.get(key);

			if (object === null) {
				return new Response('Object Not Found', { status: 404 });
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);

			return new Response(object.body, {
				headers,
			});
		}

		if (request.method === 'DELETE') {
			const url = new URL(request.url);
			const key = url.pathname.slice(1);
			await env.KF_R2_BUCKET.delete(key);
			return new Response(`Object ${key} deleted successfully!`);
		}

		return new Response('Method Not Allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
