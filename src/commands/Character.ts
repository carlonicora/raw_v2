import { Command } from "@/Command";
import { AbilityHelper } from "@/helpers/AbilityHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { bufferToUuid, uuidToBuffer } from "@/lib/prismaHelpers";
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
					choices: AbilityHelper.getAbilityList(),
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
				{
					name: "weapon",
					description: "Set the default weapon damage",
					type: ApplicationCommandOptionType.Integer,
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

	const fields = [];

	let healthModifier = 0;

	let abilitiesField = "";
	let abilitiesValueField = "";

	let valueField = "";

	let maxLength: number = 0;
	AbilityHelper.getAbilityList().forEach((ability: { name: string; value: string }) => {
		if (ability.name.length > maxLength) maxLength = ability.name.length;
	});

	AbilityHelper.getAbilityList().forEach((ability: { name: string; value: string }) => {
		const characterAbility = character.characterAbilities.find(
			(characterAbility: characterAbilities) => characterAbility.ability === ability.name
		);

		const passive = Math.floor((characterAbility?.value ?? 0) / 20);

		let value = characterAbility?.value.toString() ?? "0";
		if (value.length === 1) value = " " + value;

		let abilityName = ability.name;
		abilityName += " ".repeat(maxLength + 1 - abilityName.length);

		valueField += `\`${abilityName}\` ${value} \`${passive}\`\n`;

		abilitiesField += `${ability.name}\n`;
		abilitiesValueField += `${characterAbility?.value.toString() ?? "0"}${
			passive === 0 ? "" : " (*" + passive.toString() + "*)"
		}\n`;

		if (ability.name.toLowerCase() === "athletics" || ability.name.toLowerCase() === "willpower")
			healthModifier += Math.floor((characterAbility?.value ?? 0) / 20);
	});

	fields.push({
		name: `Ability`,
		value: valueField,
		inline: true,
	});

	// fields.push({
	// 	name: `Ability`,
	// 	value: abilitiesField,
	// 	inline: true,
	// });

	// fields.push({
	// 	name: `Value (passive)`,
	// 	value: abilitiesValueField,
	// 	inline: true,
	// });

	const totalHealth = 20 + healthModifier;
	const currentHealth = totalHealth - character.damages;

	fields.push({
		name: `Attributes`,
		value: `**${character.heroPoints}** Hero pts
				**${character.bonus}** Bonus pts
				**${currentHealth}** out of ${totalHealth} Health
				**${character.defaultWeaponDamage}** Default Attack Damage`,
		inline: false,
	});

	try {
		content.addFields(...fields);
	} catch (error) {
		console.log(error);
	}

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

	const damage: number | undefined = interaction.options.get("damage")?.value as number;
	if (damage && damage > 0) data.damage = damage;

	const weapon: number | undefined = interaction.options.get("weapon")?.value as number;
	if (weapon && weapon > 0) data.defaultWeaponDamage = weapon;

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
	const character: characters & { characterAbilities: characterAbilities[] } = await database.getCharacter(interaction);

	const abilityValue: number | undefined = interaction.options.get("value")?.value as number;

	const abilityName: AbilityType = (interaction.options.get("name")?.value?.toString() ?? "") as AbilityType;
	if (!AbilityHelper.checkAbilityExists(abilityName)) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) => characterAbility.ability === abilityName
	);

	if (!characterAbility) {
		await prisma.characterAbilities.create({
			data: {
				characterAbilityId: uuidToBuffer(randomUUID()),
				characterId: character.characterId,
				ability: abilityName,
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
