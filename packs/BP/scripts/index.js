import { BlockLocation, ItemStack, Location, MinecraftBlockTypes, MinecraftItemTypes, world } from "@minecraft/server";

let query = {};

async function setup() {
    await world.getDimension("overworld").runCommandAsync("tickingarea add -16 63 -16 31 63 31 spawn true")
        .then(world.getDimension("overworld").runCommandAsync("setworldspawn 0 64 0"))
        .then(world.getDimension("overworld").runCommandAsync("tp @a 0 64 0"))
        .then(world.getDimension("overworld").runCommandAsync("fill -3 63 -3 3 63 3 grass 0 replace air"))
        .then(world.getDimension("overworld").runCommandAsync("fill 0 64 0 0 64 0 sapling 0 replace air"))
        .then(world.getDimension("overworld").runCommandAsync("fill 2 63 0 2 63 0 crimson_nylium 0 replace grass"))
        .then(world.getDimension("overworld").runCommandAsync("fill -2 63 0 -2 63 0 warped_nylium 0 replace grass"))
        .then(world.events.tick.unsubscribe(setup));
}

world.events.tick.subscribe(setup);

world.events.beforeItemUseOn.subscribe(async (eventData) => {
    let block = world.getDimension("overworld").getBlock(eventData.blockLocation);
    if (eventData.item.typeId == "minecraft:potion" && eventData.item.data == 3 && block.typeId == "minecraft:stone") {
        eventData.cancel = true;
        block.setType(MinecraftBlockTypes.deepslate);
        await eventData.source.runCommandAsync("clear @s potion 3 1").then(eventData.source.runCommandAsync("give @s minecraft:glass_bottle"));
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

function detectVineToLichen(eventData) {
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

function dropEchoShard(eventData) {
    if (eventData.cause != 'entityAttack' && (eventData.damagingEntity.typeId == "minecraft:warden") && (eventData.damage >= eventData.hurtEntity.getComponent("minecraft:health").current) && (eventData.hurtEntity.typeId == "minecraft:dolphin" || eventData.hurtEntity.typeId == "minecraft:bat"))
        world.getDimension("overworld").spawnItem(new ItemStack(MinecraftItemTypes.echoShard), new BlockLocation(Math.floor(eventData.hurtEntity.location.x), Math.floor(eventData.hurtEntity.location.y + 1), Math.floor(eventData.hurtEntity.location.z)));
}

world.events.beforePistonActivate.subscribe(detectCoalToDiamond);

world.events.entityCreate.subscribe(detectVineToLichen);

world.events.entityHurt.subscribe(dropEchoShard);

world.events.tick.subscribe(detectCoral);
world.events.tick.subscribe(escapeVoid);

world.events.blockPlace.subscribe(async (eventData) => {
    if (eventData.block.typeId == "minecraft:sculk_shrieker" && world.getDimension("overworld").getBlock(eventData.block.location.offset(0, -1, 0)).typeId == "minecraft:soul_sand") {
        eventData.player.runCommandAsync(`say ${eventData.block.typeId}`);
        world.getDimension("overworld").runCommandAsync(`setblock ${eventData.block.location.x} ${eventData.block.location.y} ${eventData.block.location.z} sculk_shrieker [\"can_summon\": true]`);
    }
});