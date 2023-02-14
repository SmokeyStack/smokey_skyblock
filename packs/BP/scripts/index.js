import { BlockLocation, ItemStack, MinecraftBlockTypes, MinecraftItemTypes, Vector, system, world } from "@minecraft/server";

let query = {};

let airBlock = MinecraftBlockTypes.air;
let airPerm = airBlock.createDefaultBlockPermutation()

let grassFillOptions = {
    matchingBlock: airPerm
}

let grassBlock = MinecraftBlockTypes.grass;
let grassPerm = grassBlock.createDefaultBlockPermutation()

let nyliumFillOptions = {
    matchingBlock: grassPerm
}

const setupId = system.runSchedule(() => {
    world.getDimension('overworld').fillBlocks(new BlockLocation(-3, 63, -3), new BlockLocation(3, 63, 3), MinecraftBlockTypes.grass, grassFillOptions);
    if (world.getDimension('overworld').getBlock(new BlockLocation(0, 63, 0)).typeId == 'minecraft:grass')
        world.getDimension('overworld').fillBlocks(new BlockLocation(0, 64, 0), new BlockLocation(0, 64, 0), MinecraftBlockTypes.sapling, grassFillOptions);
    world.getDimension('overworld').fillBlocks(new BlockLocation(-2, 63, 0), new BlockLocation(-2, 63, 0), MinecraftBlockTypes.crimsonNylium, nyliumFillOptions);
    world.getDimension('overworld').fillBlocks(new BlockLocation(2, 63, 0), new BlockLocation(2, 63, 0), MinecraftBlockTypes.warpedNylium, nyliumFillOptions);
    let players = world.getDimension('overworld').getPlayers();

    for (let player of players) {
        let tags = player.getTags()
        if (!tags.includes('safe')) {
            player.teleport(new Vector(0, 64, 0), world.getDimension("overworld"), 0, 0, false);
            player.onScreenDisplay.setActionBar("Please wait for the set up system to finish.\nThe process takes 5 minutes upon creating\nthe world due to how slow world generation is");
        }
    }
}, 20);

system.runSchedule(async () => {
    system.clearRunSchedule(setupId);

    await world.getDimension("overworld").runCommandAsync("setworldspawn 0 64 0");

    let players = world.getDimension('overworld').getPlayers();
    for (let player of players) {
        let tags = player.getTags()
        if (!tags.includes('safe')) {
            player.addTag('safe');
            player.onScreenDisplay.setActionBar("You are now free to move");
        }
    }
}, 6000);

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
            let blockLookedAt = player.getBlockFromViewDirection({ maxDistance: 8 });

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

function dropEchoShard(eventData) {
    if (eventData.damageSource.damagingEntity == null)
        return;

    if (eventData.damageSource.cause != 'entityAttack' && (eventData.damageSource.damagingEntity.typeId == "minecraft:warden") && (eventData.damage >= eventData.hurtEntity.getComponent("minecraft:health").current) && (eventData.hurtEntity.typeId == "minecraft:dolphin" || eventData.hurtEntity.typeId == "minecraft:bat"))
        world.getDimension("overworld").spawnItem(new ItemStack(MinecraftItemTypes.echoShard), new BlockLocation(Math.floor(eventData.hurtEntity.location.x), Math.floor(eventData.hurtEntity.location.y + 1), Math.floor(eventData.hurtEntity.location.z)));
}

world.events.beforeItemUseOn.subscribe((eventData) => {
    let block = world.getDimension("overworld").getBlock(eventData.blockLocation);
    if (eventData.item.typeId == "minecraft:potion" && eventData.item.data == 3 && block.typeId == "minecraft:stone") {
        eventData.cancel = true;
        block.setType(MinecraftBlockTypes.deepslate);
        eventData.source.getComponent('minecraft:inventory').container.setItem(eventData.source.selectedSlot, new ItemStack(MinecraftItemTypes.glassBottle, 1, 0));
    }
});

world.events.beforePistonActivate.subscribe(detectCoalToDiamond);

world.events.blockPlace.subscribe(async (eventData) => {
    if (eventData.block.typeId == "minecraft:sculk_shrieker" && world.getDimension("overworld").getBlock(eventData.block.location.offset(0, -1, 0)).typeId == "minecraft:soul_sand") {
        let shriekerPerm = MinecraftBlockTypes.sculkShrieker.createDefaultBlockPermutation();
        shriekerPerm.getProperty('can_summon').value = true;
        eventData.block.setPermutation(shriekerPerm);
    }
});

world.events.entitySpawn.subscribe((eventData) => {
    let entity = eventData.entity;
    let entity_block_loc = new BlockLocation(Math.floor(entity.location.x), Math.floor(entity.location.y), Math.trunc(entity.location.z))
    let block_at_entity = entity.dimension.getBlock(entity_block_loc);
    let vinePerm = MinecraftBlockTypes.glowLichen.createDefaultBlockPermutation()

    if (entity.typeId != 'minecraft:lightning_bolt') return;

    if (block_at_entity.typeId != 'minecraft:lightning_rod' || entity.dimension.getBlock(entity_block_loc.offset(0, -1, 0)).typeId != 'minecraft:glowstone') return;

    if (entity.dimension.getBlock(entity_block_loc.offset(0, -1, -1)).typeId == 'minecraft:vine') {
        vinePerm.getProperty('multi_face_direction_bits').value = 4;
        entity.dimension.getBlock(entity_block_loc.offset(0, -1, -1)).setPermutation(vinePerm);
    }
    if (entity.dimension.getBlock(entity_block_loc.offset(1, -1, 0)).typeId == 'minecraft:vine') {
        vinePerm.getProperty('multi_face_direction_bits').value = 8;
        entity.dimension.getBlock(entity_block_loc.offset(1, -1, 0)).setPermutation(vinePerm);
    }
    if (entity.dimension.getBlock(entity_block_loc.offset(0, -1, 1)).typeId == 'minecraft:vine') {
        vinePerm.getProperty('multi_face_direction_bits').value = 16;
        entity.dimension.getBlock(entity_block_loc.offset(0, -1, 1)).setPermutation(vinePerm);
    }
    if (entity.dimension.getBlock(entity_block_loc.offset(-1, -1, 0)).typeId == 'minecraft:vine') {
        vinePerm.getProperty('multi_face_direction_bits').value = 32;
        entity.dimension.getBlock(entity_block_loc.offset(-1, -1, 0)).setPermutation(vinePerm);
    }
});

world.events.entityHurt.subscribe(dropEchoShard);

world.events.tick.subscribe(detectCoral);