import { valorantMaps } from "@sabinelab/utils"
import { REST, Routes, ShardingManager } from "discord.js"
import { env } from "@/env"
import EmbedBuilder from "./structures/builders/EmbedBuilder"
import Logger from "./util/Logger"
import "./server"
import { Worker } from "bullmq"
import { arenaMapQueue, processArenaMap } from "@/structures/queue/arena-map-queue"
import { processMatch } from "@/structures/queue/arena-queue"

const currentMapInit = await Bun.redis.get("arena:map")
let mapsInit = valorantMaps.filter(m => m.current_map_pool).map(m => m.name)
const mapIndexInit = mapsInit.indexOf(currentMapInit || "")

if (mapIndexInit !== -1) {
	mapsInit.splice(mapIndexInit, 1)
}

if (mapsInit.length === 0) {
	mapsInit = valorantMaps.filter(m => m.current_map_pool).map(m => m.name)
}

const mapInit = mapsInit[Math.floor(Math.random() * mapsInit.length)]

if (!currentMapInit && mapInit) await Bun.redis.set("arena:map", mapInit)

new Worker("change-arena-map", async () => await processArenaMap().catch(Logger.error), {
	connection: {
		url: env.REDIS_URL
	}
})

const patterns = ["*leaderboard:*", "*agent_selection:*", "*match:*"]

for (const pattern of patterns) {
	let cursor = "0"

	do {
		const [next, keys] = await Bun.redis.scan(cursor, "MATCH", pattern, "COUNT", 100)

		if (keys.length) {
			await Bun.redis.unlink(...keys)
		}

		cursor = next
	} while (cursor !== "0")
}

const manager = new ShardingManager("src/index.ts", {
	token: env.BOT_TOKEN,
	mode: "process",
	totalShards: env.NODE_ENV === "development" ? "auto" : 2
})

const rest = new REST().setToken(env.BOT_TOKEN)

const res = (await rest.get(Routes.channelWebhooks(env.SHARD_LOG))) as {
	id: string
	token?: string
}[]
const webhook = res.filter(w => w.token)[0]

if (!webhook) {
	Logger.warn("There is no webhook")
}

manager.on("shardCreate", async shard => {
	if (shard.id === 0) {
		setInterval(processMatch, 5000)

		const oldJobs = await arenaMapQueue.getJobSchedulers()

		const promises: Promise<unknown>[] = []
		for (const job of oldJobs) {
			promises.push(arenaMapQueue.removeJobScheduler(job.key))
		}
		await Promise.all(promises)

		await arenaMapQueue.upsertJobScheduler(
			"change-arena-map-scheduler",
			{
				pattern: "0 0 * * 0"
			},
			{
				name: "change-arena-map",
				opts: {
					removeOnComplete: false,
					removeOnFail: false
				}
			}
		)
	}

	shard.on("disconnect", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Disconnected")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Disconnected\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("ready", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Ready")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Ready\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("resume", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Resumed")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Resumed\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("reconnecting", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Reconnecting")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Reconnecting\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("death", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Dead")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Dead\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("spawn", async () => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Spawned")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Spawned\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})

	shard.on("error", async error => {
		const embed = new EmbedBuilder()
			.setTitle("Shard Error")
			.setDesc(`Shard ID: \`${shard.id}\` => \`Error\`\n\`\`\`fix\n${error.stack}\`\`\``)
			.setTimestamp()

		const route = Routes.webhook(webhook.id, webhook.token)

		await rest.post(route, {
			body: {
				embeds: [embed]
			}
		})
	})
})

manager.spawn()
