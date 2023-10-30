import { Command } from "@/Command";
import { successColour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { bufferToUuid } from "@/lib/prismaHelpers";
import { PrismaClient, Trait, abilities, characterAbilities } from "@prisma/client";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	Client,
	ColorResolvable,
	CommandInteraction,
	EmbedBuilder,
} from "discord.js";

export const Roll: Command = {
	name: "roll",
	description: "roll an ability check",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "ability",
			description: "Roll an ability",
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
				{
					name: "bonus",
					description: "Add or remove a bonus to the roll",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
			],
		},
		{
			name: "dice",
			description: "Roll a 1d20 dice",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "bonus",
					description: "Add or remove a bonus to the roll",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
	],
	run: async (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => {
		switch (interaction.options.data[0]?.name) {
			case "ability":
				await rollAbility(client, interaction, prisma, database);
				break;
			case "dice":
				await rollDice(client, interaction, prisma, database);
				break;
		}
	},
};

function getRoll(): number {
	return Math.floor(Math.random() * 20) + 1;
}

const rollAbility = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const character = await database.getCharacter(interaction);

	const ability = database.abilities.find(
		(ability: abilities) => bufferToUuid(ability.abilityId) === interaction.options.get("name")?.value
	);

	if (!ability) throw new Error("Ability not found");

	const characterAbility = character.characterAbilities.find(
		(characterAbility: characterAbilities) =>
			bufferToUuid(ability.abilityId) === bufferToUuid(characterAbility.abilityId)
	);

	const abilityValue = characterAbility?.value ?? 0;

	const roll: number = getRoll();

	let traitName: string = "";
	let trait: number = 0;
	switch (ability.trait) {
		case Trait.body:
			traitName = "Body";
			trait = character.body;
			break;
		case Trait.mind:
			traitName = "Mind";
			trait = character.mind;
			break;
		case Trait.spirit:
			traitName = "Spirit";
			trait = character.spirit;
			break;
	}

	const bonus: number | undefined = interaction.options.get("bonus")?.value as number;
	const isCritical: boolean = roll === 20;
	const isFumble: boolean = roll === 1;
	const criticalValue: number = isCritical ? 20 : isFumble ? -21 : 0;
	let result = roll + (bonus ?? 0) + criticalValue + abilityValue + (abilityValue === 0 ? -10 : 0) + trait;
	if (result < 0) result = 0;

	const successes: number = result === 0 ? 0 : Math.floor(result / 20);

	const description = `Dice: ${roll}${isCritical ? " (**Critical: +20)**" : isFumble ? " (**Fumble: -20)**" : ""}
	${traitName}: ${trait}
	Ability: ${abilityValue === 0 ? "-10" : abilityValue}${abilityValue === 0 ? "** (untrained)**" : ""}${
		bonus ? `\nBonus: ${bonus}` : ""
	}`;

	const content = new EmbedBuilder()
		.setColor(successColour(successes) as ColorResolvable)
		.setTitle(`**${ability.name}: ${successes} ${successes === 1 ? "Success" : "Successes"}**`)
		.setDescription(`${ability.name} check for **${character.name}**`)
		.addFields({ name: `Result: ${result}`, value: description, inline: false });

	if (character.thumbnail && character.thumbnail !== "") content.setThumbnail(character.thumbnail);

	await interaction.followUp({
		embeds: [content],
	});
};

const rollDice = async (
	client: Client,
	interaction: CommandInteraction,
	prisma: PrismaClient,
	database: DatabaseHelper
) => {
	const roll: number = getRoll();
	const bonus: number | undefined = interaction.options.get("bonus")?.value as number;

	const isCritical: boolean = roll === 20;
	const isFumble: boolean = roll === 1;
	const criticalValue: number = isCritical ? 20 : isFumble ? -21 : 0;

	let result = roll + (bonus ?? 0) + criticalValue;
	if (result < 0) result = 0;

	const successes: number = result === 0 ? 0 : Math.floor(result / 20);

	const description = `Dice: ${roll}${isCritical ? " (**Critical: +20)**" : isFumble ? " (**Fumble: -20)**" : ""}
	Bonus: ${bonus ?? 0}`;

	const content = new EmbedBuilder()
		.setColor(successColour(successes) as ColorResolvable)
		.setTitle(`**${successes} ${successes === 1 ? "Success" : "Successes"}**`)
		.addFields({ name: `${result} - Result`, value: description, inline: false });

	await interaction.followUp({
		embeds: [content],
	});
};
