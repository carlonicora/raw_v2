import { Colour } from "@/lib/ColourHelper";
import { EmbedBuilder } from "discord.js";

export class ErrorEmbed {
  constructor(private message: string) {}

  create(): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colour.Red)
      .setTitle("Error")
      .setDescription(this.message);
  }
}
