import React, { useEffect, useRef } from "react";

import * as BABYLON from "babylonjs";

import "./App.css";

const rgbColors = [
  [235, 64, 52],
  [232, 107, 12],
  [222, 237, 9],
  [72, 242, 10],
  [7, 245, 221],
  [20, 43, 247],
  [167, 54, 247],
  [242, 27, 206],
];

const calculatedRgb = rgbColors.map((rgbArr) => rgbArr.map((n) => n / 255));

const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
  // Create a basic BJS Scene object
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0,
    0,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.setPosition(new BABYLON.Vector3(0, 0, -10));
  // camera.attachControl(canvas, true);

  new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(-1, 2, -2),
    scene
  );

  // zoom out
  camera.radius += 5;

  // Create the grid of spheres
  const gridSize = 10; // Number of cells in each row/column
  const cellSize = 1; // Size of each cell

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        `sphere-${row}${col}`,
        { diameter: cellSize * 0.8 },
        scene
      );

      // setting sphere position
      sphere.position.x = col * cellSize - (gridSize - 1) * cellSize * 0.5;
      sphere.position.y = row * cellSize - (gridSize - 1) * cellSize * 0.5;

      if (row === 0 && col === 0) {
        console.log(
          "sphere.position.x, sphere.position.y",
          sphere.position.x,
          sphere.position.y
        );
      }

      // setting sphere color
      const sphereMaterial = new BABYLON.StandardMaterial("material", scene);
      sphereMaterial.diffuseColor = new BABYLON.Color3(
        ...calculatedRgb[Math.floor(Math.random() * calculatedRgb.length)]
      );

      sphere.material = sphereMaterial;
    }
  }

  // Return the created scene
  return {scene,camera};
};

let isMouseDown: boolean = false;
const thresholdPoint = 0.8;

let pickedSphearMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
let isInit: boolean = false;
const intialCord = { x: 0, y: 0, pointerX: 0, pointerY: 0 };

const handleMouseDown = (event: MouseEvent, scene: BABYLON.Scene) => {
  isMouseDown = true;

  console.log(scene.pointerX, scene.pointerY);

  pickedSphearMesh = scene.pick(scene.pointerX, scene.pointerY).pickedMesh;
  intialCord.x = pickedSphearMesh?.position.x as number;
  intialCord.y = pickedSphearMesh?.position.y as number;
  intialCord.pointerX = scene.pointerX;
  intialCord.pointerY = scene.pointerY;

  if (pickedSphearMesh) console.log(pickedSphearMesh);
};

const getPosition = (
  x: number,
  y: number,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  const position = new BABYLON.Vector3(x, y, 0); // Your Vector3 position

  // Convert the world space position to screen space coordinates
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
  indexesX: Array<BABYLON.AbstractMesh>,
  indexesY: Array<BABYLON.AbstractMesh>,
  direction: string,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  const refMeshMaterialColor = (
    pickedSphere.material as BABYLON.StandardMaterial
  ).diffuseColor;

  let startX = pickedSphere.position.x;
  let startY = pickedSphere.position.y;

   let tempX = startX,
       tempY = startY

  indexesX.push(pickedSphere);
  indexesY.push(pickedSphere);

  // finding adjacent same colored bubble on right side of the switched bubble

  while (startX < 5 && direction!=="left") {
    startX++;
    const position = getPosition(startX, startY, scene, engine);
    const pickedMesh = scene.pick(position.x, position.y).pickedMesh;

      
      if(pickedMesh){
        const checkColor = (pickedMesh?.material as BABYLON.StandardMaterial)
        .diffuseColor;
        if (
          refMeshMaterialColor.r === checkColor.r &&
          refMeshMaterialColor.g === checkColor.g &&
          refMeshMaterialColor.b === checkColor.b
        ) {
          //console.log(pickedMesh);
          // console.log(pickedMesh?.position.x);
          indexesX.push(pickedMesh);
        } else {
          break;
        }
      }
      
    }
  

      startX = tempX-1

    //  finding adjacent same colored bubble on left side of the switched bubble

      while(startX>-5 && direction!=="right"){
        const position = getPosition(startX, startY , scene, engine)
        const pickedMesh = scene.pick(position.x,position.y).pickedMesh

        if(pickedMesh){
          const checkColor = (
            pickedMesh?.material as BABYLON.StandardMaterial
          ).diffuseColor;

          if(refMeshMaterialColor.r === checkColor.r && refMeshMaterialColor.g === checkColor.g && refMeshMaterialColor.b === checkColor.b){
            //console.log(pickedMesh?.position.x)
            indexesX.push(pickedMesh)
          }
          else{
            break;
          }
        }
        startX--
      }

      startX = tempX
      startY--

      while(startY>-5 && direction!=="top"){
        const position = getPosition(startX, startY , scene, engine)
        const pickedMesh = scene.pick(position.x,position.y).pickedMesh

        if(pickedMesh){
          const checkColor = (
            pickedMesh?.material as BABYLON.StandardMaterial
          ).diffuseColor;

          if(refMeshMaterialColor.r === checkColor.r && refMeshMaterialColor.g === checkColor.g && refMeshMaterialColor.b === checkColor.b){
            //console.log(pickedMesh?.position.x)
            indexesY.push(pickedMesh)
          }
          else{
            break;
          }
        }
        startY--
      }

      startY = tempY+1

      while(startY<5 && direction!=="bottom"){
        const position = getPosition(startX, startY , scene, engine)
        const pickedMesh = scene.pick(position.x,position.y).pickedMesh

        if(pickedMesh){
          const checkColor = (
            pickedMesh?.material as BABYLON.StandardMaterial
          ).diffuseColor;

          if(refMeshMaterialColor.r === checkColor.r && refMeshMaterialColor.g === checkColor.g && refMeshMaterialColor.b === checkColor.b){
            //console.log(pickedMesh?.position.x)
            indexesY.push(pickedMesh)
          }
          else{
            break;
          }
        }

        startY++
      }
};

