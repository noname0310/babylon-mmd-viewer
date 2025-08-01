import type { Scene } from "@babylonjs/core/scene";
import { BvmdLoader } from "babylon-mmd/esm/Loader/Optimized/bvmdLoader";
import { VmdLoader } from "babylon-mmd/esm/Loader/vmdLoader";
import { VpdLoader } from "babylon-mmd/esm/Loader/vpdLoader";
import type { MmdCamera } from "babylon-mmd/esm/Runtime/mmdCamera";
import { MmdWasmAnimation } from "babylon-mmd/esm/Runtime/Optimized/Animation/mmdWasmAnimation";
import type { IMmdWasmInstance } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance";
import type { MmdWasmModel } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmModel";

export class CachedMotionLoader {
    private readonly _scene: Scene;
    private readonly _wasmInstance: IMmdWasmInstance;
    private readonly _vmdLoader: VmdLoader;
    private readonly _bvmdLoader: BvmdLoader;
    private readonly _vpdLoader: VpdLoader;
    private readonly _cache: [File | File[], MmdWasmAnimation][] = [];

    public constructor(scene: Scene, wasmInstance: IMmdWasmInstance) {
        this._scene = scene;
        this._wasmInstance = wasmInstance;
        const vmdLoader = this._vmdLoader = new VmdLoader(scene);
        const bvmdLoader = this._bvmdLoader = new BvmdLoader(scene);
        const vpdLoader = this._vpdLoader = new VpdLoader(scene);

        vmdLoader.loggingEnabled = true;
        bvmdLoader.loggingEnabled = true;
        vpdLoader.loggingEnabled = true;
    }

    public get cache(): readonly [File | File[], MmdWasmAnimation][] {
        return this._cache;
    }

    public async loadVmd(animationName: string, file: File | File[]): Promise<MmdWasmAnimation> {
        for (const [cachedFile, animation] of this._cache) {
            let match = true;
            if (Array.isArray(cachedFile)) {
                if (Array.isArray(file)) {
                    for (let i = 0; i < cachedFile.length; i++) {
                        if (cachedFile[i] !== file[i]) {
                            match = false;
                            break;
                        }
                    }
                } else {
                    match = false;
                }
            } else {
                match = cachedFile === file;
            }

            if (match) return animation;
        }

        const engine = this._scene.getEngine();
        engine.displayLoadingUI();
        const mergedAnimationName = file instanceof File ? file.name : file.map(file => file.name).join(", ");
        const animation = await this._vmdLoader.loadAsync(
            animationName,
            file,
            (event) => {
                if (event.lengthComputable) {
                    engine.loadingUIText = `<br/><br/>Loading ${mergedAnimationName}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`;
                } else {
                    engine.loadingUIText = `<br/><br/>Loading ${mergedAnimationName}... ${event.loaded}`;
                }
            }
        );
        const wasmAnimation = new MmdWasmAnimation(animation, this._wasmInstance, this._scene);
        engine.hideLoadingUI();
        this._cache.push([file, wasmAnimation]);
        return wasmAnimation;
    }

    public async loadBvmd(animationName: string, file: File): Promise<MmdWasmAnimation> {
        for (const [cachedFile, animation] of this._cache) {
            if (cachedFile === file) return animation;
        }

        const engine = this._scene.getEngine();
        engine.displayLoadingUI();
        const animation = await this._bvmdLoader.loadAsync(
            animationName,
            file,
            (event) => {
                if (event.lengthComputable) {
                    engine.loadingUIText = `Loading ${file.name}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`;
                } else {
                    engine.loadingUIText = `Loading ${file.name}... ${event.loaded}`;
                }
            }
        );
        const wasmAnimation = new MmdWasmAnimation(animation, this._wasmInstance, this._scene);
        engine.hideLoadingUI();
        this._cache.push([file, wasmAnimation]);
        return wasmAnimation;

    }

    public async loadVpd(animationName: string, file: File): Promise<MmdWasmAnimation> {
        for (const [cachedFile, animation] of this._cache) {
            if (cachedFile === file) return animation;
        }

        const engine = this._scene.getEngine();
        engine.displayLoadingUI();
        const animation = await this._vpdLoader.loadAsync(
            animationName,
            file,
            (event) => {
                if (event.lengthComputable) {
                    engine.loadingUIText = `Loading ${file.name}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`;
                } else {
                    engine.loadingUIText = `Loading ${file.name}... ${event.loaded}`;
                }
            }
        );
        const wasmAnimation = new MmdWasmAnimation(animation, this._wasmInstance, this._scene);
        engine.hideLoadingUI();
        this._cache.push([file, wasmAnimation]);
        return wasmAnimation;
    }

    public flushCache(cameraRoot: MmdCamera, roots: readonly MmdWasmModel[]): void {
        const deleteList: [File | File[], MmdWasmAnimation][] = [];

        for (const item of this._cache) {
            let used = false;

            for (const runtimeAnimation of cameraRoot.runtimeAnimations.values()) {
                if (runtimeAnimation.animation === item[1].cameraTrack) {
                    used = true;
                    break;
                }
            }

            for (const root of roots) {
                for (const runtimeAnimation of root.runtimeAnimations.values()) {
                    if (runtimeAnimation.animation === item[1]) {
                        used = true;
                        break;
                    }
                }
            }

            if (!used) deleteList.push(item);
        }

        for (const item of deleteList) {
            item[1].dispose();
            const index = this._cache.indexOf(item);
            if (index !== -1) this._cache.splice(index, 1);
        }
    }
}
