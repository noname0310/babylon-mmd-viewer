import "babylon-mmd/esm/Loader/pmxLoader";
import "babylon-mmd/esm/Loader/pmdLoader";
import "babylon-mmd/esm/Loader/Optimized/bpmxLoader";

import type { Engine } from "@babylonjs/core/Engines/engine";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Scene } from "@babylonjs/core/scene";
import type { MmdModelLoader } from "babylon-mmd/esm/Loader/mmdModelLoader";
import type { MmdStandardMaterial } from "babylon-mmd/esm/Loader/mmdStandardMaterial";
import { MmdStandardMaterialBuilder } from "babylon-mmd/esm/Loader/mmdStandardMaterialBuilder";
import { PmxObject } from "babylon-mmd/esm/Loader/Parser/pmxObject";
import type { PmLoader } from "babylon-mmd/esm/Loader/pmLoader";
import type { MmdMesh, RuntimeMmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";

export class ModelLoader {
    private readonly _engine: Engine;
    private readonly _scene: Scene;
    private readonly _loaders: MmdModelLoader<any, any, any>[];
    private readonly _backfaceCullingInfoMap: WeakMap<MmdMesh, boolean[]>;

    private readonly _initialBackfaceCullingInfoBuffer: boolean[];

    public constructor(scene: Scene) {
        this._engine = scene.getEngine();
        this._scene = scene;

        const materialBuilder = new MmdStandardMaterialBuilder();
        materialBuilder.useAlphaEvaluation = true;
        materialBuilder.loadOutlineRenderingProperties = (): void => { /* do nothing */ };

        const initalBackfaceCullingInfo = this._initialBackfaceCullingInfoBuffer = new Array(1000).fill(true);
        materialBuilder.afterBuildSingleMaterial = (
            _material,
            materialIndex,
            materialInfo
        ): void => {
            initalBackfaceCullingInfo[materialIndex] = (materialInfo.flag & PmxObject.Material.Flag.IsDoubleSided) === 0;
        };

        const loaders = this._loaders = [".pmx", ".pmd", ".bpmx"].map((ext) => SceneLoader.GetPluginForExtension(ext)) as MmdModelLoader<any, any, any>[];
        for (const loader of loaders) {
            loader.loggingEnabled = true;
            loader.materialBuilder = materialBuilder;
        }

        this._backfaceCullingInfoMap = new WeakMap();
    }

    public async loadModel(loadFile: File, referenceFiles: File[]): Promise<MmdMesh> {
        const extesnion = loadFile.name.substring(loadFile.name.lastIndexOf("."));
        const loader = this._loaders.find(loader => Object.keys(loader.extensions).includes(extesnion));
        if (loader === undefined) {
            throw new Error(`Cannot find loader for extension: ${extesnion}`);
        }

        if ((loader as PmLoader).referenceFiles !== undefined) {
            (loader as PmLoader).referenceFiles = referenceFiles;
        }

        const engine = this._engine;
        engine.displayLoadingUI();
        const mmdMesh = await SceneLoader.ImportMeshAsync(
            undefined,
            loadFile.webkitRelativePath.substring(0, loadFile.webkitRelativePath.lastIndexOf("/") + 1),
            loadFile,
            this._scene,
            event => {
                if (event.lengthComputable) {
                    engine.loadingUIText = `<br/><br/>Loading ${loadFile.name}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`;
                } else {
                    engine.loadingUIText = `<br/><br/>Loading ${loadFile.name}... ${event.loaded}`;
                }
            }
        ).then(result => result.meshes[0] as MmdMesh);
        this._backfaceCullingInfoMap.set(mmdMesh, this._initialBackfaceCullingInfoBuffer.slice(0, mmdMesh.metadata.materials.length));
        for (const mesh of mmdMesh.metadata.meshes) mesh.alwaysSelectAsActiveMesh = true;
        engine.hideLoadingUI();

        if ((loader as PmLoader).referenceFiles !== undefined) {
            (loader as PmLoader).referenceFiles = [];
        }

        return mmdMesh;
    }

    public disposeModel(mmdMesh: RuntimeMmdMesh): void {
        const metadata = mmdMesh.metadata;
        const materials = metadata.materials as MmdStandardMaterial[];

        const texturesReferenceCounts: Map<BaseTexture, number> = new Map();
        {
            const sceneMaterials = this._scene.materials;
            for (let i = 0; i < sceneMaterials.length; i++) {
                const material = sceneMaterials[i] as unknown as Partial<MmdStandardMaterial>;
                if (material.diffuseTexture) texturesReferenceCounts.set(material.diffuseTexture, (texturesReferenceCounts.get(material.diffuseTexture) ?? 0) + 1);
                if (material.sphereTexture) texturesReferenceCounts.set(material.sphereTexture, (texturesReferenceCounts.get(material.sphereTexture) ?? 0) + 1);
                if (material.toonTexture) texturesReferenceCounts.set(material.toonTexture, (texturesReferenceCounts.get(material.toonTexture) ?? 0) + 1);
            }
        }

        for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            if (material.diffuseTexture !== null) texturesReferenceCounts.set(material.diffuseTexture, (texturesReferenceCounts.get(material.diffuseTexture) ?? 0) - 1);
            if (material.sphereTexture !== null) texturesReferenceCounts.set(material.sphereTexture, (texturesReferenceCounts.get(material.sphereTexture) ?? 0) - 1);
            if (material.toonTexture !== null) texturesReferenceCounts.set(material.toonTexture, (texturesReferenceCounts.get(material.toonTexture) ?? 0) - 1);
        }

        for (const [texture, referenceCount] of texturesReferenceCounts) {
            if (referenceCount === 0) texture.dispose();
        }

        for (let i = 0; i < materials.length; i++) {
            materials[i]?.dispose(true, false);
        }

        metadata.skeleton.dispose();
        mmdMesh.dispose(false, false);
        mmdMesh.metadata = metadata;
    }

    public getBackfaceCullingInfo(mmdMesh: MmdMesh): boolean[] {
        return this._backfaceCullingInfoMap.get(mmdMesh) ?? [];
    }
}
