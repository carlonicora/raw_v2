import { Command } from "@/Command";
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

export const Character: Command = {
	name: "character",
	description: "Shows the detail of your character",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "details",
			description: "Show the character record sheet",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "player",
					description: "Specify the player",
					type: ApplicationCommandOptionType.User,
					required: false,
				},
			],
		},
		{
			name: "create",
			description: "Create a new character",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "Specify the name of the character",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: "ability",
			description: "Set an ability of your character",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "Select the ability",
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: "Athletics", value: "0344a352-9c29-4975-9684-ac70b0416814" },
						{ name: "Craft", value: "f12396ed-700d-43c8-9baa-db77511f6652" },
						{ name: "Drive", value: "3004f56a-e463-4154-904f-72d670da20f2" },
						{ name: "Education", value: "223d87fa-b73c-45cb-8ccf-25c5201619a9" },
						{ name: "Empathy", value: "8db0926c-586c-4aeb-9cc7-1f6bda44fd4e" },
						{ name: "Ranged", value: "38d7fc45-0b15-4b40-bbbf-ec5a250f6f66" },
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
				{
					name: "value",
					description: "Set the value of an ability",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
		{
			name: "set",
			description: "Set the details of your character",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the character",
					type: ApplicationCommandOptionType.String,
					required: false,
				},
				{
					name: "body",
					description: "The body value of the character",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
				{
					name: "mind",
					description: "The mind value of the character",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
				{
					name: "spirit",
					description: "The spirit value of the character",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
				{
					name: "damage",
					description: "Add a damage amount to the character",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
				{
					name: "thumbnail",
					description: "Add or replace the character thumbnail",
					type: ApplicationCommandOptionType.String,
					required: false,
				},
			],
		},
	],
	run: async (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => {
		switch (interaction.options.data[0]?.name) {
			case "create":
				await createCharacter(client, interaction, prisma, database);
				break;
			case "details":
				await showCharacter(client, interaction, prisma, database);
				break;
			case "set":
				await setCharacter(client, interaction, prisma, database);
				break;
			case "ability":
				await setAbility(client, interaction, prisma, database);
				break;
		}
	},
};

const createCharacter = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const campaign = await database.getCampaign(interaction);

	const existingCharacter: characters | null = await prisma.characters.findFirst({
		where: {
			campaignId: campaign.campaignId,
			discordUserId: interaction.user.id,
		},
	});

	if (existingCharacter) throw new Error("You already have a character in this server");

	const name: string | undefined = interaction.options.get("name")?.value as string;
	if (!name || name === "") throw new Error("Missing character name");

	const content = new EmbedBuilder();

	try {
		const character: characters = await prisma.characters.create({
			data: {
				characterId: uuidToBuffer(randomUUID()),
				campaignId: campaign.campaignId,
				discordUserId: interaction.user.id,
				name: name,
			},
		});

		content
			.setColor("#00ff00")
			.setTitle(character.name)
			.setDescription(`Character ${character.name} successfully created`);
	} catch (error) {
		content
			.setColor("#ff0000")
			.setTitle("Error")
			.setDescription(`${bufferToUuid(campaign.campaignId)} ${interaction.user.id} ${name} ${error}`);
	} finally {
		await interaction.followUp({
			embeds: [content],
		});
	}
};

const showCharacter = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const discordUser: User | null = interaction.options.getUser("player");

	const character = await database.getCharacter(interaction, discordUser?.id);

	const content = new EmbedBuilder().setColor("#000000").setTitle(character.name);
	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	const bodyAbilities: abilities[] = database.abilities.filter((ability: abilities) => ability.trait === Trait.body);
	const mindAbilities: abilities[] = database.abilities.filter((ability: abilities) => ability.trait === Trait.mind);
	const spiritAbilities: abilities[] = database.abilities.filter(
		(ability: abilities) => ability.trait === Trait.spirit
	);

	const fields = [];

	const bodyValues = bodyAbilities.map((ability: abilities) => {
		const characterAbility = character.characterAbilities.find(
			(characterAbility: characterAbilities) =>
				bufferToUuid(characterAbility.abilityId) === bufferToUuid(ability.abilityId)
		);

		const valueStr: string = (characterAbility?.value ?? "0").toString();
		return `${valueStr.padStart(2, `\ `)} ${ability.name}`;
	});
	const mindValues = mindAbilities.map((ability: abilities) => {
		const characterAbility = character.characterAbilities.find(
			(characterAbility: characterAbilities) =>
				bufferToUuid(characterAbility.abilityId) === bufferToUuid(ability.abilityId)
		);

		const valueStr: string = (characterAbility?.value ?? "0").toString();
		return `${valueStr.padStart(2, `\ `)} ${ability.name}`;
	});
	const spiritValues = spiritAbilities.map((ability: abilities) => {
		const characterAbility = character.characterAbilities.find(
			(characterAbility: characterAbilities) =>
				bufferToUuid(characterAbility.abilityId) === bufferToUuid(ability.abilityId)
		);

		const valueStr: string = (characterAbility?.value ?? "0").toString();
		return `${valueStr.padStart(2, `\ `)} ${ability.name}`;
	});

	fields.push({
		name: `**${character.body.toString().padEnd(2, " ")} Body**`,
		value: `${bodyValues.join("\n")}`,
		inline: true,
	});
	fields.push({
		name: `**${character.mind.toString().padEnd(2, " ")} Mind**`,
		value: `${mindValues.join("\n")}`,
		inline: true,
	});
	fields.push({
		name: `**${character.spirit.toString().padEnd(2, " ")} Spirit**`,
		value: `${spiritValues.join("\n")}`,
		inline: true,
	});

	try {
		content.addFields(...fields);
	} catch (error) {
		console.log(error);
	}

	content.addFields({ name: "Available Bonus Points", value: `${character.bonus}`, inline: false });
	content.addFields({
		name: "Health",
		value: `${character.currentHealth} out of ${character.maxHealth}`,
		inline: false,
	});

	await interaction.followUp({
		embeds: [content],
	});
};

