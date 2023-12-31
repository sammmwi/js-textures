import Button from './src/Button.js';
import { drawFromTexture, loadTextures } from './src/Texture.js';
import { globalTextures, guiScale, invertedScrollwheel, setInvertedScrollwheel, slotId, setSlotId, gameWindow, setGameWindow } from './src/Globals.js';
import Vec2d from "./src/Vec2d.js";
import GameWindow from './src/GameWindow.js';

/**
 * @type {HTMLCanvasElement | null}
 */
export const canvas = document.getElementById("main");
if (!canvas) 
    throw new Error("Could not find canvas!");

export const context = canvas.getContext("2d");
if (!context)
    throw new Error("Could not get 2d context from canvas");

async function renderHotbar() {
    const WIDGETS_TEXTURE = globalTextures.get("widgets");

    const hotbarWidth = 182 * guiScale;
    const hotbarHeight = 22 * guiScale;
    const hotbarPosition = new Vec2d((canvas.width / 2) - (hotbarWidth / 2), canvas.height - hotbarHeight).scale(guiScale);
    await drawFromTexture(WIDGETS_TEXTURE, new Vec2d(0, 0), hotbarPosition, hotbarWidth, hotbarHeight, 182, 22);

    // Hotbar Selected (slot size is 22x22 (256x256))
    const hotbarSelectorWidth = 24 * guiScale;
    const hotbarSelectorHeight = 24 * guiScale;
    const hotbarSelectorPosition = new Vec2d(hotbarPosition.x / guiScale + (slotId * Math.floor((hotbarWidth / guiScale) / 9)) - 1, canvas.height - hotbarSelectorHeight + 1).scale(guiScale);
    await drawFromTexture(WIDGETS_TEXTURE, new Vec2d(0, 22), hotbarSelectorPosition, hotbarSelectorWidth, hotbarSelectorHeight, 24, 24);
}

const buttons = [
    new Button("Singleplayer", new Vec2d(0, 0), 325, 28),
    new Button("Multiplayer", new Vec2d(0, 0), 325, 28),
    new Button("Quit", new Vec2d(0, 0), 325, 28),
]

async function render() {
    const { width, height } = canvas;

    context.fillStyle = "blue";
    context.fillRect(0, 0, width, height);

    // Hotbar
    await renderHotbar();

    for (let i = 0; i < buttons.length; ++i) {
        const button = buttons[i];
        const x = (canvas.width / 2) - (button.width / 2);
        const y = (canvas.height / 2) - (button.height / 2) - button.height;
        button.pos = new Vec2d(x, y + (i * button.height * 1.25));
        await button.render();
    }

    requestAnimationFrame(render);
}

window.addEventListener("resize", _ => {
    setGameWindow(new GameWindow(document.body.clientWidth, document.body.clientHeight, guiScale));
    canvas.width = gameWindow.getScaledWidth();
});

document.addEventListener("DOMContentLoaded", async function main() {
    const invertScrollwheelButton = document.getElementById("invertScrollwheel");
    if (!invertScrollwheelButton)
        throw new Error("Could not find the invert scrollwheel button in the DOM!");

    invertScrollwheelButton.addEventListener("click", () => setInvertedScrollwheel(!invertedScrollwheel));

    const reloadTexturesButton = document.getElementById("reloadTextures"); 
    if (!reloadTexturesButton)
        throw new Error("Could not find the reload textures button in the DOM!");

    reloadTexturesButton.addEventListener("click", loadTextures);

    window.addEventListener("keydown", (ev) => {
        ev.preventDefault();
        if (ev.repeat)
            return;
        if (ev.keyCode >= 49 && ev.keyCode <= 57)
            setSlotId(ev.keyCode - 49);
    });
    
    canvas.addEventListener("mousewheel", (ev) => {
        ev.preventDefault();
        const v = invertedScrollwheel ? -1 : 1;
        setSlotId((slotId + (ev.deltaY < 0 ? v : -v) + 9) % 9);
    });

    canvas.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        if (ev.button != 0) 
            return;
        for (let i = 0; i < buttons.length; ++i) {
            const button = buttons[i];
            if (button.disabled)
                continue;
            const { offsetX: x, offsetY: y } = ev;
            if (button.inBounds(new Vec2d(x, y)))
                button.pressed = true;
        }
    });
    
    canvas.addEventListener("mouseup", (ev) => {
        ev.preventDefault();
        if (ev.button != 0) 
            return;
        for (let i = 0; i < buttons.length; ++i) {
            const button = buttons[i];
            if (button.disabled)
                continue;
            button.pressed = false;
        }
    });

    canvas.addEventListener("mousemove", (ev) => {
        ev.preventDefault();
        const { offsetX: x, offsetY: y } = ev;
        for (let i = 0; i < buttons.length; ++i) {
            const button = buttons[i];
            if (button.disabled)
                continue;
            if (button.inBounds(new Vec2d(x, y)))
                button.hovered = true;
            else 
                button.hovered = false;
        }
    });
    
    canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

    setGameWindow(new GameWindow(document.body.clientWidth, document.body.clientHeight, guiScale));
    canvas.width = gameWindow.getWidth();

    await loadTextures()
    await render()
});