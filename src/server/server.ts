///<reference path="../../node_modules/babylonjs/babylon.module.d.ts" />
// Using express: http://expressjs.com/
let BABYLON = require('babylonjs');
const express = require('express');
const path = require("path");
import { AddressInfo } from 'net';

var engine = new BABYLON.NullEngine();
var scene = new BABYLON.Scene(engine);

// Create the app
var app = express();
var ejs = require('ejs');
// Set up the server
// process.env.PORT is related to deploying on heroku
// var server = app.listen(process.env.PORT || 3000, listen);
var server =require("http").Server(app);
const bodyParser = require('body-parser');
server.listen(process.env.PORT ||3000,listen);
app.set("views",path.join(__dirname, "../public/views"));
app.use(express.static(path.join(__dirname,"../",'/public')));

app.engine('html', require('ejs').renderFile); //renders .ejs as html
app.get('/', function(req:any, res:any){
    res.render("index.html");
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/start', function (req :any, res :any) {
    res.render("game.html");
});
var players: any = {};
var foodBlobs: Array<Food> = [];
var currentFoodId: number = 0;

class Food {
    id: any;
    x: number; 
    z: number;
    r: number;

    constructor(id: any, x: number, z: number, r: number) {
        this.id = id;
        this.x = x;
        this.z = z;
        this.r = r;
    }

}

class Player {
    id: any;
    username: string;
    velocity: number;
    public position: BABYLON.Vector3;
    r: number;
    targetDirection: BABYLON.Vector3;

    constructor(id: any, x: number, z: number, r: number, username: string) {
        this.id = id;
        this.username = username;
        this.velocity = 1;
        this.position = new BABYLON.Vector3(x, 0, z);
        this.r = r;
        this.targetDirection = new BABYLON.Vector3(0, 0, 0);
    }

    getMinimalData() {
        return {
            x: this.position.x,
            z: this.position.z,
            r: this.r,
            username: this.username
        };
    }

    setPosition(pos:BABYLON.Vector3){
        this.position=pos;
       
    }

    getPosition():BABYLON.Vector3{
        return this.position;
    }

    onTick() {
        if (this.targetDirection.x === 0 && this.targetDirection.z === 0) {
            return;
        }
        this.position.addInPlace(this.targetDirection);
        this.position.x = Math.min(Math.max(this.position.x, -800), 800);
        this.position.z = Math.min(Math.max(this.position.z, -800), 800);
    }

    setTarget(forward: BABYLON.Vector3) {
        var direction = forward.subtract(this.position);
        // if (forward.subtract(this.getPosition()).length() < 20) {
        //     // Quickly catch back up to the server.
        //     direction.y = 0;
        //     direction.scaleInPlace(0.5);
        // }
        // else {
            direction.normalize();
            direction.y = 0;
            direction.scaleInPlace(this.velocity);
        // }
        // direction.normalize();
        // direction.y = 0;
        // direction.scaleInPlace(this.velocity)
        this.targetDirection = direction;
    }

    reset() {
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.r = 8;
    }
}

function listen() {
    var addressInfo = (<AddressInfo>server.address());
    var host = addressInfo.address;
    var port = addressInfo.port;
    console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static('./'));

var io = require('socket.io')(server);

setInterval(heartbeat, 1000 / 60);

function heartbeat(): void {
    for (const id in players) {
        players[id].onTick();
    }
    var minimalPlayers: any = {};
    var foodEatenIds = [];
    var foodEatenToRemoveIndices = [];
    // Game Logic
    // console.log(players);
    for (const id in players) {
        var x1 = players[id].position.x;
        var z1 = players[id].position.z;
        var r1 = players[id].r;
        // Food collissions
        
        for (var index = 0; index < foodBlobs.length; index++) {
            var food = foodBlobs[index];
            var dist = Math.sqrt(Math.pow(x1 - food.x, 2) + Math.pow(z1 - food.z, 2));
            if (dist < (r1 + food.r) * 0.5) {
                // Eat food
                foodEatenIds.push(food.id);
                foodEatenToRemoveIndices.push(index);
                players[id].r += food.r * 0.1;
            }
        }
        for (var index = 0; index < foodEatenToRemoveIndices.length; index++) {
            var foodIndex = foodEatenToRemoveIndices[index];
            foodBlobs.splice(foodIndex, 1);
        }
        // Player collissions
        for (const otherId in players) {
            var x2 = players[otherId].position.x;
            var z2 = players[otherId].position.z;
            var r2 = players[otherId].r;
            if (id !== otherId) {
                var dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2));
                if (dist < (r1 + r2) * 0.5) {
                    if(r1===r2){

                    }else{

                        if (r1 < r2) {
                            players[id].reset();
                            console.log(players[id].username);
                            io.emit('playerEaten', id);
                        }
                        else {
                            players[otherId].reset();
                            console.log(players[otherId].username);
                            io.emit('playerEaten', otherId);
                        }
                    }
                }
            }
        }
        minimalPlayers[id] = players[id].getMinimalData();
    }
    var foodCreated = [];
    while (foodBlobs.length < 200) {
        var x = (Math.random() * 1600) - 800;
        var z = (Math.random() * 1600) - 800;
        // TODO: Generate away from players
        var r = Math.random() * 10 + 2;
        var foodBlob = new Food(currentFoodId, x, z, r);
        currentFoodId++;
        foodBlobs.push(foodBlob);
        foodCreated.push(foodBlob);

    }
    
    io.emit('foodCreated', foodCreated);
    io.emit('foodEaten', foodEatenIds);
    io.emit('heartbeat', minimalPlayers);
}

io.sockets.on('connection', function (socket: any) {
    console.log('We have a new client: ' + socket.id);

    socket.on('start', function (data: any) {
        console.log(data.username + ': ' + socket.id + ' ' + data.x + ' ' + data.z + ' ' + data.r);
        var player = new Player(socket.id, data.x, data.z, data.r, data.username);
        players[socket.id] = player;
        setTimeout(() => {
            socket.emit('init', foodBlobs);
        }, 500);
    });
    socket.on('update', function (forward:any) {
        var player = players[socket.id];
        if (player !== undefined) {
            var forwardVec = new BABYLON.Vector3(forward._x, forward._y, forward._z);           
            player.setTarget(forwardVec);
             
        }
    });
    socket.on('disconnect', function () {
        console.log('Client has disconnected: ' + socket.id);
        delete players[socket.id]
    });
        
    socket.on("startGame",function(playerName:any){
        // console.log(startGame);
        var is_exist=false;
        // console.log(players  );
        for(var index in players){
            if(playerName.trim()==players[index].username.trim()){
                is_exist=true;
            }
        }
        socket.emit("startGame",{existFlag:is_exist});
    });
    
    socket.on("index_connect",function(){
        socket.emit("AllPlayers",players); 
    });
    
});