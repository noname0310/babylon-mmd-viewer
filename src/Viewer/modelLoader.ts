import "babylon-mmd/esm/Loader/pmxLoader";
import "babylon-mmd/esm/Loader/pmdLoader";
import "babylon-mmd/esm/Loader/Optimized/bpmxLoader";

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Material } from "@babylonjs/core/Materials/material";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Scene } from "@babylonjs/core/scene";
import type { MmdStandardMaterial } from "babylon-mmd/esm/Loader/mmdStandardMaterial";
import { MmdStandardMaterialBuilder } from "babylon-mmd/esm/Loader/mmdStandardMaterialBuilder";
import type { MmdMesh, RuntimeMmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";

export class ModelLoader {
    private readonly _engine: AbstractEngine;
    private readonly _scene: Scene;
    private readonly _materialBuilder: MmdStandardMaterialBuilder;

    public constructor(scene: Scene) {
        this._engine = scene.getEngine();
        this._scene = scene;

        const materialBuilder = new MmdStandardMaterialBuilder();
        materialBuilder.loadOutlineRenderingProperties = (): void => { /* do nothing */ };
        materialBuilder.afterBuildSingleMaterial = (material: MmdStandardMaterial): void => {
            material.forceDepthWrite = true;
            material.useAlphaFromDiffuseTexture = true;
            if (material.diffuseTexture !== null) material.diffuseTexture.hasAlpha = true;

            if (material.transparencyMode === Material.MATERIAL_ALPHABLEND) {
                material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
                material.alphaCutOff = 0.01;
            }
        };
        this._materialBuilder = materialBuilder;
    }

    public async loadModel(loadFile: File, referenceFiles: File[]): Promise<MmdMesh> {

        const engine = this._engine;
        engine.displayLoadingUI();
        const mmdMesh = await LoadAssetContainerAsync(
            loadFile,
            this._scene,
            {
                onProgress: event => {
                    if (event.lengthComputable) {
                        engine.loadingUIText = `<br/><br/>Loading ${loadFile.name}... ${event.loaded}/${event.total} (${Math.floor(event.loaded * 100 / event.total)}%)`;
                    } else {
                        engine.loadingUIText = `<br/><br/>Loading ${loadFile.name}... ${event.loaded}`;
                    }
                },
                rootUrl: loadFile.webkitRelativePath.substring(0, loadFile.webkitRelativePath.lastIndexOf("/") + 1),
                pluginOptions: {
                    mmdmodel: {
                        materialBuilder: this._materialBuilder,
                        buildSkeleton: true,
                        buildMorph: true,
                        loggingEnabled: true,
                        referenceFiles
                    }
                }
            }
        ).then(result => {
            result.addAllToScene();
            const mmdMesh = result.meshes[0] as MmdMesh;
            return mmdMesh;
        });
        for (const mesh of mmdMesh.metadata.meshes) mesh.alwaysSelectAsActiveMesh = true;

        engine.hideLoadingUI();

        return mmdMesh;
    }

    public disposeModel(mmdMesh: RuntimeMmdMesh | MmdMesh): void {
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

        metadata.skeleton?.dispose();
        mmdMesh.dispose(false, false);
        mmdMesh.metadata = null!;
    }
}
