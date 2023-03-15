import {
    system,
    world,
    Block,
    BlockPermutation,
    Entity,
    EntityHealthComponent,
    EntityItemComponent,
    EntityInventoryComponent,
    ItemStack,
    MinecraftBlockTypes,
    MinecraftItemTypes,
    Player,
    PlayerIterator,
    Vector,
    Vector3
} from '@minecraft/server';

let air_permutation: BlockPermutation =
    BlockPermutation.resolve('minecraft:air');
let grass_permutation: BlockPermutation =
    BlockPermutation.resolve('minecraft:grass');

const setupId = system.runInterval(() => {
    world
        .getDimension('overworld')
        .fillBlocks(
            { x: -3, y: 63, z: -3 },
            { x: 3, y: 63, z: 3 },
            MinecraftBlockTypes.grass,
            {
                matchingBlock: air_permutation
            }
        );
    if (
        world.getDimension('overworld').getBlock({ x: 0, y: 63, z: 0 })
            .typeId == 'minecraft:grass'
    )
        world
            .getDimension('overworld')
            .fillBlocks(
                { x: 0, y: 64, z: 0 },
                { x: 0, y: 64, z: 0 },
                MinecraftBlockTypes.sapling,
                {
                    matchingBlock: air_permutation
                }
            );
    world
        .getDimension('overworld')
        .fillBlocks(
            { x: -2, y: 63, z: 0 },
            { x: -2, y: 63, z: 0 },
            MinecraftBlockTypes.crimsonNylium,
            {
                matchingBlock: grass_permutation
            }
        );
    world
        .getDimension('overworld')
        .fillBlocks(
            { x: 2, y: 63, z: 0 },
            { x: 2, y: 63, z: 0 },
            MinecraftBlockTypes.warpedNylium,
            {
                matchingBlock: grass_permutation
            }
        );
    let players: PlayerIterator = world.getDimension('overworld').getPlayers();

    for (let player of players) {
        let tags: string[] = player.getTags();
        if (!tags.includes('safe')) {
            player.teleport(
                new Vector(0, 64, 0),
                world.getDimension('overworld'),
                0,
                0,
                false
            );
            player.onScreenDisplay.setActionBar(
                'Please wait for the set up system to finish.\nThe process takes 5 minutes upon creating\nthe world due to how slow world generation is'
            );
        }
    }
}, 20);

system.runInterval(async () => {
    system.clearRun(setupId);

    await world
        .getDimension('overworld')
        .runCommandAsync('setworldspawn 0 64 0');

    let players: PlayerIterator = world.getDimension('overworld').getPlayers();
    for (let player of players) {
        let tags: string[] = player.getTags();
        if (!tags.includes('safe')) {
            player.addTag('safe');
            player.onScreenDisplay.setActionBar('You are now free to move');
        }
    }
}, 6000);

system.runInterval(() => {
    for (let player of world.getDimension('overworld').getPlayers()) {
        let blockLookedAt: Block = player.getBlockFromViewDirection({
            maxDistance: 8
        }) as any;

        if (blockLookedAt == null) return;

        if (blockLookedAt.typeId == 'minecraft:coral_fan_dead') {
            let coral_color: string = blockLookedAt.permutation.getProperty(
                'coral_color'
            ) as any;

            if (
                blockLookedAt.isWaterlogged &&
                coral_color == 'red' &&
                (detectFlowingWater(blockLookedAt, 'n') ||
                    detectFlowingWater(blockLookedAt, 'e') ||
                    detectFlowingWater(blockLookedAt, 's') ||
                    detectFlowingWater(blockLookedAt, 'w'))
            )
                player.dimension.fillBlocks(
                    Vector.add(blockLookedAt.location, { x: 0, y: 1, z: 0 }),
                    Vector.add(blockLookedAt.location, { x: 0, y: 1, z: 0 }),
                    BlockPermutation.resolve('minecraft:sand', {
                        sand_type: 'red'
                    }),
                    { matchingBlock: BlockPermutation.resolve('minecraft:air') }
                );
            else if (
                blockLookedAt.isWaterlogged &&
                (detectFlowingWater(blockLookedAt, 'n') ||
                    detectFlowingWater(blockLookedAt, 'e') ||
                    detectFlowingWater(blockLookedAt, 's') ||
                    detectFlowingWater(blockLookedAt, 'w'))
            )
                world
                    .getDimension('overworld')
                    .spawnItem(
                        new ItemStack(MinecraftItemTypes.sand),
                        blockLookedAt.location
                    );

            if (Math.round(Math.random() * 100) % 4 == 0)
                blockLookedAt.setType(MinecraftBlockTypes.air);
        }
    }
}, 20);

