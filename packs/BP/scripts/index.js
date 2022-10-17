import { Location, world } from "@minecraft/server";

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

world.events.tick.subscribe(escapeVoid);