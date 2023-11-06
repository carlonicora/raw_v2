import { Command } from "@/Command";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { uuidToBuffer } from "@/lib/prismaHelpers";
import { PrismaClient, campaigns } from "@prisma/client";
import { randomUUID } from "crypto";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	Client,
	CommandInteraction,
	EmbedBuilder,
} from "discord.js";

export const Campaign: Command = {
	name: "campaign",
	description: "Creates a campaign",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "create",
			description: "Creates a new campaign",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "title",
					description: "Title of the campaign",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
	],
	run: async (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => {
		let content: EmbedBuilder = new EmbedBuilder();

		const campaignTitle: string | undefined = interaction.options.get("title")?.value as string;
		if (!campaignTitle) throw new Error("Missing campaign name");

		try {
			const campaign: campaigns | null = await database.getCampaign(interaction);

			content
				.setColor("#ff0000")
				.setTitle("Campaign Already Exists")
				.setDescription(`A campaign (${campaign.name}) already exists on this server.`);
		} catch (error: any) {
			await prisma.campaigns.create({
				data: {
					campaignId: uuidToBuffer(randomUUID()),
					serverId: interaction.guildId?.toString() ?? "",
					discordUserId: interaction.user.id,
					name: campaignTitle,
				},
			});

			content
				.setColor("#00ff00")
				.setTitle("Campaign Created")
				.setDescription(`Campaign ${campaignTitle} successfully created`);
		} finally {
			await interaction.followUp({
				embeds: [content],
			});
		}
	},
};
