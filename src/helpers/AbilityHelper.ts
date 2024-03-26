export class AbilityHelper {
	static getAbilityList(): { name: string; value: string }[] {
		return [
			{ name: "Athletics", value: "Athletics" },
			{ name: "Arts", value: "Arts" },
			{ name: "Drive", value: "Drive" },
			{ name: "Education", value: "Education" },
			{ name: "Empathy", value: "Empathy" },
			{ name: "Persuasion", value: "Persuasion" },
			{ name: "Investigation", value: "Investigation" },
			{ name: "Medicine", value: "Medicine" },
			{ name: "Melee", value: "Melee" },
			{ name: "Occult", value: "Occult" },
			{ name: "Perception", value: "Perception" },
			{ name: "Ranged", value: "Ranged" },
			{ name: "Stealth", value: "Stealth" },
			{ name: "Technology", value: "Technology" },
			{ name: "Willpower", value: "Willpower" },
		];
	}

	static checkAbilityExists(ability: string): boolean {
		return this.getAbilityList().some((a) => a.value.toLowerCase() === ability.toLowerCase());
	}
}
