import { Engine } from "@babylonjs/core/Engines/engine";

import { BaseRuntime } from "./baseRuntime";
import { SceneBuilder } from "./Viewer/viewerScene";

await new Promise<void>(resolve => window.onload = (): void => resolve());

const canvas = document.createElement("canvas");
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";
document.body.appendChild(canvas);

const engine = new Engine(canvas, false, {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    doNotHandleContextLost: true,
    doNotHandleTouchAction: true,
    audioEngine: false
}, true);

await BaseRuntime.Create({
    canvas,
    engine,
    sceneBuilder: new SceneBuilder()
}).then(runtime => runtime.run());
