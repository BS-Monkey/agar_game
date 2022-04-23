export declare class TiledGroundModel {
    xmin: number;
    zmin: number;
    xmax: number;
    zmax: number;
    precision: {
        w: number;
        h: number;
    };
    subdivisions: {
        h: number;
        w: number;
    };
    model: any;
    constructor(scene: any);
    _createMesh(scene: any): void;
    getMousePositionOnGround(scene: any): any;
}
