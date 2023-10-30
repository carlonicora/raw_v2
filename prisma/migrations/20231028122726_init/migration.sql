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
    `body` INTEGER NOT NULL DEFAULT 0,
    `mind` INTEGER NOT NULL DEFAULT 0,
    `spirit` INTEGER NOT NULL DEFAULT 0,
    `bonus` INTEGER NOT NULL DEFAULT 0,
    `maxHealth` INTEGER NOT NULL DEFAULT 0,
    `currentHealth` INTEGER NOT NULL DEFAULT 0,
    `thumbnail` VARCHAR(255) NULL,

    UNIQUE INDEX `characters_discordUserId_key`(`discordUserId`),
    INDEX `characterId`(`characterId`),
    PRIMARY KEY (`characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abilities` (
    `abilityId` BINARY(16) NOT NULL,
    `trait` ENUM('body', 'mind', 'spirit') NOT NULL,
    `name` VARCHAR(32) NOT NULL,

    INDEX `abilityId`(`abilityId`),
    PRIMARY KEY (`abilityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `characterAbilities` (
    `characterAbilityId` BINARY(16) NOT NULL,
    `characterId` BINARY(16) NOT NULL,
    `abilityId` BINARY(16) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    INDEX `characterAbilityId`(`characterAbilityId`),
    PRIMARY KEY (`characterAbilityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `characters` ADD CONSTRAINT `characters_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`campaignId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `characterAbilities` ADD CONSTRAINT `characterAbilities_abilityId_fkey` FOREIGN KEY (`abilityId`) REFERENCES `abilities`(`abilityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `characterAbilities` ADD CONSTRAINT `characterAbilities_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`characterId`) ON DELETE RESTRICT ON UPDATE CASCADE;
