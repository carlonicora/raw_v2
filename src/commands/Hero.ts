import { Command } from "@/Command";
import { Colour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { PrismaClient, characters } from "@prisma/client";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	Client,
	CommandInteraction,
	EmbedBuilder,
	User,
} from "discord.js";

export const Hero: Command = {
	name: "hero",
	description: "Use your hero points",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "refresh",
			description: "Try and update the hero points of your character",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "use",
			description: "Use hero points to gain advantage on a roll",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "quantity",
					description: "Specify how many hero points you want to use",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
		{
			name: "set",
			description: "Set your character's hero points",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "quantity",
					description: "Specify how many hero points your character has",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
	],
	run: async (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => {
		switch (interaction.options.data[0]?.name) {
			case "refresh":
				await refreshHeroPoints(client, interaction, prisma, database);
				break;
			case "use":
				await useHeroPoints(client, interaction, prisma, database);
				break;
			case "set":
				await setHeroPoints(client, interaction, prisma, database);
				break;
		}
	},
};

function getRoll(): number {
	return Math.floor(Math.random() * 100) + 1;
}

const refreshHeroPoints = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character: characters = await database.getCharacter(interaction);
	const user: User = interaction.user;

	const roll = getRoll();
	let successes = Math.floor((roll - character.heroPoints) / 20) + 1;
	let increase = roll === 100 ? successes * 2 : successes;

	if (successes < 0) {
		successes = 0;
		increase = 0;
	}

	if (successes > 0) {
		await prisma.characters.update({
			where: {
				characterId: character.characterId,
			},
			data: {
				heroPoints: {
					increment: increase,
				},
			},
		});
	}

	let description = `${user}, your character ${character.name} ${
		successes > 0 ? "successfuly increased" : "failed to increase"
	} their hero points${successes > 0 ? " by " + increase.toString() + " points" : ""}.`;

	if (successes > 0) description += `You now have ${character.heroPoints + increase} hero points.`;

	const content = new EmbedBuilder()
		.setColor(successes > 0 ? Colour.Green : Colour.Red)
		.setTitle(`${successes > 0 ? "Successfully increased " : "Failed to increase "} hero points`)
		.setDescription(description);

	content.addFields({
		name: "Roll",
		value: `Dice: ${roll}${roll === 100 ? " (**Critical)**" : ""}
                Current hero points: ${character.heroPoints}
---
Difference: ${character.heroPoints} (${increase} successes)`,
		inline: false,
	});

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};

const useHeroPoints = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character: characters = await database.getCharacter(interaction);
	const user: User = interaction.user;

	const usedPoints = +(interaction.options.get("quantity")?.value ?? 0);

	if (usedPoints > character.heroPoints) throw new Error("You don't have enough hero points to use.");

	await prisma.characters.update({
		where: {
			characterId: character.characterId,
		},
		data: {
			heroPoints: {
				decrement: usedPoints,
			},
		},
	});

	let description = `${user}, you used ${usedPoints} hero points for ${character.name}`;

	description += `You now have ${character.heroPoints - usedPoints} hero points.`;

	const content = new EmbedBuilder().setColor(Colour.Green).setTitle(`Hero Points`).setDescription(description);

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};

const setHeroPoints = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character: characters = await database.getCharacter(interaction);
	const user: User = interaction.user;

	const heroPoints = +(interaction.options.get("quantity")?.value ?? 0);

	await prisma.characters.update({
		where: {
			characterId: character.characterId,
		},
		data: {
			heroPoints: heroPoints,
		},
	});

	let description = `${user}, you set ${heroPoints} hero points for ${character.name}`;

	const content = new EmbedBuilder().setColor(Colour.Green).setTitle(`Hero Points`).setDescription(description);

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};
