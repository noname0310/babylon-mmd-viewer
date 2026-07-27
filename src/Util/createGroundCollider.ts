import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.pure";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.pure";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShapeBox } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene.pure";

export function createGroundCollider(scene: Scene): void {
    const transformNode = new TransformNode("ground", scene);
    const groundRigidBody = new PhysicsBody(transformNode, PhysicsMotionType.STATIC, true, scene);
    groundRigidBody.shape = new PhysicsShapeBox(
        new Vector3(0, -1, 0),
        new Quaternion(),
        new Vector3(100, 2, 100), scene);
}
