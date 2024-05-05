import { Command } from "@/Command";
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

export const Inspiration: Command = {
  name: "inspiration",
  description: "Assign an inspiration token to a player",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "player",
      description: "Specify the player",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "Why does the player deserve an inspiration token?",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  run: async (
    client: Client,
    interaction: CommandInteraction,
    prisma: PrismaClient,
    database: DatabaseHelper,
  ) => {
    await assignInspiration(client, interaction, prisma, database);
  },
};

const assignInspiration = async (
  client: Client,
  interaction: CommandInteraction,
  prisma: PrismaClient,
  database: DatabaseHelper,
) => {
  const discordUser: User | null = interaction.options.getUser("player");
  if (!discordUser) throw new Error("You must specify a player");

  const character = await database.getCharacter(
    interaction,
    discordUser?.id,
    true,
  );
  if (!character) throw new Error("The player does not have a character");

  await prisma.characters.update({
    where: {
      characterId: character.characterId,
    },
    data: {
      heroPoints: {
        increment: 1,
      },
    },
  });

  let description = `${discordUser}, your character ${character.name} received an inspration and 3 hero points.`;
  const reason: string | null = interaction.options.get("reason")
    ?.value as string;
  if (reason) description += `\n\nReason: ${reason}`;

  const content = new EmbedBuilder()
    .setColor(Colour.Green)
    .setTitle(`Inspiration token rewarded  Assigned to ${character.name}`)
    .setDescription(description);

  if (character.thumbnail && character.thumbnail !== "")
    content.setThumbnail(character.thumbnail);

  await interaction.followUp({
    embeds: [content],
  });
};
