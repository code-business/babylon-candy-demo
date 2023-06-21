import React, { useEffect, useRef } from "react";

import * as BABYLON from "babylonjs";

import "./App.css";

const rgbColors = [
  [242, 27, 206],
  [235, 64, 52],
  [167, 54, 247],
  [235, 64, 52],
  [235, 64, 52],
];

const calculatedRgb = rgbColors.map((rgbArr) => rgbArr.map((n) => n / 255));

const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
  // Create a basic BJS Scene object
  const scene = new BABYLON.Scene(engine);

  //setting the angle of camera
  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0,
    0,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );

  //seting the position of camera 
  camera.setPosition(new BABYLON.Vector3(0, 0, -10));
  
  //turning the lights on and position it to the main grid to make it visible
  new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(-1, 2, -2),
    scene
  );

  // zoom out
  camera.radius += 5;

  // Create the grid of spheres
 
  const cellSize = 1; // Size of each cell
  let i = 0

  for (let row = 4.5; row >= 0; row--) {
    for (let col = 0; col < 1; col++) {
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        `sphere-${row}${col}`,
        { diameter: cellSize * 0.8 },
        scene
      );

      // setting sphere position
      //sphere.position.x = col * cellSize - (gridSize - 1) * cellSize * 0.5;
      sphere.position.x = 0;
     // sphere.position.y = row * cellSize - (gridSize - 1) * cellSize * 0.5;
     sphere.position.y = row

      if (row === 0 && col === 0) {
        console.log(
          "sphere.position.x, sphere.position.y",
          sphere.position.x,
          sphere.position.y
        );
      }

      // setting sphere color by creating material and setting the diffuse color property of material and attaching the material to sphere
      const sphereMaterial = new BABYLON.StandardMaterial("material", scene);
      sphereMaterial.diffuseColor = new BABYLON.Color3(
        ...calculatedRgb[i]
      );

      sphere.material = sphereMaterial;
    }
    i++
  }

  // Return the created scene
  return scene;
};

let isMouseDown: boolean = false;
const thresholdPoint = 0.8;

let pickedSphearMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
let isInit: boolean = false;
const intialCord = { x: 0, y: 0, pointerX: 0, pointerY: 0 };

const getPosition = (
  x: number,
  y: number,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  const position = new BABYLON.Vector3(x, y, 0); // Your Vector3 position

  // Convert the world space position to screen space coordinates by taking projection of a 3D vector
  if (scene.activeCamera) {
    const screenCoordinates = BABYLON.Vector3.Project(
      position,
      BABYLON.Matrix.Identity(),
      scene.getTransformMatrix(),
      scene.activeCamera.viewport.toGlobal(
        engine.getRenderWidth(),
        engine.getRenderHeight()
      )
    );

    return {
      x: screenCoordinates.x,
      y: screenCoordinates.y,
    };
  } else {
    return { x: 0, y: 0 };
  }
};


