import { AbilityType, characterAbilities, characters } from "@prisma/client";
import { AbilityHelper } from "./AbilityHelper";

export class AttributesOutputHelper {
  static getHeroPoints(character: characters): string {
    return "`Hero Points       ` **" + character.heroPoints.toString() + "**\n";
  }

  static getBonusPoints(character: characters): string {
    return "`Bonus Points      ` **" + character.bonus.toString() + "**\n";
  }

  static getCharacterMaxHealth(
    character: characters & { characterAbilities: characterAbilities[] },
  ): number {
    let healthModifier = 0;
    AbilityHelper.getAbilityList().forEach(
      (ability: { name: string; value: string }) => {
        const characterAbility = character.characterAbilities.find(
          (characterAbility: characterAbilities) =>
            characterAbility.ability === ability.name,
        );

        if (
          ability.name.toLowerCase() === "athletics" ||
          ability.name.toLowerCase() === "willpower"
        )
          healthModifier += Math.floor((characterAbility?.value ?? 0) / 20);
      },
    );

    return 20 + healthModifier;
  }

  static getHealth(
    character: characters & { characterAbilities: characterAbilities[] },
  ): string {
    const totalHealth = AttributesOutputHelper.getCharacterMaxHealth(character);
    const currentHealth = totalHealth - character.damages;

    return (
      "`Health            ` **" +
      currentHealth.toString() +
      "**/" +
      totalHealth.toString() +
      "\n"
    );
  }

  static getAttackDamage(character: characters): string {
    return (
      "`Attack Damage     ` **" +
      character.defaultWeaponDamage.toString() +
      "**\n"
    );
  }

  static getDefence(
    character: characters & { characterAbilities: characterAbilities[] },
  ): string {
    const athletics = character.characterAbilities.find(
      (characterAbility: characterAbilities) =>
        characterAbility.ability === AbilityType.Athletics,
    );

    const melee = character.characterAbilities.find(
      (characterAbility: characterAbilities) =>
        characterAbility.ability === AbilityType.Melee,
    );

    const Defence = Math.max(athletics?.value ?? 0, melee?.value ?? 0);
    const passiveDefence = Math.floor((Defence ?? 0) / 20);
    return (
      "`Defence           ` **" +
      (character.defaultArmourValue + passiveDefence).toString() +
      "**\n"
    );
  }

  static getMana(
    character: characters & { characterAbilities: characterAbilities[] },
  ): string {
    const occult = character.characterAbilities.find(
      (characterAbility: characterAbilities) =>
        characterAbility.ability === AbilityType.Occult,
    );
    const passiveOccult = Math.floor((occult?.value ?? 0) / 20);
    const totalMana = 5 * passiveOccult;
    let availableMana: number = totalMana - character.manaUsed;
    if (availableMana < 0) availableMana = 0;

    return (
      "`Mana              ` **" +
      availableMana.toString() +
      "**/" +
      totalMana.toString() +
      "\n"
    );
  }
}
