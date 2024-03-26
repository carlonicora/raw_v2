-- CreateTable
CREATE TABLE `campaigns` (
    `campaignId` BINARY(16) NOT NULL,
    `serverId` VARCHAR(32) NOT NULL,
    `discordUserId` VARCHAR(32) NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `campaigns_serverId_key`(`serverId`),
    INDEX `campaignId`(`campaignId`),
    PRIMARY KEY (`campaignId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `characters` (
    `characterId` BINARY(16) NOT NULL,
    `discordUserId` VARCHAR(32) NOT NULL,
    `campaignId` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `bonus` INTEGER NOT NULL DEFAULT 0,
    `damages` INTEGER NOT NULL DEFAULT 0,
    `heroPoints` INTEGER NOT NULL DEFAULT 50,
    `defaultWeaponDamage` INTEGER NOT NULL DEFAULT 0,
    `thumbnail` VARCHAR(255) NULL,

    INDEX `characterId`(`characterId`),
    PRIMARY KEY (`characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `characterAbilities` (
    `characterAbilityId` BINARY(16) NOT NULL,
    `characterId` BINARY(16) NOT NULL,
    `ability` ENUM('Athletics', 'Arts', 'Drive', 'Education', 'Empathy', 'Persuasion', 'Investigation', 'Medicine', 'Melee', 'Occult', 'Perception', 'Ranged', 'Stealth', 'Technology', 'Willpower') NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    INDEX `characterAbilityId`(`characterAbilityId`),
    UNIQUE INDEX `characterAbilities_characterId_ability_key`(`characterId`, `ability`),
    PRIMARY KEY (`characterAbilityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `characters` ADD CONSTRAINT `characters_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`campaignId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `characterAbilities` ADD CONSTRAINT `characterAbilities_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`characterId`) ON DELETE RESTRICT ON UPDATE CASCADE;
