import "@babylonjs/core/Misc/dumpTools.js";

import { EngineFunctionContext } from "@babylonjs/core/Engines/abstractEngine.functions";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.pure";
import { RegisterAbstractEngineLoadingScreen } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.loadingScreen.pure";
import { RegisterAbstractEngineStates } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.states.pure";
import { RegisterAbstractEngineStencil } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.stencil.pure";
import { RegisterAbstractEngineTexture } from "@babylonjs/core/Engines/AbstractEngine/abstractEngine.texture.pure";
import { Engine } from "@babylonjs/core/Engines/engine.pure";
import { RegisterEnginesExtensionsEngineAlpha } from "@babylonjs/core/Engines/Extensions/engine.alpha.pure";
import { RegisterEnginesExtensionsEngineRawTexture } from "@babylonjs/core/Engines/Extensions/engine.rawTexture.pure";
import { RegisterEnginesExtensionsEngineReadTexture } from "@babylonjs/core/Engines/Extensions/engine.readTexture.pure";
import { RegisterEnginesExtensionsEngineRenderTarget } from "@babylonjs/core/Engines/Extensions/engine.renderTarget.pure";
import { RegisterEnginesExtensionsEngineRenderTargetTexture } from "@babylonjs/core/Engines/Extensions/engine.renderTargetTexture.pure";
import { RegisterEngineUniformBuffer } from "@babylonjs/core/Engines/Extensions/engine.uniformBuffer.pure";
import { _GetCompatibleTextureLoader } from "@babylonjs/core/Materials/Textures/Loaders/textureLoaderManager";
import { LoadFile, LoadImage } from "@babylonjs/core/Misc/fileTools.pure";

import { BaseRuntime } from "./baseRuntime";
import { SceneBuilder } from "./Viewer/viewerScene";

await new Promise<void>(resolve => window.onload = (): void => resolve());

const canvas = document.createElement("canvas");
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";
document.body.appendChild(canvas);

RegisterAbstractEngineLoadingScreen();
RegisterAbstractEngineStates();
RegisterAbstractEngineStencil();
RegisterAbstractEngineTexture();
RegisterEnginesExtensionsEngineAlpha();
RegisterEnginesExtensionsEngineRawTexture();
RegisterEnginesExtensionsEngineReadTexture();
RegisterEnginesExtensionsEngineRenderTarget();
RegisterEnginesExtensionsEngineRenderTargetTexture();
RegisterEngineUniformBuffer();
AbstractEngine.GetCompatibleTextureLoader = _GetCompatibleTextureLoader; // core/Engines/AbstractEngine/abstractEngine.textureLoaders.ts

// core/Misc/fileTools.pure.ts
// instead of using RegisterFileTools() to register the functions, we directly assign them to EngineFunctionContext
EngineFunctionContext.loadFile = LoadFile;
EngineFunctionContext.loadImage = LoadImage;

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
