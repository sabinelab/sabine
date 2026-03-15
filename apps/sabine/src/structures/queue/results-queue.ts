import { prisma } from "@db"
import type { $Enums } from "@generated"
import t from "@i18n"
import { Queue } from "bullmq"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } from "discord.js"
import pLimit from "p-limit"
import { tournaments } from "@/config"
import { env } from "@/env"
import type App from "@/structures/app/App"
import EmbedBuilder from "@/structures/builders/EmbedBuilder"
import type { ResultsData } from "@/types"
import calcOdd from "@/util/calcOdd"

export type ResultsPayload = ResultsData & {
	game: $Enums.Game
}

export const resultsQueue = new Queue<ResultsPayload>("results", {
	connection: {
		url: env.REDIS_URL
	}
})

const rest = new REST().setToken(env.BOT_TOKEN)
const limit = pLimit(25)

export const processPredictions = async (data: ResultsPayload) => {
	const [oddA, oddB] = await Promise.all([
		prisma.prediction.count({
			where: {
				match: data.id,
				status: "pending",
				bet: { not: null },
				teams: {
					some: {
						name: data.teams[0].name,
						winner: true
					}
				}
			}
		}),
		prisma.prediction.count({
			where: {
				match: data.id,
				status: "pending",
				bet: { not: null },
				teams: {
					some: {
						name: data.teams[1].name,
						winner: true
					}
				}
			}
		})
	])

	let cursor: string | undefined

	while (true) {
		const preds = await prisma.prediction.findMany({
			take: 500,
			skip: cursor ? 1 : 0,
			cursor: cursor
				? {
						id: cursor
					}
				: undefined,
			where: {
				game: data.game,
				match: data.id,
				status: "pending"
			},
			include: {
				teams: true,
				profile: {
					select: {
						id: true,
						user: {
							select: {
								premium: true
							}
						}
					}
				}
			}
		})

		if (!preds.length) break

		let winnerIndex = -1

		const hasbets = preds.some(m => m.bet)

		if (hasbets) {
			winnerIndex = data.teams.findIndex(t => t.winner)
		}

		const transactions = preds.flatMap(pred => {
			if (
				pred.teams[0].score === data.teams[0].score &&
				pred.teams[1].score === data.teams[1].score
			) {
				let odd: number | null = null
				let bonus = 0

				if (pred.bet && winnerIndex >= 0) {
					if (pred.teams[winnerIndex].winner) {
						odd = pred.teams[0].winner ? calcOdd(oddA) : calcOdd(oddB)

						if (pred.profile.user.premium) {
							bonus = Math.floor(Number(pred.bet) / 2)
						}
					}
				}

				const poisons = BigInt(Math.floor(Number(pred.bet) * (odd ?? 1))) + BigInt(bonus)
				const fates = 35

				return [
					prisma.prediction.update({
						where: { id: pred.id },
						data: {
							odd: odd ? Math.floor(odd) : undefined,
							status: "correct"
						}
					}),
					prisma.profile.update({
						where: { id: pred.profile.id },
						data: {
							correctPredictions: { increment: 1 },
							poisons: { increment: poisons },
							fates: { increment: fates }
						}
					})
				]
			} else {
				return [
					prisma.prediction.update({
						where: { id: pred.id },
						data: { status: "incorrect" }
					}),
					prisma.profile.update({
						where: { id: pred.profile.id },
						data: {
							incorrectPredictions: { increment: 1 }
						}
					})
				]
			}
		})

		await prisma.$transaction(transactions)
		cursor = preds[preds.length - 1].id
	}
}

export const processResult = async (app: App, data: ResultsPayload) => {
	data.when = new Date(data.when)

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
			cursor: cursor
				? {
						id: cursor
					}
				: undefined,
			where: {
				events: {
					some: {
						type: data.game,
						name: {
							in: matchedEventNames
						}
					}
				}
			},
			select: {
				id: true,
				lang: true,
				events: {
					where: {
						type: data.game,
						name: {
							in: matchedEventNames
						}
					},
					select: {
						name: true,
						channel2: true
					}
				}
			}
		})

		if (!guilds.length) break

		const messages: Promise<unknown>[] = []

		for (const guild of guilds) {
			if (!guild.events[0]) continue

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
					name: data.tournament.name,
					iconURL: data.tournament.image ?? undefined
				})
				.setField(
					`${emoji1} ${data.teams[0].name} \`${data.teams[0].score}\` <:versus:1349105624180330516> \`${data.teams[1].score}\` ${data.teams[1].name} ${emoji2}`,
					`<t:${data.when.getTime() / 1000}:F> | <t:${data.when.getTime() / 1000}:R>`,
					true
				)
				.setFooter({ text: data.stage })

			const row = new ActionRowBuilder<ButtonBuilder>()

			if (data.game === "valorant") {
				row.addComponents(
					new ButtonBuilder()
						.setLabel(t(guild.lang, "helper.stats"))
						.setStyle(ButtonStyle.Link)
						.setURL(`https://vlr.gg/${data.id}`)
				)
			}

			row.addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Primary)
					.setLabel(t(guild.lang, "helper.predictions"))
					.setCustomId(`show-predictions;${data.game};${data.id}`)
			)

			messages.push(
				limit(() =>
					rest.post(Routes.channelMessages(guild.events[0].channel2), {
						body: {
							embeds: [embed.toJSON()],
							components: [row.toJSON()]
						}
					})
				)
			)
		}

		await Promise.allSettled(messages)
		cursor = guilds[guilds.length - 1].id
	}
}
