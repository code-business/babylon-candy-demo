import React, { useEffect, useRef } from "react";
// import { Scene, Engine } from "babylonjs";
import * as BABYLON from "babylonjs";
// import logo from './logo.svg';
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

      // sphere.actionManager = new BABYLON.ActionManager(scene);

      // const spherAction = new BABYLON.ExecuteCodeAction(
      //   BABYLON.ActionManager.on,
      //   () => {
      //     // Action to perform when the sphere is clicked
      //     console.log("Sphere clicked");
      //   }
      // );

      // sphere.actionManager.registerAction(spherAction);
    }
  }

  // Return the created scene
  return scene;
};

let startX: number,
  startY: number,
  endX: number,
  endY: number,
  isMouseDown: boolean = false;
const threshold = 30; // Minimum distance threshold for swipe gesture

let pickedSphearMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
let isInit: boolean = false;
const intialCord = { x: 0, y: 0 };

const handleMouseDown = (event: MouseEvent, scene: BABYLON.Scene) => {
  // event.preventDefault();
  // event.stopPropagation();

  isMouseDown = true;
  startX = event.clientX;
  startY = event.clientY;
  pickedSphearMesh = scene.pick(scene.pointerX, scene.pointerY).pickedMesh;
  intialCord.x = pickedSphearMesh?.position.x as number;
  intialCord.y = pickedSphearMesh?.position.y as number;
  if (pickedSphearMesh)
    console.log({ pickedSphearMesh: pickedSphearMesh.position });
};

const handleMouseUp = (event: MouseEvent, scene: BABYLON.Scene) => {
  // event.stopPropagation();
  // event.preventDefault();

  if (pickedSphearMesh) {
    pickedSphearMesh.position.x = intialCord.x;
    pickedSphearMesh.position.y = intialCord.y;
    isMouseDown = false;
    return;
  }

  // endX = event.clientX;
  // endY = event.clientY;

  // // console.log({ startX, startY, endX, endY });

  // const dropedSphearMesh = scene.pick(
  //   scene.pointerX,
  //   scene.pointerY
  // ).pickedMesh;

  // if (dropedSphearMesh)
  //   console.log({ dropedSphearMesh: dropedSphearMesh.position });

  // const deltaX = endX - startX;
  // const deltaY = endY - startY;

  // Determine the direction based on the deltaX and deltaY values

  // if (dropedSphearMesh !== null && pickedSphearMesh) {
  //   const tempPickedX = pickedSphearMesh.position.x,
  //     tempPickedY = pickedSphearMesh.position.y;

  //   pickedSphearMesh.position.set(
  //     dropedSphearMesh.position.x,
  //     dropedSphearMesh.position.y,
  //     0
  //   );

  //   dropedSphearMesh.position.set(tempPickedX, tempPickedY, 0);

  //   if (Math.abs(deltaX) > Math.abs(deltaY)) {
  //     if (deltaX > 0) {
  //       console.log("Swipe right");
  //     } else {
  //       console.log("Swipe left");
  //     }
  //   } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
  //     if (deltaY > 0) {
  //       console.log("Swipe down");
  //     } else {
  //       console.log("Swipe up");
  //     }
  //   }
  // }

  isMouseDown = false;
};

const handleMouseMove = (event: MouseEvent, scene: BABYLON.Scene) => {
  if (isMouseDown) {
    // console.log(scene.pointerX, scene.pointerY);
    const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    if ((pickInfo.hit && pickedSphearMesh?.position, pickInfo.pickedPoint)) {
      console.log(pickInfo.pickedPoint);

      if (pickedSphearMesh) {
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
        handleMouseUp(e, scene)
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
