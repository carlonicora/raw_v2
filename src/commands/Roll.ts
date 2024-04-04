import { Command } from "@/Command";
import { AbilityHelper } from "@/helpers/AbilityHelper";
import { successColour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { AbilityType, PrismaClient, characterAbilities } from "@prisma/client";
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
          choices: AbilityHelper.getAbilityList(),
        },
        {
          name: "bonus",
          description: "Add or remove a bonus to the roll",
          type: ApplicationCommandOptionType.Integer,
          required: false,
        },
        {
          name: "damage",
          description: "Set the damage of the weapon if it's an attack roll",
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
  run: async (
    client: Client,
    interaction: CommandInteraction,
    prisma: PrismaClient,
    database: DatabaseHelper,
  ) => {
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
  database: DatabaseHelper,
) => {
  const character = await database.getCharacter(interaction);

  const abilityName: AbilityType = (interaction.options
    .get("name")
    ?.value?.toString() ?? "") as AbilityType;
  if (!AbilityHelper.checkAbilityExists(abilityName))
    throw new Error("Ability not found");

  const characterAbility = character.characterAbilities.find(
    (characterAbility: characterAbilities) =>
      characterAbility.ability === abilityName,
  );

  const abilityValue = characterAbility?.value ?? 0;

  const roll: number = getRoll();

  const bonus: number | undefined = interaction.options.get("bonus")
    ?.value as number;
  const isCritical: boolean = roll === 20;
  const isFumble: boolean = roll === 1;
  const criticalValue: number = isCritical ? 20 : isFumble ? -21 : 0;
  let result = roll + (bonus ?? 0) + criticalValue + abilityValue;
  if (result < 0) result = 0;

  const successes: number = result === 0 ? 0 : Math.floor(result / 20);

  let description = `Dice: ${roll}${
    isCritical ? " (**Critical: +20)**" : isFumble ? " (**Fumble: -20)**" : ""
  }
	Ability: ${abilityValue}${bonus ? `\nBonus: ${bonus}` : ""}`;

  if (
    (abilityName === AbilityType.Melee || abilityName === AbilityType.Ranged) &&
    (interaction.options.get("damage") || character.defaultWeaponDamage !== 0)
  ) {
    let damage: number = (interaction.options.get("damage")?.value ??
      0) as number;
    if (damage === 0) damage = character.defaultWeaponDamage;

    if (damage > 0) {
      const inflictedDamage: number = damage * successes;
      description += `\n\nDamage: ${inflictedDamage}`;
    }
  }

  const content = new EmbedBuilder()
    .setColor(successColour(successes) as ColorResolvable)
    .setTitle(
      `**${abilityName}: ${successes} ${
        successes === 1 ? "Success" : "Successes"
      }**`,
    )
    .setDescription(`${abilityName} check for **${character.name}**`)
    .addFields({
      name: `Result: ${result}`,
      value: description,
      inline: false,
    });

  if (character.thumbnail && character.thumbnail !== "")
    content.setThumbnail(character.thumbnail);

  await interaction.followUp({
    embeds: [content],
  });
};

const rollDice = async (
  client: Client,
  interaction: CommandInteraction,
  prisma: PrismaClient,
  database: DatabaseHelper,
) => {
  const roll: number = getRoll();
  const bonus: number | undefined = interaction.options.get("bonus")
    ?.value as number;

  const isCritical: boolean = roll === 20;
  const isFumble: boolean = roll === 1;
  const criticalValue: number = isCritical ? 20 : isFumble ? -21 : 0;

  let result = roll + (bonus ?? 0) + criticalValue;
  if (result < 0) result = 0;

  const successes: number = result === 0 ? 0 : Math.floor(result / 20);

  const description = `Dice: ${roll}${
    isCritical ? " (**Critical: +20)**" : isFumble ? " (**Fumble: -20)**" : ""
  }
	Bonus: ${bonus ?? 0}`;

  const content = new EmbedBuilder()
    .setColor(successColour(successes) as ColorResolvable)
    .setTitle(`**${successes} ${successes === 1 ? "Success" : "Successes"}**`)
    .addFields({
      name: `${result} - Result`,
      value: description,
      inline: false,
    });

  await interaction.followUp({
    embeds: [content],
  });
};
