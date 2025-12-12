/** @type {import('next').NextConfig} */
const nextConfig = {
	// Configuración optimizada para Vercel
	// Aquí Vercel podrá manejar tus rutas API dinámicas sin problemas
	async redirects() {
		return [
			{
				source: "/:path*",
				has: [
					{
						type: "host",
						value: "www.rhemapp.com",
					},
				],
				destination: "https://rhemapp.com/:path*",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
