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

export const Heal: Command = {
  name: "heal",
  description: "Heal a character",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "amount",
      description: "The amount of life points to restore",
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
    await healDamage(client, interaction, prisma, database);
  },
};

const healDamage = async (
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

  content
    .setColor(Colour.Green)
    .setTitle("Damage Healed")
    .setDescription(
      `${character.name} has been healed by **${amount}** points of damage`,
    );

  newDamages -= amount;

  if (newDamages < 0) newDamages = 0;

  await prisma.characters.update({
    where: {
      characterId: character.characterId,
    },
    data: {
      damages: newDamages,
    },
  });

  character = await database.getCharacter(interaction, discordUser?.id);

  let attributes: string = AttributesOutputHelper.getHealth(character);

  content.addFields({
    name: `Attributes`,
    value: attributes,
    inline: false,
  });

  await interaction.followUp({
    embeds: [content],
  });
};
