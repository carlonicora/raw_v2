import { DatabaseHelper } from "@/lib/DatabaseHelper";
import { PrismaClient } from "@prisma/client";
import { ChatInputApplicationCommandData, Client, CommandInteraction } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
	run: (client: Client, interaction: CommandInteraction, prisma: PrismaClient, database: DatabaseHelper) => void;
}
