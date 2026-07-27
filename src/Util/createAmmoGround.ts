import { Vector3 } from "@babylonjs/core/Maths/math.vector.pure";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder.pure";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.pure";
import { PhysicsImpostor } from "@babylonjs/core/Physics/v1/physicsImpostor.pure";
import type { Scene } from "@babylonjs/core/scene.pure";

export function createAmmoGround(scene: Scene): Mesh {
    const ground = CreatePlane("ground", { size: 300 }, scene);
    ground.rotation = new Vector3(Math.PI / 2, 0, 0);
    ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.PlaneImpostor, { mass: 0, restitution: 0.9 }, scene);
    return ground;
}
