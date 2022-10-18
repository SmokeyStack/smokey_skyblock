import { BlockLocation, BlockPermutation, ItemStack, Location, MinecraftBlockTypes, MinecraftItemTypes, world } from "@minecraft/server";

let hasRan = false;
let query = {};

world.events.tick.subscribe(async () => {
    if (!hasRan && (world.getAbsoluteTime() <= 2000)) {
        await world.getDimension("overworld").runCommandAsync("fill -3 63 -3 3 63 3 grass 0 replace air");
        await world.getDimension("overworld").runCommandAsync("setworldspawn 0 64 0");
        await world.getDimension("overworld").runCommandAsync("fill 0 64 0 0 64 0 sapling 0 replace air");
        hasRan = true;
    }
});

world.events.beforeItemUseOn.subscribe(async (eventData) => {
    let block = world.getDimension("overworld").getBlock(eventData.blockLocation);
    if (eventData.item.typeId == "minecraft:potion" && eventData.item.data == 3 && block.typeId == "minecraft:stone") {
        block.setType(MinecraftBlockTypes.deepslate);
        clearPotion(eventData.source);
        await eventData.source.runCommandAsync("give @s minecraft:glass_bottle");
    }
});

async function clearPotion(player) {
    await player.runCommandAsync("clear @s potion 3 1");
}

function escapeVoid() {
    let players = world.getDimension("overworld").getPlayers(query);

    for (let player of players) {
        if (player.location.y <= -64) {
            player.teleport(new Location(0, 64, 0), world.getDimension("overworld"), player.rotation.x, player.rotation.y);
            world.events.tick.unsubscribe(escapeVoid);
        }
    }

}

function detectCoalToDiamond(eventData) {
    let coal_location = eventData.block.location.offset(0, -1, 0);
    let entities = world.getDimension("overworld").getEntitiesAtBlockLocation(coal_location);

    for (let entity of entities)
        if (entity.getComponent('minecraft:item').itemStack.typeId == "minecraft:coal" && entity.getComponent('minecraft:item').itemStack.amount == 64) {
            entity.kill();
            world.getDimension("overworld").spawnItem(new ItemStack(MinecraftItemTypes.diamond), coal_location);
        }


}

function detectCoral(eventData) {
    if (eventData.currentTick % 200 == 0)
        for (let player of world.getDimension("overworld").getPlayers(query)) {
            let blockLookedAt = player.getBlockFromViewVector({ maxDistance: 8 });

            if (blockLookedAt.typeId == "minecraft:coral_fan_dead") {
                if (blockLookedAt.isWaterlogged && blockLookedAt.permutation.getProperty("coral_color").value == "red" && (detectFlowingWater(blockLookedAt, 'n') || detectFlowingWater(blockLookedAt, 'e') || detectFlowingWater(blockLookedAt, 's') || detectFlowingWater(blockLookedAt, 'w')))
                    world.getDimension("overworld").spawnItem(new ItemStack(MinecraftItemTypes.sand, 1, 1), blockLookedAt.location);
                else if (blockLookedAt.isWaterlogged && (detectFlowingWater(blockLookedAt, 'n') || detectFlowingWater(blockLookedAt, 'e') || detectFlowingWater(blockLookedAt, 's') || detectFlowingWater(blockLookedAt, 'w')))
                    world.getDimension("overworld").spawnItem(new ItemStack(MinecraftItemTypes.sand), blockLookedAt.location);

                if (Math.round(Math.random() * 100) % 4 == 0)
                    blockLookedAt.setType(MinecraftBlockTypes.air);
            }
        }
}

function detectFlowingWater(block, dir) {
    switch (dir) {
        case 'n':
            for (let prop of world.getDimension("overworld").getBlock(block.location.offset(0, 0, -1)).permutation.getAllProperties())
                return prop.value != 0; break;
        case 'e':
            for (let prop of world.getDimension("overworld").getBlock(block.location.offset(1, 0, 0)).permutation.getAllProperties())
                return prop.value != 0; break;
        case 's':
            for (let prop of world.getDimension("overworld").getBlock(block.location.offset(0, 0, 1)).permutation.getAllProperties())
                return prop.value != 0; break;
        case 'w':
            for (let prop of world.getDimension("overworld").getBlock(block.location.offset(-1, 0, 0)).permutation.getAllProperties())
                return prop.value != 0; break;
        default: return false; break;
    }
}

function detectGoat(eventData) {
    if (world.getDimension("overworld").getBlock(new BlockLocation(Math.floor(eventData.entity.location.x), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z - 1))).typeId == "minecraft:vine")
        setLichen(Math.floor(eventData.entity.location.x), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z - 1), 4);

    if (world.getDimension("overworld").getBlock(new BlockLocation(Math.floor(eventData.entity.location.x + 1), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z))).typeId == "minecraft:vine")
        setLichen(Math.floor(eventData.entity.location.x + 1), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z), 8);

    if (world.getDimension("overworld").getBlock(new BlockLocation(Math.floor(eventData.entity.location.x), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z + 1))).typeId == "minecraft:vine")
        setLichen(Math.floor(eventData.entity.location.x), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z + 1), 16);

    if (world.getDimension("overworld").getBlock(new BlockLocation(Math.floor(eventData.entity.location.x - 1), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z))).typeId == "minecraft:vine")
        setLichen(Math.floor(eventData.entity.location.x - 1), Math.floor(eventData.entity.location.y - 1), Math.floor(eventData.entity.location.z), 32);
}

async function setLichen(x, y, z, bit) {
    await world.getDimension("overworld").runCommandAsync(`setblock ${x} ${y} ${z} glow_lichen [\"multi_face_direction_bits\": ${bit}]`);
}

world.events.tick.subscribe(detectCoral);
world.events.tick.subscribe(escapeVoid);

world.events.beforePistonActivate.subscribe(detectCoalToDiamond);
world.events.entityCreate.subscribe(detectGoat);