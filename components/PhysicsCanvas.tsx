
import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { PhysicsObject, ObjectType, BodiesState, PhysicsCanvasHandle, CameraViewPreset, GizmoMode, Vector3 as AppVector3, UpdatableCannonObjectFields, SimulationStatus } from '../types';

// CANNON is not used here but often is in physics related files. It's declared globally in types.ts

const LOG_PREFIX = "[PhysicsCanvas]";

interface PhysicsCanvasProps {
  objects: PhysicsObject[];
  bodiesState: BodiesState;
  onSelectObject: (id: string | null) => void;
  selectedObjectId: string | null;
  gizmoMode: GizmoMode;
  simulationStatus: SimulationStatus;
  onUpdateObjectFromGizmo: (id: string, updates: UpdatableCannonObjectFields) => void;
}

const PhysicsCanvas: React.ForwardRefRenderFunction<PhysicsCanvasHandle, PhysicsCanvasProps> = 
  ({ objects, bodiesState, onSelectObject, selectedObjectId, gizmoMode, simulationStatus, onUpdateObjectFromGizmo }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Record<string, THREE.Mesh>>({}); 
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  
  const transformControlsRef = useRef<TransformControls | null>(null);

  useImperativeHandle(ref, () => ({
    focusOnObject: (targetPosition: { x: number; y: number; z: number }) => { // Updated type
      if (!cameraRef.current || !controlsRef.current) return;
      const targetPosVec3 = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
      console.log(LOG_PREFIX, `Focusing on object at:`, targetPosVec3);
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const offset = new THREE.Vector3();
      // Calculate offset from current controls.target to camera.position
      offset.subVectors(camera.position, controls.target);
      
      controls.target.copy(targetPosVec3);
      camera.position.copy(targetPosVec3).add(offset); // Apply same offset from new target
      controls.update();
    },
    setCameraView: (view: CameraViewPreset) => {
      if (!cameraRef.current || !controlsRef.current) return;
      console.log(LOG_PREFIX, `Setting camera view to: ${view}`);
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const sceneCenter = new THREE.Vector3(0, 1, 0); 
      const distance = 20;

      switch (view) {
        case 'top':
          camera.position.set(sceneCenter.x, sceneCenter.y + distance, sceneCenter.z + 0.1); // Slight Z offset for better top view
          controls.target.set(sceneCenter.x, sceneCenter.y, sceneCenter.z);
          break;
        case 'front':
          camera.position.set(sceneCenter.x, sceneCenter.y + 2, sceneCenter.z + distance);
          controls.target.set(sceneCenter.x, sceneCenter.y, sceneCenter.z);
          break;
        case 'side': 
          camera.position.set(sceneCenter.x + distance, sceneCenter.y + 2, sceneCenter.z);
          controls.target.set(sceneCenter.x, sceneCenter.y, sceneCenter.z);
          break;
      }
      camera.lookAt(controls.target); 
      controls.update();
    }
  }));

  const initThree = useCallback(() => {
    if (!mountRef.current) return;
    console.log(LOG_PREFIX, "Initializing Three.js scene");

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x4a5568); // Changed from 0x2d3748 (bg-gray-700) to 0x4a5568 (bg-gray-600)

    cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current.position.set(0, 5, 15);
    cameraRef.current.lookAt(0,0,0);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.shadowMap.enabled = true;
    mountRef.current.appendChild(rendererRef.current.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly increased ambient light
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Slightly increased directional light
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.target.set(0, 1, 0); 

    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // TransformControls (Gizmo)
    transformControlsRef.current = new TransformControls(cameraRef.current, rendererRef.current.domElement);
    transformControlsRef.current.addEventListener('dragging-changed', (event: any) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = !event.value; // Disable OrbitControls while dragging gizmo
      }
    });
    transformControlsRef.current.addEventListener('mouseUp', () => { 
      if (transformControlsRef.current && transformControlsRef.current.object && selectedObjectId) {
        const object = transformControlsRef.current.object as THREE.Mesh; // Cast to Mesh
        const newPosition: AppVector3 = { x: object.position.x, y: object.position.y, z: object.position.z };
        
        const euler = new THREE.Euler().setFromQuaternion(object.quaternion, 'XYZ');
        const newRotation: AppVector3 = {
          x: THREE.MathUtils.radToDeg(euler.x),
          y: THREE.MathUtils.radToDeg(euler.y),
          z: THREE.MathUtils.radToDeg(euler.z),
        };
        console.log(LOG_PREFIX, `Gizmo mouseUp: obj ID ${selectedObjectId}, mesh pos: ${JSON.stringify(newPosition)}, mesh quat (euler deg): ${JSON.stringify(newRotation)}`);
        onUpdateObjectFromGizmo(selectedObjectId, { position: newPosition, rotation: newRotation });
      }
    });
    sceneRef.current.add(transformControlsRef.current);


    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x5a6578, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.8 }); // Lightened ground as well
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundMesh.userData.id = 'ground'; 
    sceneRef.current.add(groundMesh);
    meshesRef.current['ground'] = groundMesh;


    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      console.log(LOG_PREFIX, "Cleaning up Three.js scene");
      window.removeEventListener('resize', handleResize);
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
      }

      if (mountRef.current && rendererRef.current && rendererRef.current.domElement) {
        if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      Object.values(meshesRef.current).forEach((mesh: THREE.Mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            const material = mesh.material as THREE.Material; // Generic material
            if (Array.isArray(material)) {
                 (material as THREE.Material[]).forEach((m: THREE.Material) => m.dispose && m.dispose());
            } else {
                 material.dispose && material.dispose();
            }
        }
      });
      meshesRef.current = {};
    };
  }, [onUpdateObjectFromGizmo]); 

  useEffect(initThree, [initThree]);

  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (transformControlsRef.current && transformControlsRef.current.dragging) {
      console.log(LOG_PREFIX, "Canvas click ignored: Gizmo is dragging.");
      return; 
    }
    if (!mountRef.current || !cameraRef.current || !sceneRef.current || !raycasterRef.current || !mouseRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(Object.values(meshesRef.current).filter(m => m.userData.id !== 'ground'), true); 

    let clickedObjectId: string | null = null;
    if (intersects.length > 0) {
      let selectedMesh = null;
      for (const intersect of intersects) {
          if (intersect.object.userData.id && intersect.object.userData.id !== 'ground') {
              selectedMesh = intersect.object;
              break;
          }
      }
      if (selectedMesh) {
        clickedObjectId = selectedMesh.userData.id;
      }
    }
    console.log(LOG_PREFIX, `Canvas click: intersected ID ${clickedObjectId}`);
    onSelectObject(clickedObjectId);
  }, [onSelectObject]);

  useEffect(() => {
    const canvasElement = mountRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('click', handleCanvasClick as EventListener);
    }
    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('click', handleCanvasClick as EventListener);
      }
    };
  }, [handleCanvasClick]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const currentMeshIds = Object.keys(meshesRef.current).filter(id => id !== 'ground');
    const objectIds = objects.map(obj => obj.id);

    currentMeshIds.forEach(id => {
      if (!objectIds.includes(id)) {
        const meshToRemove = meshesRef.current[id];
        if (meshToRemove) {
          console.log(LOG_PREFIX, `Removing mesh for ID: ${id}`);
          if (transformControlsRef.current && transformControlsRef.current.object === meshToRemove) {
            console.log(LOG_PREFIX, `Detaching gizmo from removed mesh ID: ${id}`);
            transformControlsRef.current.detach(); 
          }
          sceneRef.current?.remove(meshToRemove); 
          if (meshToRemove.geometry) meshToRemove.geometry.dispose();
          
          const material = meshToRemove.material as THREE.Material; // Generic material
          if (material) {
             if (Array.isArray(material)) {
                (material as THREE.Material[]).forEach((m: THREE.Material) => m.dispose && m.dispose());
             } else if (material && material.dispose) {
                material.dispose();
             }
          }
          delete meshesRef.current[id];
        }
      }
    });

    objects.forEach(obj => {
      let mesh = meshesRef.current[obj.id];
      const props = obj.properties;
      const isNewMesh = !mesh;

      if (isNewMesh) {
        console.log(LOG_PREFIX, `Creating new mesh for ID: ${obj.id}, type: ${obj.type}, target initial obj.position: ${JSON.stringify(obj.position)}`);
        let geometry: THREE.BufferGeometry;
        const material = new THREE.MeshStandardMaterial({ 
            color: obj.color,
            metalness: props.metalness ?? 0.5,
            roughness: props.roughness ?? 0.5,
        });

        switch (obj.type) {
          case ObjectType.SPHERE:
            geometry = new THREE.SphereGeometry(props.radius || 1, 32, 16);
            break;
          case ObjectType.BOX:
            const size = props.size || { x: 1, y: 1, z: 1 };
            geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            break;
          case ObjectType.CYLINDER:
            geometry = new THREE.CylinderGeometry(
              props.radiusTop ?? 1, 
              props.radiusBottom ?? 1, 
              props.height ?? 1, 
              Math.max(8, props.numSegments ?? 16)
            );
            break;
          case ObjectType.CONE:
            geometry = new THREE.ConeGeometry(
              props.radius ?? 1, // Base radius
              props.height ?? 1,
              Math.max(8, props.numSegments ?? 16)
            );
            break;
          case ObjectType.CAPSULE:
            geometry = new THREE.CapsuleGeometry(
              props.radius ?? 0.5,
              props.height ?? 1, 
              8, 
              16 
            );
            break;
          case ObjectType.TORUS:
            geometry = new THREE.TorusGeometry(
              props.radius ?? 1, 
              props.tube ?? 0.4, 
              Math.max(8, props.radialSegments ?? 16),
              Math.max(16, props.tubularSegments ?? 32)
            );
            break;
          default:
            console.warn(LOG_PREFIX, `Unsupported object type for mesh creation: ${obj.type}`);
            return; 
        }
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData.id = obj.id; 
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(obj.rotation.x),
          THREE.MathUtils.degToRad(obj.rotation.y),
          THREE.MathUtils.degToRad(obj.rotation.z),
          'XYZ'
        );
        mesh.quaternion.setFromEuler(euler);
        mesh.updateMatrixWorld(true); 
        
        sceneRef.current?.add(mesh); 
        meshesRef.current[obj.id] = mesh;
      } else { 
        const existingMaterial = mesh.material as THREE.MeshStandardMaterial;
        let materialChanged = false;
        if (existingMaterial.color.getHexString() !== obj.color.substring(1)) {
             existingMaterial.color.set(obj.color);
             materialChanged = true;
        }
        if (existingMaterial.metalness !== (props.metalness ?? 0.5)) {
            existingMaterial.metalness = props.metalness ?? 0.5;
            materialChanged = true;
        }
        if (existingMaterial.roughness !== (props.roughness ?? 0.5)) {
            existingMaterial.roughness = props.roughness ?? 0.5;
            materialChanged = true;
        }
        if(materialChanged) existingMaterial.needsUpdate = true;
        
        let geometryChanged = false;
        const geomParams = (mesh.geometry as any).parameters; 

        if (obj.type === ObjectType.SPHERE && props.radius) {
            if (geomParams.radius !== props.radius) {
                mesh.geometry.dispose(); mesh.geometry = new THREE.SphereGeometry(props.radius, 32, 16); geometryChanged = true;
            }
        } else if (obj.type === ObjectType.BOX && props.size) {
            const s = props.size;
            if (geomParams.width !== s.x || geomParams.height !== s.y || geomParams.depth !== s.z) {
                 mesh.geometry.dispose(); mesh.geometry = new THREE.BoxGeometry(s.x, s.y, s.z); geometryChanged = true;
            }
        } else if (obj.type === ObjectType.CYLINDER) {
            const newValues = {rt: props.radiusTop??1, rb:props.radiusBottom??1, h:props.height??1, ns:Math.max(8,props.numSegments??16)};
            if (geomParams.radiusTop !== newValues.rt || geomParams.radiusBottom !== newValues.rb || geomParams.height !== newValues.h || geomParams.radialSegments !== newValues.ns) {
                  mesh.geometry.dispose(); mesh.geometry = new THREE.CylinderGeometry(newValues.rt, newValues.rb, newValues.h, newValues.ns); geometryChanged = true;
            }
        } else if (obj.type === ObjectType.CONE) {
            const newValues = {r: props.radius??1, h:props.height??1, ns:Math.max(8,props.numSegments??16)};
            if (geomParams.radius !== newValues.r || geomParams.height !== newValues.h || geomParams.radialSegments !== newValues.ns) {
                mesh.geometry.dispose(); mesh.geometry = new THREE.ConeGeometry(newValues.r, newValues.h, newValues.ns); geometryChanged = true;
            }
        } else if (obj.type === ObjectType.CAPSULE) {
             const newValues = {r: props.radius??0.5, h:props.height??1, cs: 8, rs: 16}; 
            if (geomParams.radius !== newValues.r || geomParams.length !== newValues.h ) {
                mesh.geometry.dispose(); mesh.geometry = new THREE.CapsuleGeometry(newValues.r, newValues.h, newValues.cs, newValues.rs); geometryChanged = true;
            }
        } else if (obj.type === ObjectType.TORUS) {
            const newValues = {r: props.radius??1, t:props.tube??0.4, rs:Math.max(8,props.radialSegments??16), ts:Math.max(16,props.tubularSegments??32)};
            if (geomParams.radius !== newValues.r || geomParams.tube !== newValues.t || geomParams.radialSegments !== newValues.rs || geomParams.tubularSegments !== newValues.ts) {
                mesh.geometry.dispose(); mesh.geometry = new THREE.TorusGeometry(newValues.r, newValues.t, newValues.rs, newValues.ts); geometryChanged = true;
            }
        }

        if (geometryChanged && transformControlsRef.current && transformControlsRef.current.object === mesh) {
           transformControlsRef.current.detach(); 
        }
      }
      
      if (simulationStatus === 'stopped') {
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(obj.rotation.x),
          THREE.MathUtils.degToRad(obj.rotation.y),
          THREE.MathUtils.degToRad(obj.rotation.z),
          'XYZ'
        );
        mesh.quaternion.setFromEuler(euler);
        mesh.updateMatrixWorld(true);
      }
    });

    if (transformControlsRef.current) {
        const shouldAttachGizmo = selectedObjectId && gizmoMode && simulationStatus !== 'playing';
        const currentGizmoObject = transformControlsRef.current.object;
        const targetMesh = selectedObjectId ? meshesRef.current[selectedObjectId] : null;

        if (shouldAttachGizmo && targetMesh) {
            if (currentGizmoObject !== targetMesh) {
                transformControlsRef.current.attach(targetMesh);
            }
            if (transformControlsRef.current.mode !== gizmoMode) { 
                 transformControlsRef.current.setMode(gizmoMode as "translate" | "rotate");
            }
            transformControlsRef.current.visible = true;
            transformControlsRef.current.enabled = true;
            targetMesh.updateMatrixWorld(true);
            transformControlsRef.current.updateMatrixWorld(true);
        } else { 
            if (currentGizmoObject) {
                transformControlsRef.current.detach();
            }
            transformControlsRef.current.visible = false;
            transformControlsRef.current.enabled = false;
        }
    }
    
    if (controlsRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        setTimeout(() => {
            if (controlsRef.current) { controlsRef.current.update(); }
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        }, 0);
    }

  }, [objects, gizmoMode, selectedObjectId, simulationStatus, onUpdateObjectFromGizmo]);


  useEffect(() => {
    Object.values(meshesRef.current).forEach((mesh: THREE.Mesh) => {
        if (mesh.userData.id === 'ground' || !mesh.material ) return;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (!material.emissive) return;
        
        const isSelected = mesh.userData.id === selectedObjectId;
        const currentEmissive = material.emissive.getHex();
        const targetEmissive = isSelected ? 0x00f0ff : 0x000000;
        
        if (currentEmissive !== targetEmissive) {
            material.emissive.setHex(targetEmissive); 
            material.emissiveIntensity = isSelected ? 0.5 : 0;
            material.needsUpdate = true;
        }
    });
  }, [selectedObjectId, objects]); 

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update(); 

      if (simulationStatus === 'playing' || simulationStatus === 'paused') {
        Object.entries(bodiesState).forEach(([id, state]) => {
          const mesh = meshesRef.current[id];
          if (mesh && (!transformControlsRef.current?.dragging || transformControlsRef.current?.object !== mesh)) {
            mesh.position.copy(state.position as THREE.Vector3Like);
            mesh.quaternion.copy(state.quaternion as THREE.QuaternionLike);
          }
        });
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    if (rendererRef.current) { 
        animate();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bodiesState, simulationStatus]); 

  return <div ref={mountRef} className="flex-grow h-full bg-gray-600 cursor-grab active:cursor-grabbing" />;
};

export default forwardRef(PhysicsCanvas);

