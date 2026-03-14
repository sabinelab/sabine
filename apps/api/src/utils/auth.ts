import type { preHandlerMetaHookHandler } from "fastify/types/hooks.js"
import { env } from "@/env"

export const auth: preHandlerMetaHookHandler = (req, res, done) => {
	if (env.NODE_ENV === "dev") {
		return done()
	}
	if (!req.headers.authorization) {
		return res.status(401).send({ message: "Unauthorized" })
	}
	if (req.headers.authorization !== env.AUTH) {
		return res.status(403).send({ message: "Forbidden" })
	}

	return done()
}
