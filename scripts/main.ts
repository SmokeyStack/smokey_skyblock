import {
    system,
    world,
    Block,
    BlockPermutation,
    Entity,
    EntityItemComponent,
    EntityInventoryComponent,
    ItemStack,
    Player,
    Vector,
    Vector3,
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
            x: world.getDefaultSpawnLocation().x - 3,
            y: 63,
            z: world.getDefaultSpawnLocation().z - 3
        },
        {
            x: world.getDefaultSpawnLocation().x + 3,
            y: 63,
            z: world.getDefaultSpawnLocation().z + 3
        },
        'minecraft:grass',
        {
            matchingBlock: air_permutation
        }
    );
    if (
        world.getDimension('overworld').getBlock({
            x: world.getDefaultSpawnLocation().x,
            y: 63,
            z: world.getDefaultSpawnLocation().z
        }).typeId == 'minecraft:grass'
    )
        world.getDimension('overworld').fillBlocks(
            {
                x: world.getDefaultSpawnLocation().x,
                y: 64,
                z: world.getDefaultSpawnLocation().z
            },
            {
                x: world.getDefaultSpawnLocation().x,
                y: 64,
                z: world.getDefaultSpawnLocation().z
            },
            'minecraft:sapling',
            {
                matchingBlock: air_permutation
            }
        );
    world.getDimension('overworld').fillBlocks(
        {
            x: world.getDefaultSpawnLocation().x - 2,
            y: 63,
            z: world.getDefaultSpawnLocation().z
        },
        {
            x: world.getDefaultSpawnLocation().x - 2,
            y: 63,
            z: world.getDefaultSpawnLocation().z
        },
        'minecraft:crimson_nylium',
        {
            matchingBlock: grass_permutation
        }
    );
    world.getDimension('overworld').fillBlocks(
        {
            x: world.getDefaultSpawnLocation().x + 2,
            y: 63,
            z: world.getDefaultSpawnLocation().z
        },
        {
            x: world.getDefaultSpawnLocation().x + 2,
            y: 63,
            z: world.getDefaultSpawnLocation().z
        },
        'minecraft:warped_nylium',
        {
            matchingBlock: grass_permutation
        }
    );
}, 20);

world.beforeEvents.playerBreakBlock.subscribe(() => {
    system.clearRun(setup_id);
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const block_looked_at: Block = player.getBlockFromViewDirection({
            maxDistance: 8
        }).block;

        if (block_looked_at == null) return;

        if (block_looked_at.typeId == 'minecraft:coral_fan_dead') {
            const coral_color: string = block_looked_at.permutation.getState(
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
                        new ItemStack('minecraft:sand'),
                        block_looked_at.location
                    );

            if (Math.round(Math.random() * 100) % 4 == 0)
                block_looked_at.setType('minecraft:air');
        }
    }
}, 100);

function detectFlowingWater(block: Block, direction: string): boolean {
    switch (direction) {
        case 'n': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: -1 }))
                .permutation.getState('liquid_depth') as any;
            return property != 0;
        }
        case 'e': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 1, y: 0, z: 0 }))
                .permutation.getState('liquid_depth') as any;
            return property != 0;
        }
        case 's': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: 0, y: 0, z: 1 }))
                .permutation.getState('liquid_depth') as any;
            return property != 0;
        }
        case 'w': {
            const property: number = world
                .getDimension('overworld')
                .getBlock(Vector.add(block.location, { x: -1, y: 0, z: 0 }))
                .permutation.getState('liquid_depth') as any;
            return property != 0;
        }
        default:
            return false;
    }
}

world.afterEvents.playerInteractWithBlock.subscribe((eventData) => {
    const block: Block = eventData.block;

    if (
        eventData.itemStack.typeId == 'minecraft:potion' &&
        block.typeId == 'minecraft:stone'
    ) {
        block.setType('minecraft:deepslate');

        const player: Player = eventData.player;

        const item: ItemStack = new ItemStack('minecraft:glass_bottle', 1);
        const inventory_component: EntityInventoryComponent =
            eventData.player.getComponent('minecraft:inventory') as any;
        inventory_component.container.setItem(player.selectedSlot, item);
    }
});

world.afterEvents.pistonActivate.subscribe((eventData) => {
    if (eventData.block.typeId != 'minecraft:piston') return;

    if (eventData.block.permutation.getState('facing_direction') != 0) return;

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
            .spawnItem(new ItemStack('minecraft:diamond'), coal_location);
    }
});

