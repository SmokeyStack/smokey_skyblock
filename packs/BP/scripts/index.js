import { ItemStack, Location, MinecraftBlockTypes, MinecraftItemTypes, world } from "@minecraft/server";

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

                if (Math.round(Math.random() * 100) % 3 == 0)
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

world.events.tick.subscribe(detectCoral);
world.events.tick.subscribe(escapeVoid);
world.events.beforePistonActivate.subscribe(detectCoalToDiamond);