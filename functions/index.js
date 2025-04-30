const functions = require("firebase-functions");
const { default: next } = require("next");

const isDev = process.env.NODE_ENV !== "production";
const app = next({
	dev: isDev,
	conf: {
		distDir: ".next",
	},
});
const handle = app.getRequestHandler();

exports.nextServer = functions.https.onRequest((req, res) => {
	return app.prepare().then(() => handle(req, res));
});
