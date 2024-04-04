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

export const Mana: Command = {
  name: "mana",
  description: "Manage your mana pool",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "restore",
      description: "Restore a speficic amount of mana points",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "amount",
          description: "The amount of mana restored",
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
      ],
    },
    {
      name: "full",
      description: "Restore all your mana points",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  run: async (
    client: Client,
    interaction: CommandInteraction,
    prisma: PrismaClient,
    database: DatabaseHelper,
  ) => {
    await restoreMana(
      client,
      interaction,
      prisma,
      database,
      interaction.options.data[0].name === "full",
    );
  },
};

const restoreMana = async (
  client: Client,
  interaction: CommandInteraction,
  prisma: PrismaClient,
  database: DatabaseHelper,
  fullRestore: boolean,
) => {
  const discordUser: User | null = interaction.options.getUser("player");

  let character = await database.getCharacter(interaction, discordUser?.id);

  const content = new EmbedBuilder()
    .setColor(Colour.Green)
    .setTitle("Mana Restored");

  if (character.thumbnail && character.thumbnail !== "")
    content.setThumbnail(character.thumbnail);

  const amount: number = fullRestore
    ? character.manaUsed
    : ((interaction.options.get("amount")?.value ?? 0) as number);

  const newManaUsed = character.manaUsed - amount;

  await prisma.characters.update({
    where: {
      characterId: character.characterId,
    },
    data: {
      manaUsed: newManaUsed,
    },
  });
  character = await database.getCharacter(interaction, discordUser?.id);

  if (fullRestore) {
    content.setDescription(
      `${character.name}'s mana points have been fully restored.`,
    );
  } else {
    content.setDescription(
      `${character.name} has restored ${amount} mana points.`,
    );
  }

  content.addFields({
    name: `Attributes`,
    value: AttributesOutputHelper.getMana(character),
    inline: false,
  });

  await interaction.followUp({
    embeds: [content],
  });
};
