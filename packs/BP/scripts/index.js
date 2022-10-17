import { world } from "@minecraft/server";

let currentTick = 0;
let hasRan = false;

world.events.tick.subscribe(async () => {
    currentTick++;
    if (!hasRan && (currentTick % 20 == 0)) {
        await world.getDimension("overworld").runCommandAsync("fill -3 63 -3 3 63 3 grass 0 replace air");
        await world.getDimension("overworld").runCommandAsync("setworldspawn 0 64 0");
        await world.getDimension("overworld").runCommandAsync("setblock 0 64 0 sapling");
        hasRan = true;
    }
});