const countAdjacent = (
  pickedSphere: BABYLON.AbstractMesh,
  indexesY: Array<BABYLON.AbstractMesh>,
  direction: string,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {

  // storing the rgb values of the picked sphere for reference to match it with other sphere's color 
  const refMeshColor = (pickedSphere.material as BABYLON.StandardMaterial)
    .diffuseColor;

  let startX = pickedSphere.position.x;
  let startY = pickedSphere.position.y;

  let tempY = startY;

  indexesY.push(pickedSphere);
  startY--;

  // finding adjacent same colored bubble on bottom side of the switched bubble and storing in indexesY

  // not checking the direction opposite to where sphere is moved because we always switch spheres with different color 

  while (startY > -5 && direction !== "top") {
    // getting absolute position from relative position
    const position = getPosition(startX, startY, scene, engine);

    // picking up the sphere or mesh with the help of position recieved from above getposition function
    const pickedMesh = scene.pick(position.x, position.y).pickedMesh;

    if (pickedMesh) {

      const checkPickedColor = (pickedMesh?.material as BABYLON.StandardMaterial)
        .diffuseColor;

      if (
        refMeshColor.r === checkPickedColor.r &&
        refMeshColor.g === checkPickedColor.g &&
        refMeshColor.b === checkPickedColor.b 
      ) {
        // if the color matches storing it in the indexesY array
        indexesY.push(pickedMesh);
      } 
    }
    startY--;
  }

  startY = tempY + 1;

  // finding adjacent same colored bubble on top side of the switched bubble and storing in indexes Y

  while (startY < 5 && direction !== "bottom") {
    const position = getPosition(startX, startY, scene, engine);
    const pickedMesh = scene.pick(position.x, position.y).pickedMesh;

    if (pickedMesh) {
      const checkPickedColor = (pickedMesh?.material as BABYLON.StandardMaterial)
        .diffuseColor;

      if (
        refMeshColor.r === checkPickedColor.r &&
        refMeshColor.g === checkPickedColor.g &&
        refMeshColor.b === checkPickedColor.b 
      ) {
        indexesY.push(pickedMesh);
      } 
    }

    startY++;
  }
};


const addNewSpheres = (
  positionX: number,
  burstLength: number,
  scene: BABYLON.Scene
) => {
  let temp = burstLength;
  const cellSize = 1;
  let positionY = 4.5;
  let i = 0

  while (temp) {
    

    const sphereMaterial = new BABYLON.StandardMaterial("material", scene);
      sphereMaterial.diffuseColor = new BABYLON.Color3(
        ...calculatedRgb[i]
      );

    

    let sphere = BABYLON.MeshBuilder.CreateSphere(
      `Sphere`,
      {diameter: cellSize*0.8 },
      scene
    );
    sphere.material = sphereMaterial;

    sphere.position.x = positionX;
    sphere.position.y = positionY;

    temp--;
    positionY--;
    i++;
  }
};


const reArrangeSphere = (
  burstStartPosition: {
    x: number;
    y: number;
  },
  burstLength: number,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {

  console.log("Length", burstLength);

  // initializing a variable which will store the value of position of the first adjacent sphere present above the burst
  let nextSpherePosition = { x: 0, y: 0 };
  nextSpherePosition.x = burstStartPosition.x;
  nextSpherePosition.y = burstStartPosition.y;
  nextSpherePosition.y += burstLength;

  // running the loop till the boundary of the grid which we know it's 4.5 
  while (nextSpherePosition.y <= 4.5) {
    console.log(nextSpherePosition.y);

    //getting absolute position from the relative position of the grid
    const position = getPosition(
      nextSpherePosition.x,
      nextSpherePosition.y,
      scene,
      engine
    );
    console.log(position.x, position.y);

    //picking the mesh or sphere with absolute position just calculated
    const pickedSphere = scene.pick(position.x, position.y).pickedMesh;

    //if  the sphere is picked then displace the corresponding sphere to the gap
    if (pickedSphere) {
      pickedSphere.position.y -= burstLength;
    }
    
    // pointing to next gap
    burstStartPosition.y += 1;
    //pointing to next sphere to be displaced
    nextSpherePosition.y += 1;
  }

  // creating new spheres and adding them to the new places 
  addNewSpheres(nextSpherePosition.x, burstLength, scene);
};


const burstSphere = (
  pickedSphere: BABYLON.AbstractMesh,
  direction: string,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine,
  stop: boolean
) => {

  // initializing an array which will store all the spheres matching the picked sphere in Y direction or vertical direction  
  let indexesY: Array<BABYLON.AbstractMesh> = [];


  // it will first match and then store the spheres matching the picked sphere into indexesY array
  countAdjacent(pickedSphere, indexesY, direction, scene, engine);

  console.log("Y", indexesY.length);

 // if there are 3 or more spheres lying adjacent then only burst
 if (indexesY.length >= 3) {
    console.log("burst y");

    // number of spheres we need to delete or burst 
    const burstLength = indexesY.length;

    // calculating the position of sphere with the lowest y value
    const burstStartPosition = { x: 4.5, y: 4.5 };
    for (let i = 0; i < burstLength; i++) {
      if (indexesY[i].position.y < burstStartPosition.y) {
        burstStartPosition.x = indexesY[i].position.x;
        burstStartPosition.y = indexesY[i].position.y;
      }
    }

    console.log(burstStartPosition);

    // freeing up the space from memory of all the spheres that we want to burst 
    indexesY.forEach((item) => {
      item.dispose();
    });

    // reArranging or displacing all the spheres located above the burst location to the location where spheres are removed
    // with the help of burstLength and BurstStartPosition
    reArrangeSphere(burstStartPosition, burstLength, scene, engine);
   
  } 
};

// event which triggers when the click of mouse is pressed
const handleMouseDown = (event: MouseEvent, scene: BABYLON.Scene) => {
  isMouseDown = true;

  // getting the absolute position of mouse
  console.log(scene.pointerX, scene.pointerY);

  // picking the sphere on which we have clicked by giving absolute position from the mouse pointer's position
  pickedSphearMesh = scene.pick(scene.pointerX, scene.pointerY).pickedMesh;

  // caching the absolute position and relative position in initial Cord for future use
  intialCord.x = pickedSphearMesh?.position.x as number;
  intialCord.y = pickedSphearMesh?.position.y as number;
  intialCord.pointerX = scene.pointerX;
  intialCord.pointerY = scene.pointerY;

  if (pickedSphearMesh) console.log(pickedSphearMesh);
};

// event which triggers when thee click of the mouse is released
const handleMouseUp = (event: MouseEvent, scene: BABYLON.Scene , engine: BABYLON.Engine) => {

  // if picked sphere is present 
  if (pickedSphearMesh) {

    // get the cached sphere's location on which we had clicked earlier from initial Cord
    pickedSphearMesh.position.x = intialCord.x;
    pickedSphearMesh.position.y = intialCord.y;
    isMouseDown = false;

    // getting the sphere's location which is present at the drop location of the picked sphere
    const dropedSphearMesh = scene.pick(scene.pointerX, scene.pointerY);

    if (
      dropedSphearMesh &&
      dropedSphearMesh.pickedPoint &&
      pickedSphearMesh &&
      pickedSphearMesh.position
    ) {
      // for the direction that we want exclude according to the movement of th sphere
      let direction = ""

      // for checking that the swipe done is towards bottom
      if (
        intialCord.y - thresholdPoint >=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("bottom swipe");

        // multi picking the spheres present at a particular position 
        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        console.log(multipicked?.map((v) => v.pickedMesh?.position));

        // if both of them picked then interchanging their position according to the swipe direction
        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            if (
              multipicked[0].pickedMesh.position.y <
              multipicked[1].pickedMesh.position.y
            ) {
              multipicked[0].pickedMesh.position.y += 1;
              multipicked[1].pickedMesh.position.y -= 1;
              direction = "top";
              // checking if we need to burst after the switch of the first sphere
              burstSphere(
                multipicked[0].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
              direction = "bottom";
              // checking if we need to burst after the switch of the second sphere
              burstSphere(
                multipicked[1].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
            } else {
              multipicked[1].pickedMesh.position.y += 1;
              multipicked[0].pickedMesh.position.y -= 1;
              direction = "top";
              burstSphere(
                multipicked[1].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
              direction = "bottom";
              burstSphere(
                multipicked[0].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
            }
          }
        }

      } else if (
        intialCord.y + thresholdPoint <=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("top swipe");
        // similar as bottom swipe

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            if (
              multipicked[0].pickedMesh.position.y >
              multipicked[1].pickedMesh.position.y
            ) {
              multipicked[0].pickedMesh.position.y -= 1;
              multipicked[1].pickedMesh.position.y += 1;
              direction = "bottom";
              burstSphere(
                multipicked[0].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
              direction = "top";
              burstSphere(
                multipicked[1].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
            } else {
              multipicked[1].pickedMesh.position.y -= 1;
              multipicked[0].pickedMesh.position.y += 1;
              direction = "bottom";
              burstSphere(
                multipicked[1].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
              direction = "top";
              burstSphere(
                multipicked[0].pickedMesh,
                direction,
                scene,
                engine,
                true
              );
            }
          }
        }
        
      }
    }
    return;
  }

  isMouseDown = false;
};

const handleMouseMove = (event: MouseEvent, scene: BABYLON.Scene) => {
  if (isMouseDown) {
    const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    // constantly changing the position of the picked sphere to see it live on the screen while we have clicked and it has picked the sphere
    if (pickInfo.hit && pickedSphearMesh?.position && pickInfo.pickedPoint) {
      if (
        pickedSphearMesh &&
        Math.abs(pickInfo.pickedPoint.x - intialCord.x) <= 1 &&
        Math.abs(pickInfo.pickedPoint.y - intialCord.y) <= 1
      ) {
        pickedSphearMesh.position.x = pickInfo.pickedPoint.x;
        pickedSphearMesh.position.y = pickInfo.pickedPoint.y;
      }
    }
  }
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && !isInit) {
      isInit = true;

      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });

      const scene = createScene(engine, canvasRef.current);

      // run the render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // the canvas/window resize event handler
      window.addEventListener("resize", function () {
        engine.resize();
      });

      canvasRef.current.addEventListener("pointerdown", (e) =>
        handleMouseDown(e, scene)
      );

      canvasRef.current.addEventListener("pointermove", (e) => {
        handleMouseMove(e, scene);
      });

      canvasRef.current.addEventListener("pointerup", (e) =>
        handleMouseUp(e, scene, engine)
      );
    }
  }, []);

  return (
    <div className="App">
      {/* <div>Babylon js</div> */}
      <canvas style={{ width: "100%" }} ref={canvasRef} />
    </div>
  );
}

export default App;
