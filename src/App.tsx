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
  return scene;
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

const handleMouseUp = (event: MouseEvent, scene: BABYLON.Scene) => {
  if (pickedSphearMesh) {
    pickedSphearMesh.position.x = intialCord.x;
    pickedSphearMesh.position.y = intialCord.y;
    isMouseDown = false;

    const dropedSphearMesh = scene.pick(scene.pointerX, scene.pointerY);

    if (
      dropedSphearMesh &&
      dropedSphearMesh.pickedPoint &&
      pickedSphearMesh &&
      pickedSphearMesh.position
    ) {
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
            } else {
              multipicked[1].pickedMesh.position.x += 1;
              multipicked[0].pickedMesh.position.x -= 1;
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
            } else {
              multipicked[1].pickedMesh.position.y += 1;
              multipicked[0].pickedMesh.position.y -= 1;
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
            } else {
              multipicked[1].pickedMesh.position.x -= 1;
              multipicked[0].pickedMesh.position.x += 1;
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
            } else {
              multipicked[1].pickedMesh.position.y -= 1;
              multipicked[0].pickedMesh.position.y += 1;
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
