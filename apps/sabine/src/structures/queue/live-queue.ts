import { prisma } from "@db"
import type { $Enums } from "@generated"
import t from "@i18n"
import { Queue } from "bullmq"
import { ButtonStyle, REST, Routes } from "discord.js"
import pLimit from "p-limit"
import { tournaments } from "@/config"
import { env } from "@/env"
import type App from "@/structures/app/App"
import ButtonBuilder from "@/structures/builders/ButtonBuilder"
import EmbedBuilder from "@/structures/builders/EmbedBuilder"
import type { LiveFeed } from "@/types"

export type LivePayload = LiveFeed & {
	game: $Enums.Game
}

export const liveQueue = new Queue<LivePayload>("live", {
	connection: {
		url: env.REDIS_URL
	}
})

const rest = new REST().setToken(env.BOT_TOKEN)
const limit = pLimit(25)

export const processLive = async (app: App, data: LivePayload) => {
	const matchedEventNames = Object.keys(tournaments).filter(
		key =>
			key.toLowerCase() === data.tournament.name ||
			tournaments[key].some(regex => regex.test(data.tournament.name.toLowerCase()))
	)

	if (!matchedEventNames.includes(data.tournament.name)) {
		matchedEventNames.push(data.tournament.name)
	}

	let cursor: string | undefined

	while (true) {
		const guilds = await prisma.guild.findMany({
			take: 1000,
			skip: cursor ? 1 : 0,
			cursor: cursor ? { id: cursor } : undefined,
			orderBy: { id: "asc" },
			where: {
				[data.game === "valorant" ? "valorantLiveFeedChannel" : "lolLiveFeedChannel"]: {
					not: null
				},
				events: {
					some: {
						type: data.game,
						name: {
							in: matchedEventNames
						}
					}
				}
			},
			include: {
				events: {
					where: {
						type: data.game,
						name: {
							in: matchedEventNames
						}
					}
				}
			}
		})

		if (!guilds.length) break

		const messages: Promise<unknown>[] = []

		for (const guild of guilds) {
			const channelId =
				data.game === "valorant" ? guild.valorantLiveFeedChannel : guild.lolLiveFeedChannel
			if (!channelId) continue

			if (!guild.events.length) continue

			if (!data.teams[0] || !data.teams[1]) continue

			const emoji1 =
				app.emoji.get(data.teams[0].name.toLowerCase()) ??
				app.emoji.get(app.emojiAliases.get(data.teams[0].name.toLowerCase()) ?? "") ??
				app.emoji.get("default")
			const emoji2 =
				app.emoji.get(data.teams[1].name.toLowerCase()) ??
				app.emoji.get(app.emojiAliases.get(data.teams[1].name.toLowerCase()) ?? "") ??
				app.emoji.get("default")

			const embed = new EmbedBuilder()
				.setAuthor({
					name:
						data.game === "valorant"
							? data.tournament.name
							: ((data.tournament as any).full_name ?? data.tournament.name),
					iconURL: data.tournament.image ?? undefined
				})
				.setTitle(t(guild.lang, "helper.live_now"))
				.setField(
					`${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
					data.game === "valorant"
						? t(guild.lang, "helper.live_feed_value", {
								map: data.currentMap,
								score: `${data.score1}-${data.score2}`
							})
						: ""
				)

			if (data.stage) embed.setFooter({ text: data.stage })

			const button = new ButtonBuilder()
			if (data.game === "valorant") {
				button.setStyle(ButtonStyle.Link).setLabel(t(guild.lang, "helper.stats")).setURL(data.url!)
			} else {
				button
					.setStyle(ButtonStyle.Primary)
					.setLabel(t(guild.lang, "helper.streams"))
					.setCustomId(`stream;lol;${data.id}`)
			}

			messages.push(
				limit(() =>
					rest.post(Routes.channelMessages(channelId), {
						body: {
							embeds: [embed.toJSON()],
							components: [
								{
									type: 1,
									components: [button]
								}
							]
						}
					})
				)
			)
		}

		await Promise.allSettled(messages)
		cursor = guilds[guilds.length - 1].id
	}
}