world.afterEvents.playerPlaceBlock.subscribe((eventData) => {
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

world.afterEvents.entitySpawn.subscribe((eventData) => {
    const entity = eventData.entity;
    const entity_block_loc = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y),
        z: Math.trunc(entity.location.z)
    };

    if (entity.typeId != 'minecraft:lightning_bolt') return;

    let is_glowstone: boolean = false;
    let glowstone_location: Vector3;
    // let vine_permutation: BlockPermutation = BlockPermutation.resolve('minecrfat:vine',

    for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
            for (let z = -1; z < 2; z++) {
                if (
                    entity.dimension.getBlock(
                        Vector.add(entity_block_loc, { x, y, z })
                    ).typeId == 'minecraft:glowstone'
                ) {
                    is_glowstone = true;
                    glowstone_location = Vector.add(entity_block_loc, {
                        x,
                        y,
                        z
                    });
                }
            }
        }
    }

    if (!is_glowstone) return;

    if (
        entity.dimension.getBlock(
            Vector.add(glowstone_location, { x: 0, y: -1, z: -1 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(glowstone_location, { x: 0, y: -1, z: -1 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:glow_lichen', {
                    multi_face_direction_bits: 4
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(glowstone_location, { x: 1, y: -1, z: 0 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(glowstone_location, { x: 1, y: -1, z: 0 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:glow_lichen', {
                    multi_face_direction_bits: 8
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(glowstone_location, { x: 0, y: -1, z: 1 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(glowstone_location, { x: 0, y: -1, z: 1 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:glow_lichen', {
                    multi_face_direction_bits: 16
                })
            );
    }
    if (
        entity.dimension.getBlock(
            Vector.add(glowstone_location, { x: -1, y: -1, z: 0 })
        ).typeId == 'minecraft:vine'
    ) {
        entity.dimension
            .getBlock(Vector.add(glowstone_location, { x: -1, y: -1, z: 0 }))
            .setPermutation(
                BlockPermutation.resolve('minecraft:glow_lichen', {
                    multi_face_direction_bits: 32
                })
            );
    }
});

world.afterEvents.entityDie.subscribe((eventData) => {
    const entity: Entity = eventData.deadEntity;

    if (
        entity.typeId == ('minecraft:dolphin' || 'minecraft:bat') &&
        eventData.damageSource.cause != 'entityAttack' &&
        eventData.damageSource.damagingEntity.typeId == 'minecraft:warden'
    ) {
        entity.dimension.spawnItem(
            new ItemStack('minecraft:echo_shard'),
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
        entity.getEffect('levitation') &&
        entity.getEffect('slow_falling')
    ) {
        if (Math.round(Math.random() * 40) % 40 == 0)
            entity.dimension.spawnItem(
                new ItemStack('minecraft:elytra'),
                entity.location
            );

        return;
    }
});

world.afterEvents.entityHurt.subscribe((eventData) => {
    const entity: Entity = eventData.hurtEntity;

    if (
        entity.typeId == 'minecraft:guardian' &&
        eventData.damageSource.cause == 'lightning'
    ) {
        entity.dimension.spawnEntity(
            'minecraft:elder_guardian',
            entity.location
        );
        entity.remove();
    }
});

world.beforeEvents.itemUse.subscribe((eventData) => {
    if (
        eventData.itemStack.typeId != 'minecraft:amethyst_block' ||
        eventData.source.typeId != 'minecraft:player'
    )
        return;

    let player: Player = eventData.source as any;

    let entities: Entity[] = eventData.source.getEntitiesFromViewDirection({
        maxDistance: 3
    }) as any;

    let inventory: EntityInventoryComponent = eventData.source.getComponent(
        'minecraft:inventory'
    ) as any;

    entities.forEach((entity) => {
        if (entity.typeId != 'minecraft:vex') return;

        entity.dimension.spawnEntity('minecraft:allay', entity.location);
        entity.remove();

        if (eventData.itemStack.amount == 1) {
            inventory.container.getSlot(player.selectedSlot).amount = 0;
            return;
        }

        inventory.container.setItem(
            player.selectedSlot,
            new ItemStack(
                'minecraft:amethyst_block',
                eventData.itemStack.amount - 1
            )
        );
    });
});

world.beforeEvents.itemUseOn.subscribe((eventData) => {
    if (eventData.itemStack.typeId != 'minecraft:lava_bucket') return;

    var status_check: boolean = true;
    var offset: Vector3;

    switch (eventData.blockFace) {
        case Direction.Down:
            offset = { x: 0, y: -1, z: 0 };
            break;
        case Direction.East:
            offset = { x: 1, y: 0, z: 0 };
            break;
        case Direction.North:
            offset = { x: 0, y: 0, z: -1 };
            break;
        case Direction.South:
            offset = { x: 0, y: 0, z: 1 };
            break;
        case Direction.Up:
            offset = { x: 0, y: 1, z: 0 };
            break;
        case Direction.West:
            offset = { x: -1, y: 0, z: 0 };
            break;
        default:
            break;
    }

    const original_block: Block = eventData.source.dimension.getBlock(
        Vector.add(eventData.block.location, offset)
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
                    Vector.add(eventData.block.location, offset)
                ).typeId != 'minecraft:lava'
            )
                return;
            original_block.setType('minecraft:budding_amethyst');
        }, 1200);
});

world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
    if (eventData.block.type.id != 'minecraft:flowering_azalea') return;
    if (Math.random() * 100 < 5)
        eventData.dimension.spawnItem(
            new ItemStack('minecraft:spore_blossom'),
            eventData.block.location
        );
});
