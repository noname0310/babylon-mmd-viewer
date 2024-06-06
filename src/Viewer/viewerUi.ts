import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Material } from "@babylonjs/core/Materials";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import type { StreamAudioPlayer } from "babylon-mmd/esm/Runtime/Audio/streamAudioPlayer";
import type { IMmdMaterialProxyConstructor } from "babylon-mmd/esm/Runtime/IMmdMaterialProxy";
import type { MmdCamera } from "babylon-mmd/esm/Runtime/mmdCamera";
import { MmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";
import type { MmdWasmAnimation } from "babylon-mmd/esm/Runtime/Optimized/Animation/mmdWasmAnimation";
import type { MmdWasmModel } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmModel";
import type { MmdWasmRuntime } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmRuntime";

import { AlphaTestMaterialProxy } from "@/Util/alphaTestMaterialProxy";

import type { CachedMotionLoader } from "./cachedMotionLoader";
import { FileDropControlBuilder } from "./fileDropControlBuilder";
import { FixMaterialTab } from "./fixMaterialTab";
import { ImportDialog } from "./importDialog";
import { InspectorControlBuilder } from "./inspectorControlBuilder";
import type { ModelLoader } from "./modelLoader";
import { ObjectListControl } from "./objectListControl";

export class ViewerUi {
    private readonly _mmdRuntime: MmdWasmRuntime;
    private readonly _audioPlayer: StreamAudioPlayer;
    private readonly _cameraRoot: TransformNode;
    private readonly _mmdCamera: MmdCamera;
    private readonly _modelLoader: ModelLoader;
    private readonly _motionLoader: CachedMotionLoader;
    private readonly _shadowGenerator: ShadowGenerator;

    private _audioFileName: string;
    private _cameraAnimationName: Nullable<string>;

    private readonly _importDialog: ImportDialog;
    private readonly _objectListControl: ObjectListControl<MmdWasmModel | MmdCamera | MmdMesh | Mesh>;
    private readonly _inspectorDiv: HTMLDivElement;
    private readonly _controlBuilder: InspectorControlBuilder;

    public constructor(
        scene: Scene,
        mmdRuntime: MmdWasmRuntime,
        audioPlayer: StreamAudioPlayer,
        cameraRoot: TransformNode,
        mmdCamera: MmdCamera,
        modelLoader: ModelLoader,
        motionLoader: CachedMotionLoader,
        shadowGenerator: ShadowGenerator,
        staticMeshes: readonly Mesh[]
    ) {
        this._mmdRuntime = mmdRuntime;
        this._audioPlayer = audioPlayer;
        this._cameraRoot = cameraRoot;
        this._mmdCamera = mmdCamera;
        this._modelLoader = modelLoader;
        this._motionLoader = motionLoader;
        this._shadowGenerator = shadowGenerator;

        this._audioFileName = "none";
        this._cameraAnimationName = null;

        const engine = scene.getEngine();
        const parentControl = engine.getInputElement()!.parentElement!;
        const ownerDocument = parentControl.ownerDocument;

        const newCanvasContainer = ownerDocument.createElement("div");
        {
            newCanvasContainer.style.display = parentControl.style.display;

            while (parentControl.childElementCount > 0) {
                const child = parentControl.childNodes[0];
                parentControl.removeChild(child);
                newCanvasContainer.appendChild(child);
            }

            parentControl.appendChild(newCanvasContainer);

            newCanvasContainer.style.width = "100%";
            newCanvasContainer.style.height = "100%";
            newCanvasContainer.style.overflow = "hidden";
        }

        const importDialog = this._importDialog = new ImportDialog(ownerDocument);
        newCanvasContainer.appendChild(importDialog.root);

        const fixMaterialTab = new FixMaterialTab(ownerDocument);
        newCanvasContainer.appendChild(fixMaterialTab.root);

        const uiContainerRoot = ownerDocument.createElement("div");
        uiContainerRoot.style.position = "absolute";
        uiContainerRoot.style.top = "0";
        uiContainerRoot.style.left = "0";
        uiContainerRoot.style.width = "100%";
        uiContainerRoot.style.height = "100%";
        uiContainerRoot.style.overflow = "hidden";
        uiContainerRoot.style.pointerEvents = "none";
        newCanvasContainer.appendChild(uiContainerRoot);

        scene.onDisposeObservable.addOnce(() => {
            newCanvasContainer.removeChild(importDialog.root);
            newCanvasContainer.removeChild(fixMaterialTab.root);
            newCanvasContainer.removeChild(uiContainerRoot);

            while (newCanvasContainer.childElementCount > 0) {
                const child = newCanvasContainer.childNodes[0];
                newCanvasContainer.removeChild(child);
                parentControl.appendChild(child);
            }

            parentControl.removeChild(newCanvasContainer);
        });

        this._controlBuilder = new InspectorControlBuilder(ownerDocument);

        const uiContainer = ownerDocument.createElement("div");
        uiContainer.style.position = "absolute";
        uiContainer.style.top = "0";
        uiContainer.style.right = "0";
        uiContainer.style.fontFamily = "sans-serif";
        uiContainer.style.color = "white";
        uiContainer.style.transition = "right 0.5s";
        uiContainer.style.pointerEvents = "auto";
        uiContainerRoot.appendChild(uiContainer);

        const uiInnerContainer = ownerDocument.createElement("div");
        uiInnerContainer.style.width = "300px";
        uiInnerContainer.style.height = "calc(100vh - 200px)";
        uiInnerContainer.style.display = "flex";
        uiInnerContainer.style.flexDirection = "column";
        uiInnerContainer.style.justifyContent = "space-between";
        uiInnerContainer.style.alignItems = "center";
        uiInnerContainer.style.backgroundColor = "rgb(34, 34, 34)";
        uiInnerContainer.style.padding = "5px";
        uiInnerContainer.style.boxSizing = "border-box";
        uiContainer.appendChild(uiInnerContainer);

        const uiToggle = ownerDocument.createElement("button");
        uiToggle.style.width = "20px";
        uiToggle.style.height = "20px";
        uiToggle.style.position = "absolute";
        uiToggle.style.top = "0";
        uiToggle.style.right = "300px";
        uiToggle.style.backgroundColor = "rgb(34, 34, 34)";
        uiToggle.style.textAlign = "center";
        uiToggle.style.border = "none";
        uiToggle.style.color = "white";
        uiToggle.textContent = ">";
        uiContainer.appendChild(uiToggle);
        let uiToggleFadeOutTimeout: Nullable<number> = null;
        uiToggle.style.transition = "opacity 0.5s";
        const uiToggleFadeOut = (): void => {
            uiToggle.style.opacity = "1";

            if (uiToggleFadeOutTimeout !== null) {
                window.clearTimeout(uiToggleFadeOutTimeout);
                uiToggleFadeOutTimeout = null;
            }

            uiToggleFadeOutTimeout = window.setTimeout(() => {
                uiToggleFadeOutTimeout = null;
                uiToggle.style.opacity = "0";
            }, 2000);
        };
        uiToggle.ontouchmove = (): void => {
            if (uiContainer.style.right !== "0px") uiToggleFadeOut();
        };
        uiToggle.onmousemove = (): void => {
            if (uiContainer.style.right !== "0px") uiToggleFadeOut();
        };
        uiToggle.onmousemove(new MouseEvent("mousemove"));
        uiToggle.onclick = (): void => {
            if (uiContainer.style.right === "0px") {
                uiContainer.style.right = "-300px";
                uiToggle.textContent = "<";
                uiToggleFadeOut();

            } else {
                uiContainer.style.right = "0px";
                uiToggle.textContent = ">";
                window.clearTimeout(uiToggleFadeOutTimeout ?? undefined);
                uiToggleFadeOutTimeout = null;
                uiToggle.style.opacity = "1";
            }
        };

        const objectListControl = this._objectListControl = new ObjectListControl(ownerDocument);
        const objectListDiv = objectListControl.listDiv;
        objectListDiv.style.height = "calc(100% - 224px - 80px)";
        objectListDiv.style.width = "100%";
        objectListDiv.style.marginBottom = "5px";
        objectListDiv.style.padding = "5px";
        objectListDiv.style.boxSizing = "border-box";
        objectListDiv.style.backgroundColor = "rgb(68, 68, 68)";
        objectListDiv.style.overflow = "auto";
        uiInnerContainer.appendChild(objectListDiv);

        const inspectorDiv = this._inspectorDiv = ownerDocument.createElement("div");
        inspectorDiv.style.height = "224px";
        inspectorDiv.style.width = "100%";
        inspectorDiv.style.marginBottom = "5px";
        inspectorDiv.style.boxSizing = "border-box";
        inspectorDiv.style.backgroundColor = "rgb(68, 68, 68)";
        uiInnerContainer.appendChild(inspectorDiv);

        const fileInput = new FileDropControlBuilder(ownerDocument).createFileDrop(this._onReceiveFiles);
        fileInput.style.width = "100%";
        fileInput.style.height = "80px";
        fileInput.style.display = "block";
        fileInput.style.backgroundColor = "black";
        fileInput.style.color = "white";
        fileInput.style.fontSize = "16px";
        uiInnerContainer.appendChild(fileInput);

        objectListControl.addItem(mmdCamera, "camera");
        for (let i = 0; i < staticMeshes.length; ++i) {
            const mesh = staticMeshes[i];
            objectListControl.addItem(mesh, mesh.name);
        }
        objectListControl.onSelectedItemChanged = (item): void => {
            if (item !== null && (item as MmdWasmModel).mesh !== undefined) {
                fixMaterialTab.setMmdMesh((item as MmdWasmModel).mesh);
            } else {
                fixMaterialTab.setMmdMesh(null);
            }
            this._renderInspector(item);
        };
        objectListControl.selectedItem = mmdCamera;
    }

    private readonly _onReceiveFiles = async(files: File[]): Promise<void> => {
        const mmdRuntime = this._mmdRuntime;
        const mmdCamera = this._mmdCamera;
        const audioPlayer = this._audioPlayer;
        const modelLoader = this._modelLoader;
        const motionLoader = this._motionLoader;
        const shadowGenerator = this._shadowGenerator;

        const importDialog = this._importDialog;
        const objectListControl = this._objectListControl;

        let isAudioImport = false;
        let isModelImport = false;

        if (files.length === 1 && (files[0].name.endsWith(".mp3") || files[0].name.endsWith(".wav"))) {
            isAudioImport = true;
        } else if (!isAudioImport) {
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];

                if (file.name.endsWith(".pmx") || file.name.endsWith(".pmd") || file.name.endsWith(".bpmx")) {
                    isModelImport = true;
                    break;
                }
            }
        }

        if (isAudioImport) {
            URL.revokeObjectURL(audioPlayer.source);
            const url = URL.createObjectURL(files[0]);
            audioPlayer.source = url;
            this._audioFileName = files[0].name;

            if (objectListControl.selectedItem === mmdCamera) this._renderInspector(mmdCamera);
        } else if (isModelImport) {
            const modelFiles: File[] = [];
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                if (file.name.endsWith(".pmx") || file.name.endsWith(".pmd") || file.name.endsWith(".bpmx")) {
                    modelFiles.push(file);
                }
            }

            const modelFile = modelFiles.length === 1 ? modelFiles[0] : await importDialog.select("Import model", modelFiles, file => file.name);
            if (modelFile === null) return;
            const mmdMesh = await modelLoader.loadModel(modelFile, files);
            if (mmdMesh === null) return;

            for (const mesh of mmdMesh.metadata.meshes) mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(mmdMesh);
            if (MmdMesh.isMmdSkinnedMesh(mmdMesh)) {
                const mmdModel = mmdRuntime.createMmdModel(mmdMesh, {
                    materialProxyConstructor: AlphaTestMaterialProxy as unknown as IMmdMaterialProxyConstructor<Material>
                });
                objectListControl.addItem(mmdModel, mmdMesh.metadata.header.modelName);
                objectListControl.selectedItem = mmdModel;
            } else {
                objectListControl.addItem(mmdMesh, mmdMesh.metadata.header.modelName);
                objectListControl.selectedItem = mmdMesh;
            }
        } else {
            const motionFiles: File[] = [];
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                if (file.name.endsWith(".vmd")) {
                    motionFiles.push(file);
                }

                if (file.name.endsWith(".bvmd")) {
                    motionFiles.length = 0;
                    motionFiles.push(file);
                    break;
                }

                if (file.name.endsWith(".vpd")) {
                    motionFiles.length = 0;
                    motionFiles.push(file);
                    break;
                }
            }
            if (motionFiles.length === 0) return;
            const animationName = motionFiles[0].name;
            const mmdAnimation: Nullable<MmdWasmAnimation> =
                motionFiles[0].name.endsWith(".bvmd") ? await motionLoader.loadBvmd(animationName, motionFiles[0]) :
                    motionFiles[0].name.endsWith(".vpd") ? await motionLoader.loadVpd(animationName, motionFiles[0]) :
                        await motionLoader.loadVmd(animationName, motionFiles);

            const targets: {
                name: string
                value: MmdCamera | MmdWasmModel
            }[] = [];
            targets.push({
                name: "Camera",
                value: mmdCamera
            });
            for (const model of mmdRuntime.models) {
                targets.push({
                    name: model.mesh.metadata.header.modelName,
                    value: model
                });
            }

            const targetModel = await this._importDialog.select("Import motion to", targets, target => target.name);
            if (targetModel === null) return;

            const modelOrCamera = targetModel.value;
            while (modelOrCamera.runtimeAnimations.length !== 0) modelOrCamera.removeAnimation(0);
            modelOrCamera.addAnimation(mmdAnimation);
            modelOrCamera.setAnimation(animationName);
            if (modelOrCamera !== mmdCamera) {
                const model = modelOrCamera as MmdWasmModel;
                mmdRuntime.lock.wait();
                model.ikSolverStates.fill(1);
                model.morph.resetMorphWeights();
                for (const mesh of model.mesh.metadata.meshes) mesh.visibility = 1;
            }
            motionLoader.flushCache(mmdCamera, mmdRuntime.models);
            mmdRuntime.seekAnimation(mmdRuntime.currentFrameTime, true);
            if (modelOrCamera !== mmdCamera) {
                const model = modelOrCamera as MmdWasmModel;
                (this._mmdRuntime as unknown as { _needToInitializePhysicsModels: Set<MmdWasmModel>; })._needToInitializePhysicsModels.add(model);
            } else {
                this._cameraAnimationName = animationName;
            }

            if (objectListControl.selectedItem === modelOrCamera) this._renderInspector(modelOrCamera);
        }
    };

    private _renderInspector(selectedItem: Nullable<MmdWasmModel | MmdCamera | MmdMesh | Mesh>): void {
        const mmdRuntime = this._mmdRuntime;
        const cameraRoot = this._cameraRoot;
        const mmdCamera = this._mmdCamera;
        const audioPlayer = this._audioPlayer;
        const shadowGenerator = this._shadowGenerator;

        const inspectorDiv = this._inspectorDiv;
        const controlBuilder = this._controlBuilder;

        inspectorDiv.innerHTML = "";
        if (selectedItem === null) return;
        const isMmdModel = ((item: typeof selectedItem): item is MmdWasmModel => (item as MmdWasmModel).mesh !== undefined)(selectedItem);
        const isMesh = ((item: typeof selectedItem): item is Mesh => (item as MmdWasmModel).mesh === undefined && (item as MmdMesh).metadata?.isMmdModel !== true)(selectedItem);
        const isMmdCamera = ((item: typeof selectedItem): item is MmdCamera => item === mmdCamera)(selectedItem);

        if (isMmdCamera) {
            const cameraHeightScale = controlBuilder.createScalarInput(
                "camera height scale",
                cameraRoot.scaling.y,
                0.1,
                2,
                (value): void => {
                    cameraRoot.scaling.y = value;
                }
            );
            inspectorDiv.appendChild(cameraHeightScale);

            const audioLabel = controlBuilder.createLabel(
                "audio",
                this._audioFileName,
                this._audioFileName === "none"
                    ? undefined
                    : (): void => {
                        URL.revokeObjectURL(audioPlayer.source);
                        audioPlayer.source = "";
                        this._audioFileName = "none";
                        this._renderInspector(selectedItem);
                    }
            );
            inspectorDiv.appendChild(audioLabel);
        } else {
            const mesh = (selectedItem as MmdWasmModel).mesh !== undefined
                ? (selectedItem as MmdWasmModel).mesh
                : selectedItem as Mesh;

            const modelPosition = controlBuilder.createVector3Input(
                "position",
                [mesh.position.x, mesh.position.y, mesh.position.z],
                -100,
                100,
                (value): void => {
                    mesh.position.x = value[0];
                    mesh.position.y = value[1];
                    mesh.position.z = value[2];
                }
            );
            inspectorDiv.appendChild(modelPosition);

            const degToRad = 180 / Math.PI;

            const modelRotation = controlBuilder.createVector3Input(
                "rotation",
                [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
                -360,
                360,
                (value): void => {
                    mesh.rotation.x = value[0] / degToRad;
                    mesh.rotation.y = value[1] / degToRad;
                    mesh.rotation.z = value[2] / degToRad;
                }
            );
            inspectorDiv.appendChild(modelRotation);

            const space = controlBuilder.createSpace();
            inspectorDiv.appendChild(space);

            if (isMesh) {
                const meshEnabled = controlBuilder.createCheckbox(
                    "enabled",
                    selectedItem.isEnabled(),
                    (value: boolean): void => {
                        selectedItem.setEnabled(value);
                    }
                );
                inspectorDiv.appendChild(meshEnabled);
            }

            const receiveShadows = controlBuilder.createCheckbox(
                "receive shadows",
                mesh.metadata?.meshes !== undefined
                    ? mesh.metadata.meshes[0]?.receiveShadows ?? false
                    : mesh.receiveShadows,
                (value: boolean): void => {
                    if (mesh.metadata && mesh.metadata.meshes !== undefined) {
                        for (const subMesh of (mesh as MmdMesh).metadata.meshes) subMesh.receiveShadows = value;
                    } else mesh.receiveShadows = value;
                }
            );
            inspectorDiv.appendChild(receiveShadows);

            const castShadows = controlBuilder.createCheckbox(
                "cast shadows",
                shadowGenerator.getShadowMap()?.renderList?.includes(mesh) ?? false,
                (value: boolean): void => {
                    if (value) {
                        shadowGenerator.addShadowCaster(mesh);
                    } else {
                        shadowGenerator.removeShadowCaster(mesh);
                    }
                }
            );
            inspectorDiv.appendChild(castShadows);
        }

        if (isMmdModel || isMmdCamera) {
            if (selectedItem !== mmdCamera) {
                const space = controlBuilder.createSpace();
                inspectorDiv.appendChild(space);
            }

            const animationName = selectedItem === mmdCamera
                ? this._cameraAnimationName
                : selectedItem.currentAnimation?.animation.name ?? null;
            const animationLabel = controlBuilder.createLabel(
                "animation",
                animationName ?? "none",
                animationName === null
                    ? undefined
                    : (): void => {
                        selectedItem.setAnimation(null);
                        if (isMmdCamera) {
                            this._cameraAnimationName = null;

                            selectedItem.position.set(0, 10, 0);
                            selectedItem.rotation.setAll(0);
                            selectedItem.fov = 0.8;
                            selectedItem.distance = -45;
                        } else {
                            mmdRuntime.lock.wait();
                            selectedItem.ikSolverStates.fill(1);
                            selectedItem.morph.resetMorphWeights();
                            for (const mesh of selectedItem.mesh.metadata.meshes) mesh.visibility = 1;
                            (this._mmdRuntime as unknown as { _needToInitializePhysicsModels: Set<MmdWasmModel>; })._needToInitializePhysicsModels.add(selectedItem);
                        }
                        while (selectedItem.runtimeAnimations.length !== 0) selectedItem.removeAnimation(0);
                        this._renderInspector(selectedItem);
                    }
            );
            inspectorDiv.appendChild(animationLabel);
        }

        if (isMmdModel) {
            const removeModel = controlBuilder.createButton(
                "#f44",
                "remove model",
                (): void => {
                    const model = selectedItem as MmdWasmModel;
                    const mesh = model.mesh;
                    this._modelLoader.disposeModel(mesh);
                    mmdRuntime.destroyMmdModel(model);
                    this._objectListControl.removeItem(model);
                }
            );
            inspectorDiv.appendChild(removeModel);
        } else if (MmdMesh.isMmdMesh(selectedItem as MmdMesh)) {
            const removeMesh = controlBuilder.createButton(
                "#f44",
                "remove mesh",
                (): void => {
                    const mesh = selectedItem as MmdMesh;
                    this._modelLoader.disposeModel(mesh);
                    this._objectListControl.removeItem(mesh);
                }
            );
            inspectorDiv.appendChild(removeMesh);
        }
    }
}
