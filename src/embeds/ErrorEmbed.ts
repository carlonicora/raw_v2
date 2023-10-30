import { EmbedBuilder } from "discord.js";

export class ErrorEmbed {
	constructor(private message: string) {}

	create(): EmbedBuilder {
		return new EmbedBuilder().setColor("#ff0000").setTitle("Error").setDescription(this.message);
	}
}
