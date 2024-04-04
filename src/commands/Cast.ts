import { Command } from "@/Command";
import { AttributesOutputHelper } from "@/helpers/AttributesOutputHelper";
import { Colour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { AbilityType, PrismaClient, characterAbilities } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Client,
  CommandInteraction,
  EmbedBuilder,
  User,
} from "discord.js";

export const Cast: Command = {
  name: "cast",
  description: "Cast a spell",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "challenge",
      description: "The difficulty threshold for the spell to succeed",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "damage",
      description: "The amount of damage the spell deals per success",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  run: async (
    client: Client,
    interaction: CommandInteraction,
    prisma: PrismaClient,
    database: DatabaseHelper,
  ) => {
    await castSpell(client, interaction, prisma, database);
  },
};

function getRoll(): number {
  return Math.floor(Math.random() * 20) + 1;
}

const castSpell = async (
  client: Client,
  interaction: CommandInteraction,
  prisma: PrismaClient,
  database: DatabaseHelper,
) => {
  const discordUser: User | null = interaction.options.getUser("player");
  let character = await database.getCharacter(interaction, discordUser?.id);

  const content = new EmbedBuilder();

  if (character.thumbnail && character.thumbnail !== "")
    content.setThumbnail(character.thumbnail);

  const occult = character.characterAbilities.find(
    (characterAbility: characterAbilities) =>
      characterAbility.ability === AbilityType.Occult,
  );
  const passiveOccult = Math.floor((occult?.value ?? 0) / 20);
  const totalMana = 5 * passiveOccult;

  const abilityValue = occult?.value ?? 0;
  if (abilityValue === 0)
    throw new Error(`${character.name} cannot cast spells`);

  const challenge: number | undefined = interaction.options.get("challenge")
    ?.value as number;

  let manaUsed = character.manaUsed + challenge;
  let addedDamage = 0;
  if (manaUsed > totalMana) {
    addedDamage = manaUsed - totalMana;
    manaUsed = totalMana;
  }

  await prisma.characters.update({
    where: {
      characterId: character.characterId,
    },
    data: {
      manaUsed: manaUsed,
      damages: {
        increment: addedDamage,
      },
    },
  });
  character = await database.getCharacter(interaction, discordUser?.id);

  const roll: number = getRoll();

  const isCritical: boolean = roll === 20;
  const isFumble: boolean = roll === 1;
  const criticalValue: number = isCritical ? 20 : isFumble ? -21 : 0;
  let result = roll + criticalValue + abilityValue;
  if (result < 0) result = 0;

  const successes: number = result === 0 ? 0 : Math.floor(result / 20);

  let description: string = "";

  if (successes >= challenge) {
    content
      .setColor(Colour.Green)
      .setTitle(
        `Spell Cast: ${successes} ${successes === 1 ? "Success" : "Successes"}`,
      );

    description = `**${character.name}** successfully cast their spell.`;

    const damage: number = (interaction.options.get("damage")?.value ??
      0) as number;
    if (damage > 0) {
      const inflictedDamage: number = damage * successes;
      description += `\n\nThe spell caused **${inflictedDamage}** damage ${
        inflictedDamage === 1 ? "point" : "points"
      }`;
    }
  } else {
    content
      .setColor(Colour.Red)
      .setTitle(
        `Cast Failed: ${successes} ${
          successes === 1 ? "Success" : "Successes"
        }`,
      );

    description = `**${character.name}** failed to cast their spell. They achieved ${successes} successes when they needed ${challenge}.`;
  }

  content.setDescription(description);

  let abilityDescription = `Dice: ${roll}${
    isCritical ? " (**Critical: +20)**" : isFumble ? " (**Fumble: -20)**" : ""
  }
  Ability: ${abilityValue}`;

  content.addFields({
    name: `Result: ${result}`,
    value: abilityDescription,
    inline: false,
  });

  let attributes: string = AttributesOutputHelper.getMana(character);

  if (addedDamage > 0) {
    if (successes >= challenge) content.setColor(Colour.Yellow);

    attributes += AttributesOutputHelper.getHealth(character);

    content.addFields({
      name: `Consumed by Magic!`,
      value: `${character.name} draw **${addedDamage}** mana points from their life, inflicting themselves ${addedDamage} damage points.`,
      inline: false,
    });
  }

  content.addFields({
    name: `Attributes`,
    value: attributes,
    inline: false,
  });

  await interaction.followUp({
    embeds: [content],
  });
};
