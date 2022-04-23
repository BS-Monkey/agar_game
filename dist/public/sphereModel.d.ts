/// <reference types="babylonjs" />
export declare class SphereModel {
    mesh: any;
    template: any;
    constructor(x: number, z: number, r: number, scene: any, templateMesh: any);
    _createNormalMesh(x: number, z: number, r: number, scene: any): void;
    _createTemplateMesh(x: number, z: number, r: number, scene: any): void;
    _createInstanceMesh(x: number, z: number, r: number, scene: any, templateMesh: any): void;
    moveInDirection(direction: BABYLON.Vector3): void;
    setPosition(x: number, z: number): void;
    increaseRadius(deltaR: number): void;
    setRadius(r: number): void;
    getPosition(): BABYLON.Vector3;
    getRadius(): number;
    dispose(): void;
}
