import { Worker } from "bullmq"
import { env } from "@/env"
import type App from "@/structures/app/App"
import { type ArenaQueuePayload, processArenaQueue } from "@/structures/queue/arena-queue"
import { type LivePayload, processLive } from "@/structures/queue/live-queue"
import { type NewsPayload, processNews } from "@/structures/queue/news-queue"
import { processReminderQueue, type ReminderPayload } from "@/structures/queue/reminder-queue"
import {
	processPredictions,
	processResult,
	type ResultsPayload
} from "@/structures/queue/results-queue"
import Logger from "@/util/Logger"

export const startWorkers = (app: App) => {
	new Worker<LivePayload>(
		"live",
		async job => await processLive(app, job.data).catch(e => new Logger(app).error(e)),
		{
			connection: {
				url: env.REDIS_URL
			}
		}
	)

	new Worker<NewsPayload>(
		"news",
		async job => await processNews(job.data).catch(e => new Logger(app).error(e)),
		{
			connection: {
				url: env.REDIS_URL
			}
		}
	)

	new Worker<ResultsPayload>(
		"results",
		async job => {
			await processPredictions(job.data).catch(e => new Logger(app).error(e))
			await processResult(app, job.data).catch(e => new Logger(app).error(e))
		},
		{
			connection: {
				url: env.REDIS_URL
			}
		}
	)

	new Worker<ArenaQueuePayload>(
		"arena",
		async job => await processArenaQueue(app, job.data).catch(e => new Logger(app).error(e)),
		{
			connection: {
				url: env.REDIS_URL
			}
		}
	)

	new Worker<ReminderPayload>(
		"reminder",
		async job => await processReminderQueue(app, job.data).catch(e => new Logger(app).error(e)),
		{
			connection: {
				url: env.REDIS_URL
			}
		}
	)
}
