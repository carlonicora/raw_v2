import { Command } from "@/Command";
import { Commands } from "@/Commands";
import { ErrorEmbed } from "@/embeds/ErrorEmbed";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { PrismaClient } from "@prisma/client";
import { Client, CommandInteraction, Interaction } from "discord.js";

export default (client: Client, prisma: PrismaClient, database: DatabaseHelper): void => {
	client.on("interactionCreate", async (interaction: Interaction) => {
		if (interaction.isCommand() || interaction.isContextMenuCommand()) {
			await handleSlashCommand(client, interaction, prisma, database);
		}
	});
};

const handleSlashCommand = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
): Promise<void> => {
	const slashCommand = Commands.find((c: Command) => c.name === interaction.commandName);
	if (!slashCommand) {
		interaction.followUp({ content: "An error has occurred" });
		return;
	}

	await interaction.deferReply();

	try {
		const serverId: string | null = interaction.guildId;
		if (!serverId) throw new Error("Command not run in a server");

		await slashCommand.run(client, interaction, prisma, database);
	} catch (error: any) {
		await interaction.followUp({
			ephemeral: true,
			embeds: [new ErrorEmbed(error.message).create()],
		});
	}
};
