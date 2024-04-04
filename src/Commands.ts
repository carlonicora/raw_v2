import { Command } from "@/Command";
import { Bonus } from "@/commands/Bonus";
import { Campaign } from "@/commands/Campaign";
import { Character } from "@/commands/Character";
import { Hero } from "@/commands/Hero";
import { Inspiration } from "@/commands/Inspiration";
import { Roll } from "@/commands/Roll";
import { Cast } from "./commands/Cast";
import { Damage } from "./commands/Damage";
import { Heal } from "./commands/Heal";
import { Mana } from "./commands/Mana";

export const Commands: Command[] = [
  Bonus,
  Campaign,
  Cast,
  Character,
  Damage,
  Heal,
  Hero,
  Inspiration,
  Mana,
  Roll,
];
