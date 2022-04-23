/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />
import { SphereModel } from "./sphereModel.js";
export declare class PlayerEntity {
    id: string;
    username: string;
    velocity: number;
    position: BABYLON.Vector3;
    model: SphereModel;
    textModel: BABYLON.GUI.TextBlock;
    targetDirection: BABYLON.Vector3;
    adt: BABYLON.GUI.AdvancedDynamicTexture;
    constructor(id: string, x: number, z: number, r: number, scene: BABYLON.Scene, adt: BABYLON.GUI.AdvancedDynamicTexture, username: string);
    setId(id: any): void;
    getMinimalData(): any;
    destroy(): void;
    update(minimalData: any): void;
    getPosition(): BABYLON.Vector3;
    setPosition(x: number, z: number): void;
    onTick(deltaTime: number): void;
}
