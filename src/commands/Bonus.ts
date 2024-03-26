import { Command } from "@/Command";
import { AbilityHelper } from "@/helpers/AbilityHelper";
import { Colour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { uuidToBuffer } from "@/lib/prismaHelpers";
import { AbilityType, PrismaClient, characterAbilities, characters } from "@prisma/client";
import { randomUUID } from "crypto";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	Client,
	CommandInteraction,
	EmbedBuilder,
	User,
} from "discord.js";

export const Bonus: Command = {
	name: "bonus",
	description: "Manage bonuses",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "session",
			description: "Assign a 3 points bonus to all the characters",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "assign",
			description: "Assign a bonus to a character",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "player",
					description: "Select the player to whose character the bonus will be assigned",
					type: ApplicationCommandOptionType.User,
					required: true,
				},
				{
					name: "quantity",
					description: "Select the amount of the bonus",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
		{
			name: "roll",
			description: "Roll a bonus to try and upgrade an ability",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "ability",
					description: "Select the ability",
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: AbilityHelper.getAbilityList(),
				},
			],
		},
		{
			name: "up",
			description: "Upgrade an ability by 1 point",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "ability",
					description: "Select the ability",
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: AbilityHelper.getAbilityList(),
				},
			],
		},
	],
	run: async (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => {
		switch (interaction.options.data[0]?.name) {
			case "session":
				await sessionBonus(client, interaction, prisma, database);
				break;
			case "assign":
				await assignBonus(client, interaction, prisma, database);
				break;
			case "roll":
				await rollBonus(client, interaction, prisma, database);
				break;
			case "up":
				await upBonus(client, interaction, prisma, database);
				break;
		}
	},
};

function getRoll(): number {
	return Math.floor(Math.random() * 100) + 1;
}

const sessionBonus = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const campaign = await database.getCampaign(interaction);
	if (interaction.user.id !== campaign.discordUserId)
		throw new Error("You don't have permission to provide bonus. Only the storyteller can.");

	await prisma.characters.updateMany({
		where: {
			campaignId: campaign.campaignId,
		},
		data: {
			bonus: {
				increment: 3,
			},
		},
	});

	const content = new EmbedBuilder()
		.setColor(Colour.Green)
		.setTitle(`Session bonus`)
		.setDescription(`All the characters have received a 3 points bonus.`);

	await interaction.followUp({
		embeds: [content],
	});
};

const assignBonus = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const campaign = await database.getCampaign(interaction);
	if (interaction.user.id !== campaign.discordUserId)
		throw new Error("You don't have permission to provide bonus. Only the storyteller can.");

	const user = interaction.options.getUser("player");
	if (!user) throw new Error("No player selected");

	const character: characters = await database.getCharacter(interaction, user.id);

	await prisma.characters.updateMany({
		where: {
			campaignId: campaign.campaignId,
			discordUserId: user.id,
		},
		data: {
			bonus: {
				increment: (interaction.options.get("quantity")?.value ?? 0) as number,
			},
		},
	});

	const content = new EmbedBuilder()
		.setColor(Colour.Green)
		.setTitle(`Bonus Assigned to ${character.name}`)
		.setDescription(`${user}, your character ${character.name} received a 3 points bonus.`);

	await interaction.followUp({
		embeds: [content],
	});
};

const rollBonus = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const campaign = await database.getCampaign(interaction);
	const character = await database.getCharacter(interaction);
	const user: User = interaction.user;

	if (character.bonus <= 0) throw new Error("You do not have bonus points to roll your ability.");

	const abilityName: AbilityType = (interaction.options.get("ability")?.value?.toString() ?? "") as AbilityType;

	if (!AbilityHelper.checkAbilityExists(abilityName)) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) => characterAbility.ability === abilityName
	);

	await prisma.characters.updateMany({
		where: {
			campaignId: campaign.campaignId,
			discordUserId: user.id,
		},
		data: {
			bonus: {
				decrement: 1,
			},
		},
	});

	const roll = getRoll();
	let abilityValue = characterAbility?.value ?? 0;

	const total = roll - abilityValue;
	let successes = total < 0 ? 0 : Math.floor(total / 20) + 1;

	if (roll === 100) successes *= 2;

	if (successes > 0) {
		if (characterAbility) {
			await prisma.characterAbilities.update({
				where: {
					characterAbilityId: characterAbility.characterAbilityId,
				},
				data: {
					value: {
						increment: successes,
					},
				},
			});
		} else {
			await prisma.characterAbilities.create({
				data: {
					characterAbilityId: uuidToBuffer(randomUUID()),
					characterId: character.characterId,
					ability: abilityName,
					value: successes,
				},
			});
		}

		abilityValue += successes;
	}

	let description = `${user}, your character ${character.name} ${
		successes > 0 ? "successfuly increased" : "failed to increase"
	} their ${abilityName} ability${successes > 0 ? " by " + successes.toString() + " points" : ""}.`;

	if (successes > 0) description += `It is now at ${abilityValue + successes} points.`;

	const content = new EmbedBuilder()
		.setColor(successes > 0 ? Colour.Green : Colour.Red)
		.setTitle(`${successes > 0 ? "Successfully increased " : "Failed to increase "} ${abilityName}`)
		.setDescription(description);

	content.addFields({
		name: "Roll",
		value: `Dice: ${roll}${roll === 100 ? " (**Critical)**" : ""}
                Current Value: ${abilityValue}
				Difference: ${total} (${successes} successes)
				---
				Your new ${abilityName} score is ${abilityValue + successes}
				
				You ${
					character.bonus <= 1
						? "are out of bonus points"
						: "still have " + (character.bonus - 1) + " bonus points left."
				}`,
		inline: false,
	});

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};

const upBonus = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const campaign = await database.getCampaign(interaction);
	const character = await database.getCharacter(interaction);
	const user: User = interaction.user;

	if (character.bonus <= 0) throw new Error("You do not have bonus points to up your ability.");

	const abilityName: AbilityType = (interaction.options.get("ability")?.value?.toString() ?? "") as AbilityType;

	if (!AbilityHelper.checkAbilityExists(abilityName)) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) => characterAbility.ability === abilityName
	);

	if (!characterAbility) throw new Error("You can up only an ability your character already have. Roll for it first.");

	await prisma.characters.updateMany({
		where: {
			campaignId: campaign.campaignId,
			discordUserId: user.id,
		},
		data: {
			bonus: {
				decrement: 1,
			},
		},
	});

	await prisma.characterAbilities.update({
		where: {
			characterAbilityId: characterAbility.characterAbilityId,
		},
		data: {
			value: {
				increment: 1,
			},
		},
	});

	let description = `${user}, your character ${character.name}  successfuly increased their ${abilityName} ability by 1 points.`;
	description += `It is now at ${characterAbility.value + 1} points.`;

	const content = new EmbedBuilder()
		.setColor(Colour.Green)
		.setTitle(`Successfully increased ${abilityName}`)
		.setDescription(description);

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};
