import {
    system,
    world,
    Block,
    BlockPermutation,
    Entity,
    EntityItemComponent,
    EntityInventoryComponent,
    ItemStack,
    MinecraftBlockTypes,
    MinecraftItemTypes,
    Player,
    Vector,
    Vector3,
    MinecraftEffectTypes,
    Direction
} from '@minecraft/server';

const air_permutation: BlockPermutation =
    BlockPermutation.resolve('minecraft:air');
const grass_permutation: BlockPermutation =
    BlockPermutation.resolve('minecraft:grass');

const check: Map<Vector3, string> = new Map<Vector3, string>();
check.set({ x: 1, y: 0, z: 0 }, 'minecraft:calcite');
check.set({ x: -1, y: 0, z: 0 }, 'minecraft:calcite');
check.set({ x: 0, y: 0, z: 1 }, 'minecraft:calcite');
check.set({ x: 0, y: 0, z: -1 }, 'minecraft:calcite');
check.set({ x: 2, y: 0, z: 0 }, 'minecraft:smooth_basalt');
check.set({ x: -2, y: 0, z: 0 }, 'minecraft:smooth_basalt');
check.set({ x: 0, y: 0, z: 2 }, 'minecraft:smooth_basalt');
check.set({ x: 0, y: 0, z: -2 }, 'minecraft:smooth_basalt');

const setup_id = system.runInterval(() => {
    world.getDimension('overworld').fillBlocks(
        {
            x: world.getDefaultSpawnPosition().x - 3,
            y: 63,
            z: world.getDefaultSpawnPosition().z - 3
        },
        {
            x: world.getDefaultSpawnPosition().x + 3,
            y: 63,
            z: world.getDefaultSpawnPosition().z + 3
        },
        MinecraftBlockTypes.grass,
        {
            matchingBlock: air_permutation
        }
    );
    if (
        world.getDimension('overworld').getBlock({
            x: world.getDefaultSpawnPosition().x,
            y: 63,
            z: world.getDefaultSpawnPosition().z
        }).typeId == 'minecraft:grass'
    )
        world.getDimension('overworld').fillBlocks(
            {
                x: world.getDefaultSpawnPosition().x,
                y: 64,
                z: world.getDefaultSpawnPosition().z
            },
            {
                x: world.getDefaultSpawnPosition().x,
                y: 64,
                z: world.getDefaultSpawnPosition().z
            },
            MinecraftBlockTypes.sapling,
            {
                matchingBlock: air_permutation
            }
        );
    world.getDimension('overworld').fillBlocks(
        {
            x: world.getDefaultSpawnPosition().x - 2,
            y: 63,
            z: world.getDefaultSpawnPosition().z
        },
        {
            x: world.getDefaultSpawnPosition().x - 2,
            y: 63,
            z: world.getDefaultSpawnPosition().z
        },
        MinecraftBlockTypes.crimsonNylium,
        {
            matchingBlock: grass_permutation
        }
    );
    world.getDimension('overworld').fillBlocks(
        {
            x: world.getDefaultSpawnPosition().x + 2,
            y: 63,
            z: world.getDefaultSpawnPosition().z
        },
        {
            x: world.getDefaultSpawnPosition().x + 2,
            y: 63,
            z: world.getDefaultSpawnPosition().z
        },
        MinecraftBlockTypes.warpedNylium,
        {
            matchingBlock: grass_permutation
        }
    );
}, 20);

world.events.blockBreak.subscribe(() => {
    system.clearRun(setup_id);
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const block_looked_at: Block = player.getBlockFromViewDirection({
            maxDistance: 8
        }) as any;

        if (block_looked_at == null) return;

        if (block_looked_at.typeId == 'minecraft:coral_fan_dead') {
            const coral_color: string = block_looked_at.permutation.getProperty(
                'coral_color'
            ) as any;

            if (
                block_looked_at.isWaterlogged &&
                coral_color == 'red' &&
                (detectFlowingWater(block_looked_at, 'n') ||
                    detectFlowingWater(block_looked_at, 'e') ||
                    detectFlowingWater(block_looked_at, 's') ||
                    detectFlowingWater(block_looked_at, 'w'))
            )
                player.dimension.fillBlocks(
                    Vector.add(block_looked_at.location, { x: 0, y: 1, z: 0 }),
                    Vector.add(block_looked_at.location, { x: 0, y: 1, z: 0 }),
                    BlockPermutation.resolve('minecraft:sand', {
                        sand_type: 'red'
                    }),
                    { matchingBlock: BlockPermutation.resolve('minecraft:air') }
                );
            else if (
                block_looked_at.isWaterlogged &&
                (detectFlowingWater(block_looked_at, 'n') ||
                    detectFlowingWater(block_looked_at, 'e') ||
                    detectFlowingWater(block_looked_at, 's') ||
                    detectFlowingWater(block_looked_at, 'w'))
            )
                world
                    .getDimension('overworld')
                    .spawnItem(
                        new ItemStack(MinecraftItemTypes.sand),
                        block_looked_at.location
                    );

            if (Math.round(Math.random() * 100) % 4 == 0)
                block_looked_at.setType(MinecraftBlockTypes.air);
        }
    }
}, 20);

function detectFlowingWater(block: Block, direction: string): boolean {
    switch (direction) {
        case 'n': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: -1 }))
                .permutation.getProperty('liquid_depth') as any;
            return property != 0;
        }
        case 'e': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 1, y: 0, z: 0 }))
                .permutation.getProperty('liquid_depth') as any;
            return property != 0;
        }
        case 's': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: 1 }))
                .permutation.getProperty('liquid_depth') as any;
            return property != 0;
        }
        case 'w': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: -1, y: 0, z: 0 }))
                .permutation.getProperty('liquid_depth') as any;
            return property != 0;
        }
        default:
            return false;
    }
}

