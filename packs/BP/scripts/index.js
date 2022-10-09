import { world } from "mojang-minecraft";

let currentTick = 0;

function begin() {
    currentTick++;
    if (currentTick % 200 == 0) {
        try {
            world.getDimension("overworld").runCommand("summon wither 0 128 0");
            world.events.tick.unsubscribe(begin);
        } catch (error) {
            console.error("Error is: " + error);
        }
    }
}

function test() {
    world.events.tick.subscribe(begin);
}

world.events.worldInitialize.subscribe(test);