import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/Textures/Loaders/tgaTextureLoader";
import "babylon-mmd/esm/Runtime/Animation/mmdRuntimeCameraAnimation";
import "babylon-mmd/esm/Runtime/Optimized/Animation/mmdWasmRuntimeModelAnimation";

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "@babylonjs/core/scene";
import { SdefInjector } from "babylon-mmd/esm/Loader/sdefInjector";
import { StreamAudioPlayer } from "babylon-mmd/esm/Runtime/Audio/streamAudioPlayer";
import { MmdCamera } from "babylon-mmd/esm/Runtime/mmdCamera";
import { MmdWasmInstanceTypeMPR } from "babylon-mmd/esm/Runtime/Optimized/InstanceType/multiPhysicsRelease";
import type { MmdWasmInstance } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance";
import { getMmdWasmInstance } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance";
import { MmdWasmRuntime, MmdWasmRuntimeAnimationEvaluationType } from "babylon-mmd/esm/Runtime/Optimized/mmdWasmRuntime";
import { MotionType } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/motionType";
import { PhysicsStaticPlaneShape } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/physicsShape";
import { RigidBody } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/rigidBody";
import { RigidBodyConstructionInfo } from "babylon-mmd/esm/Runtime/Optimized/Physics/Bind/rigidBodyConstructionInfo";
import { MmdWasmPhysics } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysics";
import { MmdWasmPhysicsRuntimeImpl } from "babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysicsRuntimeImpl";
import { MmdPlayerControl } from "babylon-mmd/esm/Runtime/Util/mmdPlayerControl";

import type { ISceneBuilder } from "@/baseRuntime";
import { createCameraSwitch } from "@/Util/createCameraSwitch";
import { createDefaultArcRotateCamera } from "@/Util/createDefaultArcRotateCamera";
import { createDefaultGround } from "@/Util/createDefaultGround";
import { parallelLoadAsync } from "@/Util/parallelLoadAsync";

import { CachedMotionLoader } from "./cachedMotionLoader";
import { ModelLoader } from "./modelLoader";
import { ViewerUi } from "./viewerUi";

export class SceneBuilder implements ISceneBuilder {
    public async build(canvas: HTMLCanvasElement, engine: AbstractEngine): Promise<Scene> {
        SdefInjector.OverrideEngineCreateEffect(engine);

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0.95, 0.95, 0.95, 1.0);
        scene.ambientColor = new Color3(0.5, 0.5, 0.5);

        const [wasmInstance] = await parallelLoadAsync(scene, [
            ["mmd runtime", async(updateProgress): Promise<MmdWasmInstance> => {
                updateProgress({ lengthComputable: true, loaded: 0, total: 1 });
                const mmdWasmInstance = await getMmdWasmInstance(new MmdWasmInstanceTypeMPR());
                updateProgress({ lengthComputable: true, loaded: 1, total: 1 });
                return mmdWasmInstance;
            }]
        ]);

        const mmdRoot = new TransformNode("mmdRoot", scene);
        const cameraRoot = new TransformNode("cameraRoot", scene);
        cameraRoot.parent = mmdRoot;
        const mmdCamera = new MmdCamera("mmdCamera", new Vector3(0, 10, 0), scene);
        mmdCamera.maxZ = 5000;
        mmdCamera.ignoreParentScaling = true;
        mmdCamera.parent = cameraRoot;
        const camera = createDefaultArcRotateCamera(scene);
        createCameraSwitch(scene, canvas, camera, mmdCamera);

        const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
        hemisphericLight.intensity = 0.5;
        hemisphericLight.specular = new Color3(0, 0, 0);
        hemisphericLight.groundColor = new Color3(1, 1, 1);

        const directionalLight = new DirectionalLight("directionalLight", new Vector3(0.5, -1, 1), scene);
        directionalLight.intensity = 0.5;

        const shadowGenerator = new CascadedShadowGenerator(1024, directionalLight);
        shadowGenerator.transparencyShadow = true;
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.forceBackFacesOnly = false;
        shadowGenerator.lambda = 0.96;
        shadowGenerator.bias = 0.007;
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;

        const defaultPipeline = new DefaultRenderingPipeline("default", true, scene);
        defaultPipeline.samples = 4;
        defaultPipeline.bloomEnabled = true;
        defaultPipeline.chromaticAberrationEnabled = true;
        defaultPipeline.chromaticAberration.aberrationAmount = 1;
        defaultPipeline.fxaaEnabled = true;
        defaultPipeline.imageProcessingEnabled = true;
        defaultPipeline.imageProcessing.toneMappingEnabled = true;
        defaultPipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
        defaultPipeline.imageProcessing.vignetteWeight = 0.5;
        defaultPipeline.imageProcessing.vignetteStretch = 0.5;
        defaultPipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0);
        defaultPipeline.imageProcessing.vignetteEnabled = true;

        const mmdRuntime = new MmdWasmRuntime(wasmInstance, scene, new MmdWasmPhysics(scene));
        mmdRuntime.loggingEnabled = true;
        mmdRuntime.evaluationType = MmdWasmRuntimeAnimationEvaluationType.Buffered;
        mmdRuntime.register(scene);
        mmdRuntime.setCamera(mmdCamera);
        const audioPlayer = new StreamAudioPlayer(scene);
        audioPlayer.preservesPitch = false;
        mmdRuntime.setAudioPlayer(audioPlayer);
        const mmdPlayerControl = new MmdPlayerControl(scene, mmdRuntime, audioPlayer);
        mmdPlayerControl.showPlayerControl();

        const physicsRuntime = mmdRuntime.physics!.getImpl(MmdWasmPhysicsRuntimeImpl);
        {
            const info = new RigidBodyConstructionInfo(mmdRuntime.wasmInstance);
            info.motionType = MotionType.Static;
            info.shape = new PhysicsStaticPlaneShape(physicsRuntime, new Vector3(0, 1, 0), 0);
            const groundBody = new RigidBody(physicsRuntime, info);
            physicsRuntime.addRigidBodyToGlobal(groundBody);
        }
        const ground = createDefaultGround(scene, { size: 300 });

        const modelLoader = new ModelLoader(scene);
        const motionLoader = new CachedMotionLoader(scene, wasmInstance);
        new ViewerUi(
            scene,
            mmdRuntime,
            audioPlayer,
            cameraRoot,
            mmdCamera,
            modelLoader,
            motionLoader,
            shadowGenerator,
            [ground]
        );

        return scene;
    }
}
