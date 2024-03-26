import { DatabaseHelper } from "@/lib/DatabaseHelper";
import interactionCreate from "@/listeners/interactionCreate";
import ready from "@/listeners/ready";
import { PrismaClient } from "@prisma/client";
import { Client } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

console.log("Bot is starting...");

const token = process.env.DISCORD_TOKEN;

const client = new Client({
	intents: [],
});

const prisma = new PrismaClient();
const database = new DatabaseHelper(prisma);
ready(client);
interactionCreate(client, prisma, database);
client.login(token);