const setCharacter = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character: characters = await database.getCharacter(interaction);

	const data: any = {};

	const name: string | undefined = interaction.options.get("name")?.value as string;
	if (name && name !== "") data.name = name;

	const body: number | undefined = interaction.options.get("body")?.value as number;
	if (body && body > 0) {
		data.body = body;
		data.maxHealth = body + 20;
		data.currentHealth = body + 20;
	}

	const mind: number | undefined = interaction.options.get("mind")?.value as number;
	if (mind && mind > 0) data.mind = mind;

	const spirit: number | undefined = interaction.options.get("spirit")?.value as number;
	if (spirit && spirit > 0) data.spirit = spirit;

	const damage: number | undefined = interaction.options.get("damage")?.value as number;
	if (damage && damage > 0) data.damage = damage;

	const thumbnail: string | undefined = interaction.options.get("thumbnail")?.value as string;
	if (thumbnail && thumbnail !== "") data.thumbnail = thumbnail;

	await prisma.characters.update({
		where: {
			characterId: character.characterId,
		},
		data: data,
	});

	await showCharacter(client, interaction, prisma, database);
};

const setAbility = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character: characters = await database.getCharacter(interaction);

	const abilityId: string | undefined = interaction.options.get("name")?.value as string;
	const abilityValue: number | undefined = interaction.options.get("value")?.value as number;

	const characterAbility: characterAbilities | null = await prisma.characterAbilities.findFirst({
		where: {
			characterId: character.characterId,
			abilityId: uuidToBuffer(abilityId),
		},
	});

	if (!characterAbility) {
		await prisma.characterAbilities.create({
			data: {
				characterAbilityId: uuidToBuffer(randomUUID()),
				characterId: character.characterId,
				abilityId: uuidToBuffer(abilityId),
				value: abilityValue,
			},
		});
	} else {
		await prisma.characterAbilities.update({
			where: {
				characterAbilityId: characterAbility.characterAbilityId,
			},
			data: {
				value: abilityValue,
			},
		});
	}

	await showCharacter(client, interaction, prisma, database);
};
