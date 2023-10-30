import { Command } from "@/Command";
import { Colour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { bufferToUuid, uuidToBuffer } from "@/lib/prismaHelpers";
import { PrismaClient, Trait, abilities, characterAbilities, characters } from "@prisma/client";
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
					choices: [
						{ name: "Athletics", value: "0344a352-9c29-4975-9684-ac70b0416814" },
						{ name: "Craft", value: "f12396ed-700d-43c8-9baa-db77511f6652" },
						{ name: "Drive", value: "3004f56a-e463-4154-904f-72d670da20f2" },
						{ name: "Education", value: "223d87fa-b73c-45cb-8ccf-25c5201619a9" },
						{ name: "Empathy", value: "8db0926c-586c-4aeb-9cc7-1f6bda44fd4e" },
						{ name: "Firearms", value: "38d7fc45-0b15-4b40-bbbf-ec5a250f6f66" },
						{ name: "Intimidate", value: "079eaebd-e349-456b-bd17-dcbc1e03ab00" },
						{ name: "Investigation", value: "d52522b7-c071-434f-93bd-72e0825063fc" },
						{ name: "Language", value: "3d401030-08e6-4828-9164-082555ebbfee" },
						{ name: "Medicine", value: "8a831ee6-7c0b-4bd5-a4fc-a4374c6be37d" },
						{ name: "Melee", value: "22ec12ca-6cad-42ab-9372-e0a25de355cf" },
						{ name: "Occult", value: "a2eb2316-455b-453b-a22e-20080a28a05a" },
						{ name: "Perception", value: "0e8da997-a569-4d9d-a6e3-bfa7741f9d5d" },
						{ name: "Persuasion", value: "8b7665e4-4ce7-4945-b2a2-ad68584f7ec0" },
						{ name: "Repair", value: "346ccae3-2b53-4a8c-aa43-06c47a4f823d" },
						{ name: "Stealth", value: "21402ae4-c62d-4e4c-b2b6-1aed3d7a2c76" },
						{ name: "Technology", value: "0fcfbe94-92b1-49ec-bd7e-ce0f25cff52d" },
						{ name: "Willpower", value: "ba934d8e-4e1c-4fa0-8076-fae8fdb3dd7c" },
					],
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
					choices: [
						{ name: "Athletics", value: "0344a352-9c29-4975-9684-ac70b0416814" },
						{ name: "Craft", value: "f12396ed-700d-43c8-9baa-db77511f6652" },
						{ name: "Drive", value: "3004f56a-e463-4154-904f-72d670da20f2" },
						{ name: "Education", value: "223d87fa-b73c-45cb-8ccf-25c5201619a9" },
						{ name: "Empathy", value: "8db0926c-586c-4aeb-9cc7-1f6bda44fd4e" },
						{ name: "Firearms", value: "38d7fc45-0b15-4b40-bbbf-ec5a250f6f66" },
						{ name: "Intimidate", value: "079eaebd-e349-456b-bd17-dcbc1e03ab00" },
						{ name: "Investigation", value: "d52522b7-c071-434f-93bd-72e0825063fc" },
						{ name: "Language", value: "3d401030-08e6-4828-9164-082555ebbfee" },
						{ name: "Medicine", value: "8a831ee6-7c0b-4bd5-a4fc-a4374c6be37d" },
						{ name: "Melee", value: "22ec12ca-6cad-42ab-9372-e0a25de355cf" },
						{ name: "Occult", value: "a2eb2316-455b-453b-a22e-20080a28a05a" },
						{ name: "Perception", value: "0e8da997-a569-4d9d-a6e3-bfa7741f9d5d" },
						{ name: "Persuasion", value: "8b7665e4-4ce7-4945-b2a2-ad68584f7ec0" },
						{ name: "Repair", value: "346ccae3-2b53-4a8c-aa43-06c47a4f823d" },
						{ name: "Stealth", value: "21402ae4-c62d-4e4c-b2b6-1aed3d7a2c76" },
						{ name: "Technology", value: "0fcfbe94-92b1-49ec-bd7e-ce0f25cff52d" },
						{ name: "Willpower", value: "ba934d8e-4e1c-4fa0-8076-fae8fdb3dd7c" },
					],
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

	const ability = database.abilities.find(
		(ability: abilities) => bufferToUuid(ability.abilityId) === interaction.options.get("ability")?.value
	);

	if (!ability) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) =>
			bufferToUuid(ability.abilityId) === bufferToUuid(characterAbility.abilityId)
	);

	let traitName: string = "";
	let traitValue: number = 0;
	switch (ability.trait) {
		case Trait.body:
			traitName = "Body";
			traitValue = character.body;
			break;
		case Trait.mind:
			traitName = "Mind";
			traitValue = character.mind;
			break;
		case Trait.spirit:
			traitName = "Spirit";
			traitValue = character.spirit;
			break;
	}

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
	const abilityValue = characterAbility?.value ?? 0;

	const total = roll - abilityValue - traitValue;
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
					abilityId: ability.abilityId,
					value: successes,
				},
			});
		}
	}

	let description = `${user}, your character ${character.name} ${
		successes > 0 ? "successfuly increased" : "failed to increase"
	} their ${ability.name} ability${successes > 0 ? " by " + successes.toString() + " points" : ""}.`;

	if (successes > 0) description += `It is now at ${abilityValue + successes} points.`;

	const content = new EmbedBuilder()
		.setColor(successes > 0 ? Colour.Green : Colour.Red)
		.setTitle(`${successes > 0 ? "Successfully increased " : "Failed to increase "} ${ability.name}`)
		.setDescription(description);

	content.addFields({
		name: "Roll",
		value: `Dice: ${roll}${roll === 100 ? " (**Critical)**" : ""}
                Current Value: ${abilityValue + traitValue}
- ${traitName}: ${traitValue}
- Ability: ${abilityValue}
---
Difference: ${total} (${successes} successes)`,
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

	const ability = database.abilities.find(
		(ability: abilities) => bufferToUuid(ability.abilityId) === interaction.options.get("ability")?.value
	);

	if (!ability) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) =>
			bufferToUuid(ability.abilityId) === bufferToUuid(characterAbility.abilityId)
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

	let description = `${user}, your character ${character.name}  successfuly increased their ${ability.name} ability by 1 points.`;
	description += `It is now at ${characterAbility.value + 1} points.`;

	const content = new EmbedBuilder()
		.setColor(Colour.Green)
		.setTitle(`Successfully increased ${ability.name}`)
		.setDescription(description);

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};
