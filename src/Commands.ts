import { Command } from "@/Command";
import { Bonus } from "@/commands/Bonus";
import { Campaign } from "@/commands/Campaign";
import { Character } from "@/commands/Character";
import { Roll } from "@/commands/Roll";

export const Commands: Command[] = [Campaign, Character, Roll, Bonus];
