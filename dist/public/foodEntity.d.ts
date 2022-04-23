/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />
import { SphereModel } from "./sphereModel.js";
export declare class FoodEntity {
    id: any;
    x: number;
    z: number;
    r: number;
    model: SphereModel;
    constructor(id: any, x: number, z: number, r: number, scene: BABYLON.Scene, adt: BABYLON.GUI.AdvancedDynamicTexture, templateMesh?: BABYLON.Mesh);
}
