import { PrismaClient, abilities, campaigns, characterAbilities, characters } from "@prisma/client";
import { CommandInteraction } from "discord.js";

export class DatabaseHelper {
	abilities: abilities[] = [];

	constructor(private client: PrismaClient) {}

	private async checkServer(interaction: CommandInteraction): Promise<void> {
		if (interaction.guild === null) throw new Error("Command not run in a server");
	}

	async getCampaign(interaction: CommandInteraction): Promise<campaigns> {
		await this.checkServer(interaction);

		const respose = await this.client.campaigns.findUnique({
			where: {
				serverId: interaction.guildId?.toString(),
			},
		});

		if (respose === null) throw new Error("The server does not have a campaign");

		return respose;
	}

	async loadAbilities(): Promise<void> {
		this.abilities = await this.client.abilities.findMany({
			orderBy: [{ trait: "asc" }, { name: "asc" }],
		});
	}

	async getCharacter(
		interaction: CommandInteraction,
		discordUserId?: string | undefined
	): Promise<characters & { characterAbilities: characterAbilities[] }> {
		const campaign: campaigns = await this.getCampaign(interaction);

		if (discordUserId && campaign.discordUserId !== interaction.user.id)
			throw new Error("You don't have permission to see this character");

		const respose = await this.client.characters.findFirst({
			where: {
				campaignId: campaign.campaignId,
				discordUserId: interaction.user.id,
			},
			include: {
				characterAbilities: true,
			},
		});

		if (respose === null) throw new Error("You don't have a character in this server");

		return respose;
	}
}
