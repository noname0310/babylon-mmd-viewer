import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepImmutable, Nullable } from "@babylonjs/core/types";
import type { IMmdRuntime } from "babylon-mmd/esm/Runtime/IMmdRuntime";

export class BodyWaker {
    private _nextIndex: number = 0;
    private readonly _mmdRuntime: IMmdRuntime;

    public constructor(mmdRuntime: IMmdRuntime) {
        this._mmdRuntime = mmdRuntime;
    }

    private static readonly _ZeroVector: DeepImmutable<Vector3> = Vector3.Zero();

    private readonly _afterRender = (): void => {
        const models = this._mmdRuntime.models;
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            const physicsModel = (model as any)._physicsModel;
            if (physicsModel !== null) {
                const bodies = physicsModel._bodies as readonly Nullable<PhysicsBody>[];
                const body = bodies[this._nextIndex % bodies.length];
                if (body) {
                    body.applyForce(BodyWaker._ZeroVector, BodyWaker._ZeroVector);
                }
            }
        }

        this._nextIndex += 1;
        if (Number.MAX_SAFE_INTEGER <= this._nextIndex) this._nextIndex = 0;
    };

    public register(scene: Scene): void {
        scene.onAfterRenderObservable.add(this._afterRender);
    }

    public unregister(scene: Scene): void {
        scene.onAfterRenderObservable.removeCallback(this._afterRender);
    }
}
