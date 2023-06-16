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

      // if (row === 0 && col === 0) {
      //   console.log(
      //     "sphere.position.x, sphere.position.y",
      //     sphere.position.x,
      //     sphere.position.y
      //   );
      // }

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

const getScreenSpaceCords = (
  x: number,
  y: number,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  // Assuming you have a Babylon.js scene and a Vector3 position object
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

const checkMatchIn = (
  direction: "left" | "right" | "top" | "bottom",
  currentMesh: BABYLON.AbstractMesh,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  const currentMeshCoror = (currentMesh.material as BABYLON.StandardMaterial)
    .diffuseColor;

  const matchedMashes = [currentMesh];
  const meshIds = [currentMesh.id];

  let refX: number = currentMesh.position.x,
    refY = currentMesh.position.y;

  if (direction === "left") {
    refX = currentMesh.position.x - 1;
  } else if (direction === "right") {
    refX = currentMesh.position.x + 1;
  } else if (direction === "top") {
    refY = currentMesh.position.y + 1;
  } else if (direction === "bottom") {
    refY = currentMesh.position.y - 1;
  }

  while (1) {
    const cords = getScreenSpaceCords(refX, refY, scene, engine);

    const neighbourMesh = scene.pick(cords.x, cords.y).pickedMesh;

    if (!neighbourMesh) {
      break;
    }

    const neighbourMeshColor = (
      neighbourMesh.material as BABYLON.StandardMaterial
    ).diffuseColor;

    if (
      currentMeshCoror.r !== neighbourMeshColor.r &&
      currentMeshCoror.g !== neighbourMeshColor.b &&
      currentMeshCoror.b !== neighbourMeshColor.b
    ) {
      break;
    }

    if (!meshIds.includes(neighbourMesh.id)) {
      matchedMashes.push(neighbourMesh);
    } else {
      break;
    }

    if (direction === "left") {
      refX -= 1;
    } else if (direction === "right") {
      refX += 1;
    } else if (direction === "top") {
      refY += 1;
    } else if (direction === "bottom") {
      refY -= 1;
    }
  }

  return matchedMashes;
};

const reArrangeY = (
  cords: { x: number; y: number }[],
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  if (!cords.length) return;
  let maxY = cords[0].y + 1;

  while (maxY <= 4.5) {
    const meshPosition = getScreenSpaceCords(cords[0].x, maxY, scene, engine);
    const pickedMesh = scene.pick(meshPosition.x, meshPosition.y).pickedMesh;

    if (pickedMesh) {
      pickedMesh.position.y -= cords.length;
    }
    maxY += 1;
  }
};

let isMouseDown: boolean = false;
const thresholdPoint = 0.4;

let pickedSphearMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
let isInit: boolean = false;
const intialCord = { x: 0, y: 0, pointerX: 0, pointerY: 0 };

const handleMouseDown = (event: MouseEvent, scene: BABYLON.Scene) => {
  isMouseDown = true;

  pickedSphearMesh = scene.pick(scene.pointerX, scene.pointerY).pickedMesh;

  intialCord.x = pickedSphearMesh?.position.x as number;
  intialCord.y = pickedSphearMesh?.position.y as number;

  intialCord.pointerX = scene.pointerX;
  intialCord.pointerY = scene.pointerY;
};

const handleMouseUp = (
  event: MouseEvent,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
) => {
  if (pickedSphearMesh) {
    pickedSphearMesh.position.x = intialCord.x;
    pickedSphearMesh.position.y = intialCord.y;
    isMouseDown = false;

    const dropedSphearMesh = scene.pick(scene.pointerX, scene.pointerY);

    let mesh1: BABYLON.Nullable<BABYLON.AbstractMesh> = null,
      mesh2: BABYLON.Nullable<BABYLON.AbstractMesh> = null;

    if (
      dropedSphearMesh &&
      dropedSphearMesh.pickedPoint &&
      pickedSphearMesh &&
      pickedSphearMesh.position
    ) {
      if (intialCord.x + thresholdPoint <= dropedSphearMesh.pickedPoint.x) {
        console.log("right swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        // console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            const idx1: number =
              multipicked[0].pickedMesh.position.x <
              multipicked[1].pickedMesh.position.x
                ? 0
                : 1;

            const idx2: number = idx1 === 1 ? 0 : 1;

            mesh1 = multipicked[idx1].pickedMesh;
            mesh2 = multipicked[idx2].pickedMesh;

            if (mesh1 && mesh2) {
              mesh1.position.x += 1;
              mesh2.position.x -= 1;
            }
          }
        }
      } else if (
        intialCord.y - thresholdPoint >=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("bottom swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        // console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            const idx1: number =
              multipicked[0].pickedMesh.position.y <
              multipicked[1].pickedMesh.position.y
                ? 0
                : 1;

            const idx2: number = idx1 === 1 ? 0 : 1;

            mesh1 = multipicked[idx1].pickedMesh;
            mesh2 = multipicked[idx2].pickedMesh;

            if (mesh1 && mesh2) {
              mesh1.position.y += 1;
              mesh2.position.y -= 1;
            }
          }
        }
      } else if (
        intialCord.x - thresholdPoint >=
        dropedSphearMesh.pickedPoint.x
      ) {
        console.log("left swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        // console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            const idx1: number =
              multipicked[0].pickedMesh.position.x >
              multipicked[1].pickedMesh.position.x
                ? 0
                : 1;

            const idx2 = idx1 === 1 ? 0 : 1;

            mesh1 = multipicked[idx1].pickedMesh;
            mesh2 = multipicked[idx2].pickedMesh;

            if (mesh1 && mesh2) {
              mesh1.position.x -= 1;
              mesh2.position.x += 1;
            }
          }
        }
      } else if (
        intialCord.y + thresholdPoint <=
        dropedSphearMesh.pickedPoint.y
      ) {
        console.log("top swipe");

        const multipicked = scene.multiPick(scene.pointerX, scene.pointerY);
        // console.log(multipicked?.map((v) => v.pickedMesh?.position));

        if (multipicked?.length === 2) {
          if (multipicked[0].pickedMesh && multipicked[1].pickedMesh) {
            const idx1: number =
              multipicked[0].pickedMesh.position.y >
              multipicked[1].pickedMesh.position.y
                ? 0
                : 1;

            const idx2 = idx1 === 1 ? 0 : 1;

            mesh1 = multipicked[idx1].pickedMesh;
            mesh2 = multipicked[idx2].pickedMesh;

            if (mesh1 && mesh2) {
              mesh1.position.y -= 1;
              mesh2.position.y += 1;
            }
          }
        }
      }
    }

    if (mesh1 && mesh2) {
      // /* find match */
      // const rightMatches = checkMatchIn("right", mesh1, scene, engine);

      // const leftMatches = checkMatchIn("left", mesh2, scene, engine);

      // const rightBottomMatches = checkMatchIn("bottom", mesh1, scene, engine);

      // const leftBottomMatches = checkMatchIn("bottom", mesh2, scene, engine);

      // const rightTopMatches = checkMatchIn("top", mesh1, scene, engine);

      // const leftTopMatches = checkMatchIn("top", mesh2, scene, engine);

      const mesh1LeftMatches = checkMatchIn(
        "left",
        mesh1,
        scene,
        engine
      ).filter((mesh) => mesh.id !== (mesh1 as BABYLON.AbstractMesh).id);
      const mesh2LeftMatches = checkMatchIn(
        "left",
        mesh2,
        scene,
        engine
      ).filter((mesh) => mesh.id !== (mesh2 as BABYLON.AbstractMesh).id);

      const mesh1RightMatches = checkMatchIn("right", mesh1, scene, engine);
      const mesh2RightMatches = checkMatchIn("right", mesh2, scene, engine);

      const mesh1TopMatches = checkMatchIn("top", mesh1, scene, engine).filter(
        (mesh) => mesh.id !== (mesh1 as BABYLON.AbstractMesh).id
      );
      const mesh2TopMatches = checkMatchIn("top", mesh2, scene, engine).filter(
        (mesh) => mesh.id !== (mesh2 as BABYLON.AbstractMesh).id
      );

      const mesh1BottomMatches = checkMatchIn("bottom", mesh1, scene, engine);
      const mesh2BottomMatches = checkMatchIn("bottom", mesh2, scene, engine);

      const emptyCordsX: { x: number; y: number }[] = [];
      const emptyCordsY: { x: number; y: number }[] = [];

      if ([...mesh1BottomMatches, ...mesh1TopMatches].length >= 3) {
        for (const currentMesh of [...mesh1BottomMatches, ...mesh1TopMatches]) {
          emptyCordsY.push({
            x: currentMesh.position.x,
            y: currentMesh.position.y,
          });
          currentMesh.dispose();
        }
      }

      if ([...mesh2BottomMatches, ...mesh2TopMatches].length >= 3) {
        for (const currentMesh of [...mesh2BottomMatches, ...mesh2TopMatches]) {
          emptyCordsY.push({
            x: currentMesh.position.x,
            y: currentMesh.position.y,
          });
          currentMesh.dispose();
        }
      }

      if ([...mesh1LeftMatches, ...mesh1RightMatches].length >= 3) {
        for (const currentMesh of [...mesh1LeftMatches, ...mesh1RightMatches]) {
          emptyCordsX.push({
            x: currentMesh.position.x,
            y: currentMesh.position.y,
          });
          currentMesh.dispose();
        }
      }

      if ([...mesh2LeftMatches, ...mesh2RightMatches].length >= 3) {
        for (const currentMesh of [...mesh2LeftMatches, ...mesh2RightMatches]) {
          emptyCordsX.push({
            x: currentMesh.position.x,
            y: currentMesh.position.y,
          });
          currentMesh.dispose();
        }
      }

      console.log(emptyCordsY);

      reArrangeY(emptyCordsY, scene, engine);

      // for (const currentMesh of [
      //   ...mesh2VerticalMatches,
      //   ...mesh2BottomMatches,
      // ])
      //   currentMesh.dispose();

      // console.log({
      //   mesh1LeftMatches,
      //   mesh1RightMatches,
      //   mesh2LeftMatches,
      //   mesh2RightMatches,
      // });

      // console.log({
      //   mesh1TopMatches,
      //   mesh2TopMatches,
      //   mesh1BottomMatches,
      //   mesh2BottomMatches,
      // });
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
        if (
          Math.abs(pickInfo.pickedPoint.x - intialCord.x) >
          Math.abs(pickInfo.pickedPoint.y - intialCord.y)
        ) {
          pickedSphearMesh.position.x = pickInfo.pickedPoint.x;
          pickedSphearMesh.position.y = intialCord.y; // Locks the movement on the y-direction
        } else if (
          Math.abs(pickInfo.pickedPoint.x - intialCord.x) <
          Math.abs(pickInfo.pickedPoint.y - intialCord.y)
        ) {
          pickedSphearMesh.position.y = pickInfo.pickedPoint.y;
          pickedSphearMesh.position.x = intialCord.x; // Locks the movement on the x-direction
        }
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
