///<reference path="../../node_modules/babylonjs/babylon.module.d.ts" />
import { TiledGroundModel } from "./tiledGroundModel.js";
import { PlayerEntity } from "./playerEntity.js";
import { FoodEntity } from './foodEntity.js';
class Game {
    constructor(canvasElement) {
        this._players = {};
        this._foodEntities = [];
        // GameLogic
        this._gameInitialized = false;
        // Initialize Engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
        // Networking
        this._socket = io.connect();
    }
    createScene() {
        // create a basic BJS Scene object
        this._scene = new BABYLON.Scene(this._engine);
        // create a basic light, aiming 0,1,0 - meaning, to the sky
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        // Used for Nametags above players
        this._textHandle = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        // Populate the scene
        var skyBoxTexture = new BABYLON.CubeTexture("/src/public/assets/textures/night.dds", this._scene);
        this._scene.createDefaultSkybox(skyBoxTexture, true, 5000);
        this._player = new PlayerEntity(this._socket.id, 0, 0, 8, this._scene, this._textHandle, "");
        this._groundModel = new TiledGroundModel(this._scene);
        this._foodTemplateMesh = new FoodEntity(-1, 0, 0, 0, this._scene, this._textHandle, null).model.mesh;
        // Camera
        this._camera = new BABYLON.ArcRotateCamera("arcCamera1", 0, 1, 20, this._player.model.mesh, this._scene);
        this._camera.attachControl(this._canvas, true);
        this._camera.maxZ = 1000;
        this._scene.collisionsEnabled = true;
        this._camera.checkCollisions = true;
        this._groundModel.model.checkCollisions = true;
        // Loading game text
        this._loadingGameText = new BABYLON.GUI.TextBlock();
        this._loadingGameText.paddingTop = "2px";
        this._loadingGameText.width = "1000px";
        this._loadingGameText.height = "100px";
        this._loadingGameText.color = "green";
        this._loadingGameText.fontSize = 50;
        this._loadingGameText.fontFamily = "Verdana";
        // // Atmosphere
        // this._scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        // this._scene.fogDensity = 0.006;
        // this._scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
        // this._scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        // Game loop
        var timestep = 1000 / 60;
        var delta = 0;
        var forward = new BABYLON.Vector3(0, 0, 0);
        var mPlayer = this._player;
        var mplayerList = this._players;
        // Decoupling physics from framerate causes jittery movement.
        // Rollingaverage mitigates jitter by smoothing out local variance in deltatime.
        var rollingAverage = new BABYLON.RollingAverage(60);
        this._scene.registerBeforeRender(() => {
            delta += this._engine.getDeltaTime();
            rollingAverage.add(this._scene.getAnimationRatio());
            if (!this._gameInitialized) {
                return;
            }
            // Get player input.
            var groundPoint = this._groundModel.getMousePositionOnGround(this._scene);
            if (groundPoint !== null) {
                forward = groundPoint;
            }
            // Process player input.
            if (delta >= timestep) {
                // Send updates to the server at a locked 60 hz.
                // for (const id in mplayerList) { mplayerList[id].onTick(rollingAverage.average); }
                // for (const id in mplayerList) { mplayerList[id].onTick(1); }
                this._socket.emit('update', forward);
                delta = 0;
            }
            this._camera.radius = Math.sqrt(this._player.model.getRadius()) * 50;
            this._camera.maxZ = Math.sqrt(this._player.model.getRadius()) * 200;
        });
        // Networking
        this.initializeNetwork();
    }
    initializeNetwork() {
        this._socket.emit('start', Object.assign(Object.assign({}, this._player.getMinimalData()), { username: this._player.username }));
        this._socket.on('connect', () => {
            this._player.setId(this._socket.id);
            this._players[this._socket.id] = this._player;
        });
        this._socket.on('init', (blobs) => {
            this._loadingGameText.text = "Loading...";
            // this._loadingGameText.text = "Loading in " + blobs.length + " objects. Please wait.";
            this._textHandle.addControl(this._loadingGameText);
            // Spawn all food at once.
            setTimeout(() => {
                for (const index in blobs) {
                    var blob = blobs[index];
                    var food = new FoodEntity(blob.id, blob.x, blob.z, blob.r, this._scene, this._textHandle, undefined);
                    this._foodEntities.push(food);
                }
                this._textHandle.removeControl(this._loadingGameText);
            }, 33);
            setTimeout(() => {
                this._gameInitialized = true;
            }, 800);
        });
        this._socket.on('foodCreated', (foodCreated) => {
            for (const index in foodCreated) {
                var foodBlob = foodCreated[index];
                var food = new FoodEntity(foodBlob.id, foodBlob.x, foodBlob.z, foodBlob.r, this._scene, this._textHandle, undefined);
                this._foodEntities.push(food);
            }
        });
        this._socket.on('playerEaten', (id) => {
            for (var index in this._players) {
                if (id === this._player.id) {
                    // this._players[id].model.mesh.position = new BABYLON.Vector3(0, 0, 0);
                    // this._players[id].model.setRadius(10);  
                    document.location.pathname = "/";
                }
            }
        });
        this._socket.on('foodEaten', (ids) => {
            for (const i in ids) {
                var id = ids[i];
                this._foodEntities.forEach((food, j) => {
                    if (food.id == id) {
                        //console.log("Distance to player: " + food.model.getPosition().subtract(player.model.getPosition()).length());
                        food.model.dispose();
                        //food.textModel.dispose();
                        delete food.model.mesh;
                        //delete food.textModel;
                        this._foodEntities.splice(j, 1);
                    }
                });
            }
        });
        this._socket.on('heartbeat', (minimalPlayers) => {
            // Update player directions and new connections.
            for (const id in minimalPlayers) {
                var minimalPlayer = minimalPlayers[id];
                var player = this._players[id];
                if (player !== undefined) {
                    player.update(minimalPlayer);
                    player.onTick(1);
                    continue;
                }
                this._players[id] = new PlayerEntity(id, minimalPlayer.x, minimalPlayer.z, minimalPlayer.r, this._scene, this._textHandle, minimalPlayer.username);
            }
            // Remove disconnected players.
            for (const id in this._players) {
                if (!(id in minimalPlayers) && id !== this._socket.id) {
                    console.log("Deleting object");
                    this._players[id].destroy();
                    delete this._players[id];
                }
            }
            this.drawPlayerList();
        });
    }
    drawPlayerList() {
        var html = "";
        var players = this._players;
        var sorted = Object.keys(players).sort(function (a, b) {
            return players[b].model.getRadius() - players[a].model.getRadius();
        });
        for (var i = 0; i < 10; i++) {
            if (sorted[i] === undefined)
                break;
            var username = this._players[sorted[i]].username;
            var radius = this._players[sorted[i]].model.getRadius();
            html += '<div class="plyer_info">' + username + '-' + radius.toFixed(2) + '</div>';
        }
        document.getElementById("playerslist").innerHTML = html;
        document.getElementById("player_number").innerText = sorted.length.toString();
    }
    doRender() {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}
window.addEventListener('DOMContentLoaded', function () {
    let game = new Game('renderCanvas');
    game.createScene();
    // Start render loop.
    game.doRender();
});
