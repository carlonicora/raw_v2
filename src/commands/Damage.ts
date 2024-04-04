import { Command } from "@/Command";
import { AttributesOutputHelper } from "@/helpers/AttributesOutputHelper";
import { Colour } from "@/lib/ColourHelper";
import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { PrismaClient } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Client,
  CommandInteraction,
  EmbedBuilder,
  User,
} from "discord.js";

export const Damage: Command = {
  name: "damage",
  description: "Inflict a damage to a character",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "amount",
      description: "The amount of damage to inflict",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "player",
      description: "Specify the player",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (
    client: Client,
    interaction: CommandInteraction,
    prisma: PrismaClient,
    database: DatabaseHelper,
  ) => {
    await inflictDamage(client, interaction, prisma, database);
  },
};

const inflictDamage = async (
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

  const amount: number | undefined = interaction.options.get("amount")
    ?.value as number;

  let newDamages = character.damages;
  let isCharacterDead = false;
  let desc: string = `${character.name} has been dealt **${amount}** points of damage`;

  const maxHealth = AttributesOutputHelper.getCharacterMaxHealth(character);
  newDamages += amount;
  if (newDamages > maxHealth) {
    newDamages = maxHealth;
    isCharacterDead = true;
    desc += `\n\n**${character.name} has been killed!**\n\n`;
  }

  content
    .setColor(Colour.Red)
    .setTitle("Damage Inflicted")
    .setDescription(desc);

  await prisma.characters.update({
    where: {
      characterId: character.characterId,
    },
    data: {
      damages: newDamages,
    },
  });

  if (!isCharacterDead) {
    character = await database.getCharacter(interaction, discordUser?.id);

    let attributes: string = AttributesOutputHelper.getHealth(character);

    content.addFields({
      name: `Attributes`,
      value: attributes,
      inline: false,
    });
  }

  await interaction.followUp({
    embeds: [content],
  });
};