world.events.itemUseOn.subscribe((eventData) => {
    const block: Block = world
        .getDimension('overworld')
        .getBlock(eventData.getBlockLocation());

    if (
        eventData.item.typeId == 'minecraft:potion' &&
        block.typeId == 'minecraft:stone'
    ) {
        block.setType(MinecraftBlockTypes.deepslate);

        const player: Player = eventData.source as any;

        const item: ItemStack = new ItemStack(
            MinecraftItemTypes.glassBottle,
            1
        );
        const inventory_component: EntityInventoryComponent =
            eventData.source.getComponent('minecraft:inventory') as any;
        inventory_component.container.setItem(player.selectedSlot, item);
    }
});

world.events.beforePistonActivate.subscribe((eventData) => {
    if (eventData.block.typeId != 'minecraft:piston') return;

    if (eventData.block.permutation.getProperty('facing_direction') != 0)
        return;

    const coal_location: Vector3 = Vector.add(eventData.block.location, {
        x: 0,
        y: -1,
        z: 0
    });
    const entities: Entity[] = world
        .getDimension('overworld')
        .getEntitiesAtBlockLocation(coal_location);

    for (const entity of entities) {
        const item: EntityItemComponent = entity.getComponent(
            'minecraft:item'
        ) as any;

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

world.events.blockPlace.subscribe((eventData) => {
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
    const entity = eventData.entity;
    const entity_block_loc = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y),
        z: Math.trunc(entity.location.z)
    };
    const block_at_entity: Block = entity.dimension.getBlock(entity_block_loc);

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

world.events.entityDie.subscribe((eventData) => {
    const entity: Entity = eventData.deadEntity;

    if (
        entity.typeId == ('minecraft:dolphin' || 'minecraft:bat') &&
        eventData.damageSource.cause != 'entityAttack' &&
        eventData.damageSource.damagingEntity.typeId == 'minecraft:warden'
    ) {
        entity.dimension.spawnItem(
            new ItemStack(MinecraftItemTypes.echoShard),
            entity.location
        );
        return;
    }

    if (entity.typeId == 'minecraft:ender_dragon') {
        eventData.deadEntity.dimension.spawnEntity(
            'minecraft:shulker',
            entity.location
        );
        return;
    }

    if (
        entity.typeId == 'minecraft:endermite' &&
        entity.getEffect(MinecraftEffectTypes.levitation) &&
        entity.getEffect(MinecraftEffectTypes.slowFalling)
    ) {
        if (Math.round(Math.random() * 40) % 40 == 0)
            entity.dimension.spawnItem(
                new ItemStack(MinecraftItemTypes.elytra),
                entity.location
            );

        return;
    }
});

world.events.entityHurt.subscribe((eventData) => {
    const entity: Entity = eventData.hurtEntity;

    if (
        entity.typeId == 'minecraft:guardian' &&
        eventData.damageSource.cause == 'lightning'
    ) {
        entity.dimension.spawnEntity(
            'minecraft:elder_guardian',
            entity.location
        );
        entity.teleport({ x: 0, y: -100, z: 0 }, entity.dimension, 0, 0);
        entity.kill();
    }
});

world.events.itemUse.subscribe((eventData) => {
    if (
        eventData.item.typeId != 'minecraft:amethyst_block' ||
        eventData.source.typeId != 'minecraft:player'
    )
        return;

    let player: Player = eventData.source as any;

    let entities: Entity[] = eventData.source.getEntitiesFromViewDirection({
        maxDistance: 3
    });

    let inventory: EntityInventoryComponent = eventData.source.getComponent(
        'minecraft:inventory'
    ) as any;

    entities.forEach((entity) => {
        if (entity.typeId != 'minecraft:vex') return;

        entity.dimension.spawnEntity('minecraft:allay', entity.location);
        entity.teleport({ x: 0, y: -100, z: 0 }, entity.dimension, 0, 0);
        entity.kill();

        if (eventData.item.amount == 1) {
            inventory.container.clearItem(player.selectedSlot);
            return;
        }

        inventory.container.setItem(
            player.selectedSlot,
            new ItemStack('minecraft:amethyst_block', eventData.item.amount - 1)
        );
    });
});

world.events.itemUseOn.subscribe((eventData) => {
    if (eventData.item.typeId != 'minecraft:lava_bucket') return;

    var status_check: boolean = true;
    var offset: Vector3;

    switch (eventData.blockFace) {
        case Direction.down:
            offset = { x: 0, y: -1, z: 0 };
            break;
        case Direction.east:
            offset = { x: 1, y: 0, z: 0 };
            break;
        case Direction.north:
            offset = { x: 0, y: 0, z: -1 };
            break;
        case Direction.south:
            offset = { x: 0, y: 0, z: 1 };
            break;
        case Direction.up:
            offset = { x: 0, y: 1, z: 0 };
            break;
        case Direction.west:
            offset = { x: -1, y: 0, z: 0 };
            break;
        default:
            break;
    }

    const original_block: Block = eventData.source.dimension.getBlock(
        Vector.add(eventData.getBlockLocation(), offset)
    );

    check.forEach((entry, location) => {
        if (
            eventData.source.dimension.getBlock(
                Vector.add(original_block.location, location)
            ).typeId != entry
        ) {
            status_check = false;
            return;
        }
    });

    if (status_check)
        system.runTimeout(() => {
            if (
                eventData.source.dimension.getBlock(
                    Vector.add(eventData.getBlockLocation(), offset)
                ).typeId != 'minecraft:lava'
            )
                return;
            original_block.setType(MinecraftBlockTypes.buddingAmethyst);
        }, 1200);
});