function detectFlowingWater(block: Block, dir: string): boolean {
    switch (dir) {
        case 'n': {
            let prop: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: -1 }))
                .permutation.getProperty('liquid_depth') as any;
            return prop != 0;
        }
        case 'e': {
            let prop: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 1, y: 0, z: 0 }))
                .permutation.getProperty('liquid_depth') as any;
            return prop != 0;
        }
        case 's': {
            let prop: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: 1 }))
                .permutation.getProperty('liquid_depth') as any;
            return prop != 0;
        }
        case 'w': {
            let prop: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: -1, y: 0, z: 0 }))
                .permutation.getProperty('liquid_depth') as any;
            return prop != 0;
        }
        default:
            return false;
    }
}

world.events.itemUseOn.subscribe((eventData) => {
    let block = world
        .getDimension('overworld')
        .getBlock(eventData.getBlockLocation());
    if (
        eventData.item.typeId == 'minecraft:potion' &&
        block.typeId == 'minecraft:stone'
    ) {
        block.setType(MinecraftBlockTypes.deepslate);

        let player: Player = eventData.source as any;

        let item: ItemStack = new ItemStack(MinecraftItemTypes.glassBottle, 1);
        let inventory_component: EntityInventoryComponent =
            eventData.source.getComponent('minecraft:inventory') as any;
        inventory_component.container.setItem(player.selectedSlot, item);
    }
});

world.events.beforePistonActivate.subscribe((eventData) => {
    let coal_location: Vector3 = Vector.add(eventData.block.location, {
        x: 0,
        y: -1,
        z: 0
    });
    let entities: Entity[] = world
        .getDimension('overworld')
        .getEntitiesAtBlockLocation(coal_location);

    let item: EntityItemComponent;

    for (let entity of entities) {
        item = entity.getComponent('minecraft:item') as any;

        if (
            item.itemStack.typeId == 'minecraft:coal' &&
            item.itemStack.amount == 64
        )
            entity.kill();
        world
            .getDimension('overworld')
            .spawnItem(
                new ItemStack(MinecraftItemTypes.diamond),
                coal_location
            );
    }
});

world.events.blockPlace.subscribe(async (eventData) => {
    if (
        eventData.block.typeId == 'minecraft:sculk_shrieker' &&
        world
            .getDimension('overworld')
            .getBlock(
                Vector.add(eventData.block.location, { x: 0, y: -1, z: 0 })
            ).typeId == 'minecraft:soul_sand'
    ) {
        eventData.block.setPermutation(
            BlockPermutation.resolve('minecraft:sculk_shrieker', {
                can_summon: true
            })
        );
    }
});

world.events.entitySpawn.subscribe((eventData) => {
    let entity = eventData.entity;
    let entity_block_loc = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y),
        z: Math.trunc(entity.location.z)
    };
    let block_at_entity: Block = entity.dimension.getBlock(entity_block_loc);

    if (entity.typeId != 'minecraft:lightning_bolt') return;

    if (
        block_at_entity.typeId != 'minecraft:lightning_rod' ||
        entity.dimension.getBlock(
            Vector.add(entity_block_loc, { x: 0, y: -1, z: 0 })
        ).typeId != 'minecraft:glowstone'
    )
        return;

    if (
        entity.dimension.getBlock(
            Vector.add(entity_block_loc, { x: 0, y: -1, z: -1 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(entity_block_loc, { x: 0, y: -1, z: -1 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:vine', {
                    multi_face_direction_bits: 4
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(entity_block_loc, { x: 1, y: -1, z: 0 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(entity_block_loc, { x: 1, y: -1, z: 0 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:vine', {
                    multi_face_direction_bits: 8
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(entity_block_loc, { x: 0, y: -1, z: 1 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(entity_block_loc, { x: 0, y: -1, z: 1 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:vine', {
                    multi_face_direction_bits: 16
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(entity_block_loc, { x: -1, y: -1, z: 0 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(entity_block_loc, { x: -1, y: -1, z: 0 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:vine', {
                    multi_face_direction_bits: 32
                })
            );
    }
});

world.events.entityHurt.subscribe((eventData) => {
    if (eventData.damageSource.damagingEntity == null) return;

    let health: EntityHealthComponent = eventData.hurtEntity.getComponent(
        'minecraft:health'
    ) as any;

    if (
        eventData.damageSource.cause != 'entityAttack' &&
        eventData.damageSource.damagingEntity.typeId == 'minecraft:warden' &&
        eventData.damage >= health.current &&
        (eventData.hurtEntity.typeId == 'minecraft:dolphin' ||
            eventData.hurtEntity.typeId == 'minecraft:bat')
    )
        world
            .getDimension('overworld')
            .spawnItem(new ItemStack(MinecraftItemTypes.echoShard), {
                x: Math.floor(eventData.hurtEntity.location.x),
                y: Math.floor(eventData.hurtEntity.location.y + 1),
                z: Math.floor(eventData.hurtEntity.location.z)
            });
});
