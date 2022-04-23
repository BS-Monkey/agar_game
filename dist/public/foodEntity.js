import { SphereModel } from "./sphereModel.js";
export class FoodEntity {
    constructor(id, x, z, r, scene, adt, templateMesh) {
        this.id = id;
        this.x = x;
        this.z = z;
        this.r = r;
        var sphere = new SphereModel(x, z, r, scene, templateMesh);
        this.model = sphere;
        {
            // NameText
            /*var textModel = new BABYLON.GUI.TextBlock();
            textModel.text = "Id: "+id;
            textModel.paddingTop = "2px";
            textModel.width = "500px";
            textModel.height = "40px";
            textModel.color = "green";
            textModel.cornerRadius = 10;
            textModel.fontSize = 20;
            textModel.fontFamily = "Verdana";
            //adt.addControl(textModel);
            textModel.linkWithMesh(this.model.model);
            textModel.linkOffsetY = -(r * 10);
            this.textModel = textModel;*/
        }
    }
}
