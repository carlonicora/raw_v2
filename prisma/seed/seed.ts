import { PrismaClient, Trait } from "@prisma/client";
import { uuidToBuffer } from "../../src/lib/prismaHelpers";

const prisma = new PrismaClient();

async function main() {
	await truncate();

	createAbility("0344a352-9c29-4975-9684-ac70b0416814", Trait.body, "Athletics");
	createAbility("3004f56a-e463-4154-904f-72d670da20f2", Trait.body, "Drive");
	createAbility("38d7fc45-0b15-4b40-bbbf-ec5a250f6f66", Trait.body, "Firearms");
	createAbility("079eaebd-e349-456b-bd17-dcbc1e03ab00", Trait.body, "Intimidate");
	createAbility("22ec12ca-6cad-42ab-9372-e0a25de355cf", Trait.body, "Melee");
	createAbility("346ccae3-2b53-4a8c-aa43-06c47a4f823d", Trait.body, "Repair");

	createAbility("223d87fa-b73c-45cb-8ccf-25c5201619a9", Trait.mind, "Education");
	createAbility("d52522b7-c071-434f-93bd-72e0825063fc", Trait.mind, "Investigation");
	createAbility("3d401030-08e6-4828-9164-082555ebbfee", Trait.mind, "Language");
	createAbility("8a831ee6-7c0b-4bd5-a4fc-a4374c6be37d", Trait.mind, "Medicine");
	createAbility("0e8da997-a569-4d9d-a6e3-bfa7741f9d5d", Trait.mind, "Perception");
	createAbility("0fcfbe94-92b1-49ec-bd7e-ce0f25cff52d", Trait.mind, "Technology");

	createAbility("f12396ed-700d-43c8-9baa-db77511f6652", Trait.spirit, "Craft");
	createAbility("8db0926c-586c-4aeb-9cc7-1f6bda44fd4e", Trait.spirit, "Empathy");
	createAbility("a2eb2316-455b-453b-a22e-20080a28a05a", Trait.spirit, "Occult");
	createAbility("8b7665e4-4ce7-4945-b2a2-ad68584f7ec0", Trait.spirit, "Persuasion");
	createAbility("21402ae4-c62d-4e4c-b2b6-1aed3d7a2c76", Trait.spirit, "Stealth");
	createAbility("ba934d8e-4e1c-4fa0-8076-fae8fdb3dd7c", Trait.spirit, "Willpower");
}

async function createAbility(abilityId: string, trait: Trait, name: string): Promise<void> {
	await prisma.abilities.create({
		data: {
			abilityId: uuidToBuffer(abilityId),
			trait: trait,
			name: name,
		},
	});
}

async function truncate(): Promise<void> {
	await prisma.characterAbilities.deleteMany();
	await prisma.characters.deleteMany();
	await prisma.abilities.deleteMany();
	await prisma.campaigns.deleteMany();
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
