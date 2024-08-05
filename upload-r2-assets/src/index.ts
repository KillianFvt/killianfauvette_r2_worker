interface Env {
	KF_R2_BUCKET: R2Bucket;
	AUTH_SECRET: string;
}

const corsHeaders = {
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Origin': '*',
}

export default {
	async fetch(request, env: Env): Promise<Response> {

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		const auth: string | null = request.headers.get('Authorization');
		const expectedAuth: string = `Bearer ${env.AUTH_SECRET}`;

		if (!auth || auth !== expectedAuth) {
			return new Response('Unauthorized', {
				status: 401,
				headers: corsHeaders,
			});
		}

		if (request.method === 'PUT' || request.method === 'POST') {
			const url: URL = new URL(request.url);
			const key: string = url.pathname.slice(1);
			await env.KF_R2_BUCKET.put(key, request.body);
			return new Response(
				`Object ${key} uploaded successfully!`,
				{
					status: 201,
					headers: corsHeaders,
				},
			);
		}

		if (request.method === 'GET') {
			const url: URL = new URL(request.url);
			const key: string = url.pathname.slice(1);
			const object: R2ObjectBody | null = await env.KF_R2_BUCKET.get(key);

			if (object === null) {
				return new Response(`Can't find ${key}`, { status: 404, headers: corsHeaders });
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);

			return new Response(object.body, {
				headers: { ...headers, ...corsHeaders },
			});
		}

		if (request.method === 'DELETE') {
			const url = new URL(request.url);
			const key = url.pathname.slice(1);
			await env.KF_R2_BUCKET.delete(key);
			return new Response(
				`Object ${key} deleted successfully!`,
				{
					status: 204,
					headers: corsHeaders,
				},
			);
		}

		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