const addNewSpheres = (
  positionX: number,
  burstLength: number,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  let temp = burstLength;
  const cellSize = 1;
  let positionY = 4.5

  while(temp){
    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere - {temp}`, { diameter: cellSize * 0.8 }, scene);
    const sphereMaterial = new BABYLON.StandardMaterial("material", scene);

    sphere.position.x = positionX
    sphere.position.y = positionY

    sphereMaterial.diffuseColor = new BABYLON.Color3(
      ...calculatedRgb[Math.floor(Math.random() * calculatedRgb.length)]
    );

    sphere.material = sphereMaterial;
    temp--
    positionY--
  }
}

const reArrangeSphere = (
  burstStartPosition: {
  x: number;
  y: number;
},
   burstLength: number,
   scene: BABYLON.Scene,
   engine: BABYLON.Engine,
   camera: BABYLON.ArcRotateCamera
    )=>{

    console.log("Length",burstLength)
    let nextSpherePosition = {x:0,y:0}
    nextSpherePosition.x = burstStartPosition.x
    nextSpherePosition.y = burstStartPosition.y
    nextSpherePosition.y += burstLength
    
      while(nextSpherePosition.y<5){

        console.log(nextSpherePosition.y)
        const position = getPosition(nextSpherePosition.x,nextSpherePosition.y,scene,engine)
        console.log(position.x,position.y)
        // const ray = scene.createPickingRay(position.x, position.y, BABYLON.Matrix.Identity(), camera);
        // const pickedSphere = scene.pickWithRay(ray)?.pickedMesh;
        const pickedSphere = scene.pick(position.x, position.y).pickedMesh
        if(pickedSphere){
         // console.log("newSphere location",pickedSphere.position.y)
          pickedSphere.position.y -= burstLength
          //console.log("new location" , pickedSphere.position.y)
        }
  
        burstStartPosition.y +=1
        nextSpherePosition.y +=1
      }

      addNewSpheres(nextSpherePosition.x, burstLength, scene, engine)

}

const burstSphere = (
  pickedSphere: BABYLON.AbstractMesh,
  direction: string,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine,
  camera: BABYLON.ArcRotateCamera
) => {
  let indexesX: Array<BABYLON.AbstractMesh> = [],
    indexesY: Array<BABYLON.AbstractMesh> = [];

  countAdjacent(pickedSphere, indexesX, indexesY, direction, scene, engine);

  console.log("X", indexesX.length);
  console.log("Y", indexesY.length)

  if(indexesX.length>=3 && indexesY.length>=3){
    console.log("pattern match both x and y")
    //console.log(indexesY.length)
    for(let i=0;i<indexesY.length;i++){
      if(pickedSphere.position.x===indexesY[i].position.x && pickedSphere.position.y===indexesY[i].position.y){
        console.log("correct place")
        indexesY.splice(i,1)
        break;
      }
    }

    indexesX.forEach((item)=>{
      //sleep(100)
      setTimeout(()=>{
        reArrangeSphere({x:item.position.x,y:item.position.y},1,scene,engine,camera)
      },1000)
      
      item.dispose()
    })

  
      const burstLength = indexesY.length
      const burstStartPosition = { x:4.5 , y:4.5 }
      for(let i=0;i<burstLength;i++){
        if(indexesY[i].position.y<burstStartPosition.y){
          burstStartPosition.x = indexesY[i].position.x
          burstStartPosition.y = indexesY[i].position.y
        }
      }
  
      indexesY.forEach((item)=>{
        item.dispose();
      })
  
      setTimeout(()=>{
        reArrangeSphere(burstStartPosition,burstLength,scene,engine,camera)
      },1500)
  
      return
   
    
  }

  if (indexesX.length >= 3 && indexesY.length<3) {
    //rearrage
    console.log("burst x");

    //sleep(3000)
    
    indexesX.forEach((item)=>{
      //sleep(100)
      setTimeout(()=>{
        reArrangeSphere({x:item.position.x,y:item.position.y},1,scene,engine,camera)
      },1000)
      
      item.dispose()
    })
  }
  if(indexesY.length >= 3 && indexesX.length<3){
    console.log("burst y");
    const burstLength = indexesY.length
    const burstStartPosition = { x:4.5 , y:4.5 }
    for(let i=0;i<burstLength;i++){
      if(indexesY[i].position.y<burstStartPosition.y){
        burstStartPosition.x = indexesY[i].position.x
        burstStartPosition.y = indexesY[i].position.y
      }
    }

    console.log(burstStartPosition)

    indexesY.forEach((item)=>{
      item.dispose();
    })

    setTimeout(()=>{
      reArrangeSphere(burstStartPosition,burstLength,scene,engine,camera)
    },500)

    

    
  }
};



const handleMouseUp = (
  event: MouseEvent,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine,
  camera: BABYLON.ArcRotateCamera
) => {
  if (pickedSphearMesh) {
    pickedSphearMesh.position.x = intialCord.x;
    pickedSphearMesh.position.y = intialCord.y;
    isMouseDown = false;

    const dropedSphearMesh = scene.pick(scene.pointerX, scene.pointerY);
    console.log(dropedSphearMesh);

    if (
      dropedSphearMesh &&
      dropedSphearMesh.pickedPoint &&
      pickedSphearMesh &&
      pickedSphearMesh.position
    ) {
      let direction = "";
      if (intialCord.x + thresholdPoint <= dropedSphearMesh.pickedPoint.x) {
        console.log("right swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            if (
              multipicked[0].pickedMesh.position.x <
              multipicked[1].pickedMesh.position.x
            ) {
              multipicked[0].pickedMesh.position.x += 1;
              multipicked[1].pickedMesh.position.x -= 1;
              //console.log(multipicked[0].pickedMesh.position.x)
              direction = "right"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine, camera);
              direction = "left"
              burstSphere(multipicked[1].pickedMesh, direction, scene, engine, camera);
            } else {
              multipicked[1].pickedMesh.position.x += 1;
              multipicked[0].pickedMesh.position.x -= 1;
              direction = "right"
              burstSphere(multipicked[1].pickedMesh, direction,  scene, engine,camera);
              direction = "left"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);
            }
          }
        }
      } else if (
        intialCord.y - thresholdPoint >=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("bottom swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            if (
              multipicked[0].pickedMesh.position.y <
              multipicked[1].pickedMesh.position.y
            ) {
              multipicked[0].pickedMesh.position.y += 1;
              multipicked[1].pickedMesh.position.y -= 1;
              //console.log(multipicked[0].pickedMesh.position.y);
              direction = "top"
              burstSphere(multipicked[0].pickedMesh,direction, scene, engine,camera);
              direction = "bottom"
              burstSphere(multipicked[1].pickedMesh,direction, scene, engine,camera);
            } else {
              multipicked[1].pickedMesh.position.y += 1;
              multipicked[0].pickedMesh.position.y -= 1;
              //console.log(multipicked[1].pickedMesh.position.y);
              direction = "top"
              burstSphere(multipicked[1].pickedMesh, direction, scene, engine,camera);
              direction = "bottom"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);
            }
          }
        }
      } else if (
        intialCord.x - thresholdPoint >=
        dropedSphearMesh.pickedPoint.x
      ) {
        console.log("left swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            if (
              multipicked[0].pickedMesh.position.x >
              multipicked[1].pickedMesh.position.x
            ) {
              multipicked[0].pickedMesh.position.x -= 1;
              multipicked[1].pickedMesh.position.x += 1;
              direction = "left"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);
              direction = "right"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);
            } else {
              multipicked[1].pickedMesh.position.x -= 1;
              multipicked[0].pickedMesh.position.x += 1;
              direction = "left"
              burstSphere(multipicked[1].pickedMesh,direction, scene, engine,camera);
              direction = "right"
              burstSphere(multipicked[0].pickedMesh,direction, scene, engine,camera);
            }
          }
        }
      } else if (
        intialCord.y + thresholdPoint <=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("top swipe");

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
              direction = "bottom"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);
              direction = "top"
              burstSphere(multipicked[1].pickedMesh, direction, scene, engine,camera);
            } else {
              multipicked[1].pickedMesh.position.y -= 1;
              multipicked[0].pickedMesh.position.y += 1;
              direction = "bottom"
              burstSphere(multipicked[1].pickedMesh, direction, scene, engine,camera);
              direction = "top"
              burstSphere(multipicked[0].pickedMesh, direction, scene, engine,camera);

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

      const {scene, camera} = createScene(engine, canvasRef.current);

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
        handleMouseUp(e, scene, engine,camera)
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
