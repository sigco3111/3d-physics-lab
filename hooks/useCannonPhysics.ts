
import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three'; // Import THREE
import { PhysicsObject, ObjectType, BodiesState, UpdatableCannonObjectFields, Vector3 as AppVector3, PhysicsConstraint, ConstraintType, SimulationStatus } from '../types';

// Declare CANNON as it is loaded via CDN (already in types.ts, but can be here too for explicitness if preferred)
declare var CANNON: any;

const useCannonPhysics = (
  initialObjects: PhysicsObject[], 
  simulationStatus: SimulationStatus, // Changed type from string to SimulationStatus
  globalGravity: AppVector3,
  simulationSpeed: number,
  initialConstraints?: PhysicsConstraint[]
) => {
  const worldRef = useRef<any | null>(null);
  const bodiesRef = useRef<Record<string, any>>({}); // Stores CANNON.Body instances, keyed by app object ID
  const constraintsRef = useRef<Record<string, any>>({}); // Stores CANNON.Constraint instances, keyed by app constraint ID
  
  const [bodiesState, setBodiesState] = useState<BodiesState>({});
  
  const animationFrameIdRef = useRef<number | null>(null);

  const bodiesStateForLoopRef = useRef<BodiesState>(bodiesState);
  useEffect(() => {
    bodiesStateForLoopRef.current = bodiesState;
  }, [bodiesState]);


  const vec3ToCannon = useCallback((v: AppVector3) => new CANNON.Vec3(v.x, v.y, v.z), []);

  useEffect(() => {
    const world = new CANNON.World();
    world.gravity.set(globalGravity.x, globalGravity.y, globalGravity.z);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    const defaultMaterial = new CANNON.Material("defaultMaterial");
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        { friction: 0.4, restitution: 0.2 }
    );
    world.addContactMaterial(defaultContactMaterial);
    world.defaultContactMaterial = defaultContactMaterial;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: defaultMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, 0, 0);
    world.addBody(groundBody);
    bodiesRef.current['ground'] = groundBody; 

    worldRef.current = world;

    return () => { 
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (worldRef.current) {
        Object.values(constraintsRef.current).forEach(constraint => worldRef.current.removeConstraint(constraint));
        Object.values(bodiesRef.current).forEach(body => worldRef.current.removeBody(body));
      }
      worldRef.current = null;
      bodiesRef.current = {};
      constraintsRef.current = {};
      setBodiesState({});
    };
  }, []); 

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.gravity.set(globalGravity.x, globalGravity.y, globalGravity.z);
      Object.values(bodiesRef.current).forEach((body: any) => body.wakeUp && body.wakeUp());
    }
  }, [globalGravity]);


  const createCannonBody = useCallback((obj: PhysicsObject): any => {
    let shape;
    const friction = obj.properties.friction >= 0 ? obj.properties.friction : 0.4;
    const restitution = obj.properties.restitution >= 0 ? obj.properties.restitution : 0.2;
    const material = new CANNON.Material({friction: friction, restitution: restitution });

    const body = new CANNON.Body({
      mass: obj.type === ObjectType.PLANE ? 0 : obj.properties.mass,
      position: vec3ToCannon(obj.position),
      material: material,
      velocity: vec3ToCannon(obj.properties.velocity),
      angularVelocity: vec3ToCannon(obj.properties.angularVelocity),
    });

    switch (obj.type) {
      case ObjectType.SPHERE:
        shape = new CANNON.Sphere(obj.properties.radius || 1);
        body.addShape(shape);
        break;
      case ObjectType.BOX:
        const size = obj.properties.size || { x: 1, y: 1, z: 1 };
        shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        body.addShape(shape);
        break;
      case ObjectType.CYLINDER:
        const { radiusTop = 1, radiusBottom = 1, height = 1, numSegments = 16 } = obj.properties;
        shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, Math.max(3, numSegments));
        body.addShape(shape);
        break;
      case ObjectType.CONE:
        const coneRadius = obj.properties.radius || 1; 
        const coneHeight = obj.properties.height || 1;
        const coneSegments = obj.properties.numSegments || 16;
        shape = new CANNON.Cylinder(0, coneRadius, coneHeight, Math.max(3, coneSegments));
        body.addShape(shape);
        break;
      case ObjectType.CAPSULE:
        const capsuleRadius = obj.properties.radius || 0.5;
        const capsuleHeight = obj.properties.height || 1; 
        
        const cylinderShape = new CANNON.Cylinder(capsuleRadius, capsuleRadius, capsuleHeight, Math.max(8, obj.properties.numSegments || 16));
        body.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0)); 

        const sphereShape = new CANNON.Sphere(capsuleRadius);
        body.addShape(sphereShape, new CANNON.Vec3(0, capsuleHeight / 2, 0)); 
        body.addShape(sphereShape, new CANNON.Vec3(0, -capsuleHeight / 2, 0)); 
        break;
      case ObjectType.TORUS:
        console.warn('[Physics] Torus physics is simplified to a sphere. Accurate Torus physics is not yet implemented.');
        const torusOuterRadius = (obj.properties.radius || 1) + (obj.properties.tube || 0.4);
        shape = new CANNON.Sphere(torusOuterRadius);
        body.addShape(shape);
        break;
      case ObjectType.PLANE: 
         shape = new CANNON.Plane(); 
         body.addShape(shape); 
         break;
      default:
        console.warn('[Physics] Unsupported object type for Cannon body:', obj.type);
        return null;
    }
    
    const threeEuler = new THREE.Euler(
      THREE.MathUtils.degToRad(obj.rotation.x),
      THREE.MathUtils.degToRad(obj.rotation.y),
      THREE.MathUtils.degToRad(obj.rotation.z),
      'XYZ'
    );
    const threeQuaternion = new THREE.Quaternion().setFromEuler(threeEuler);
    body.quaternion.set(threeQuaternion.x, threeQuaternion.y, threeQuaternion.z, threeQuaternion.w);

    if (obj.type === ObjectType.PLANE && !obj.id.startsWith("ground")) { 
        if (obj.rotation.x === 0 && obj.rotation.y === 0 && obj.rotation.z === 0) {
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
        }
    }
    return body;
  }, [vec3ToCannon]);

  const addCannonConstraintInternal = useCallback((
    constraintData: PhysicsConstraint,
    world: any, 
    cannonBodies: Record<string, any>, 
    outputCannonConstraintsRef: Record<string, any> 
  ) => {
    const bodyA = cannonBodies[constraintData.bodyAId];
    const bodyB = cannonBodies[constraintData.bodyBId];

    if (!bodyA || !bodyB) {
      console.warn(`[Physics] Bodies for constraint ${constraintData.id} (A: ${constraintData.bodyAId}, B: ${constraintData.bodyBId}) not found. Skipping.`);
      return;
    }
    if (bodyA.id === bodyB.id) { 
        console.warn(`[Physics] Constraint ${constraintData.id} attempts to connect body ID ${bodyA.id} to itself. Skipping.`);
        return;
    }
    
    const maxForce = constraintData.maxForce ?? 1e6;
    let cannonConstraintInstance;
    const pivotA_cannon = vec3ToCannon(constraintData.pivotA);
    const pivotB_cannon = vec3ToCannon(constraintData.pivotB);

    switch (constraintData.type) {
      case ConstraintType.POINT_TO_POINT:
        cannonConstraintInstance = new CANNON.PointToPointConstraint( bodyA, pivotA_cannon, bodyB, pivotB_cannon, maxForce );
        break;
      case ConstraintType.HINGE:
        const axisA_app = constraintData.axisA || { x: 0, y: 1, z: 0 }; 
        const axisB_app = constraintData.axisB || { x: 0, y: 1, z: 0 }; 
        cannonConstraintInstance = new CANNON.HingeConstraint( bodyA, bodyB, { pivotA: pivotA_cannon, pivotB: pivotB_cannon, axisA: vec3ToCannon(axisA_app), axisB: vec3ToCannon(axisB_app), maxForce: maxForce });
        break;
      case ConstraintType.LOCK:
        cannonConstraintInstance = new CANNON.LockConstraint( bodyA, bodyB, { maxForce: maxForce });
        break;
      case ConstraintType.DISTANCE:
        const distance = constraintData.distance !== undefined && constraintData.distance > 0 ? constraintData.distance : 1;
        cannonConstraintInstance = new CANNON.DistanceConstraint( bodyA, bodyB, distance, maxForce );
        if (cannonConstraintInstance.equations && cannonConstraintInstance.equations.length >= 2) {
            const eq1 = cannonConstraintInstance.equations[0]; 
            const eq2 = cannonConstraintInstance.equations[1]; 
            eq1.ri.copy(pivotA_cannon); 
            eq1.rj.copy(pivotB_cannon); 
            eq2.ri.copy(pivotB_cannon); 
            eq2.rj.copy(pivotA_cannon); 
        } else {
            console.warn(`[Physics] DistanceConstraint ${constraintData.id} equations not found. Pivots will be body centers.`);
        }
        break;
      default:
        console.warn(`[Physics] Unsupported constraint type: ${constraintData.type} for ${constraintData.id}`);
        return;
    }
    
    world.addConstraint(cannonConstraintInstance);
    outputCannonConstraintsRef[constraintData.id] = cannonConstraintInstance; 
    cannonConstraintInstance.collideConnected = constraintData.collideConnected === undefined ? false : constraintData.collideConnected;
  }, [vec3ToCannon]);

  useEffect(() => {
    if (!worldRef.current) return;
    const world = worldRef.current;

    Object.values(constraintsRef.current).forEach((constraint: any) => world.removeConstraint(constraint));
    constraintsRef.current = {}; 

    Object.keys(bodiesRef.current).forEach(id => {
      if (id !== 'ground' && bodiesRef.current[id]) world.removeBody(bodiesRef.current[id]);
    });
    const newBodiesRefs: Record<string, any> = bodiesRef.current.ground ? { ground: bodiesRef.current.ground } : {};
    const newBodiesState: BodiesState = {};

    initialObjects.forEach(obj => {
      const body = createCannonBody(obj);
      if (body) {
        world.addBody(body);
        newBodiesRefs[obj.id] = body; 
        newBodiesState[obj.id] = { position: { ...body.position }, quaternion: { ...body.quaternion }};
      }
    });
    bodiesRef.current = newBodiesRefs; 
    setBodiesState(newBodiesState); 

    if (initialConstraints && world && Object.keys(newBodiesRefs).length > (bodiesRef.current.ground ? 1 : 0)) { 
      const newCannonConstraintsInstanceRef: Record<string, any> = {};
      initialConstraints.forEach(constraintData => addCannonConstraintInternal(constraintData, world, newBodiesRefs, newCannonConstraintsInstanceRef));
      constraintsRef.current = newCannonConstraintsInstanceRef; 
    }
  }, [initialObjects, initialConstraints, createCannonBody, addCannonConstraintInternal]);

  const updateBody = useCallback((id: string, updates: UpdatableCannonObjectFields) => {
    if (!worldRef.current || !bodiesRef.current[id]) return;
    const body = bodiesRef.current[id];
    if (body.type === CANNON.Body.STATIC && id !== 'ground') return; 

    let bodyChanged = false;
    if (updates.position) { body.position.set(updates.position.x, updates.position.y, updates.position.z); bodyChanged = true; }
    if (updates.rotation) { 
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler( THREE.MathUtils.degToRad(updates.rotation.x), THREE.MathUtils.degToRad(updates.rotation.y), THREE.MathUtils.degToRad(updates.rotation.z), 'XYZ'));
      body.quaternion.set(q.x, q.y, q.z, q.w); bodyChanged = true;
    }
    if (updates.properties) {
      if (updates.properties.mass !== undefined) { body.mass = Math.max(0, updates.properties.mass); bodyChanged = true; }
      if (updates.properties.friction !== undefined && body.material) { body.material.friction = Math.max(0, updates.properties.friction); bodyChanged = true; }
      if (updates.properties.restitution !== undefined && body.material) { body.material.restitution = Math.max(0, updates.properties.restitution); bodyChanged = true; }
      if (updates.properties.velocity) { body.velocity.set(updates.properties.velocity.x, updates.properties.velocity.y, updates.properties.velocity.z); bodyChanged = true; }
      if (updates.properties.angularVelocity) { body.angularVelocity.set(updates.properties.angularVelocity.x, updates.properties.angularVelocity.y, updates.properties.angularVelocity.z); bodyChanged = true; }
      if (bodyChanged) body.updateMassProperties(); 
    }
    if (bodyChanged) {
        body.wakeUp();
        setBodiesState(prev => ({ ...prev, [id]: { position: { ...body.position }, quaternion: { ...body.quaternion }}}));
    }
  }, []);

  const applyImpulse = useCallback((id: string, impulse: AppVector3, worldPoint?: AppVector3) => {
    if (!worldRef.current || !bodiesRef.current[id]) return;
    const body = bodiesRef.current[id];
    if (body.type === CANNON.Body.STATIC) return;
    body.applyImpulse(vec3ToCannon(impulse), worldPoint ? vec3ToCannon(worldPoint) : body.position);
    body.wakeUp();
  }, [vec3ToCannon]);

  useEffect(() => {
    if (!worldRef.current || simulationStatus !== 'playing') {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const world = worldRef.current;
    const fixedTimeStep = 1 / 60;    // Physics calculations will be done at this rate.
    const maxSubSteps = 10;          // Max physics steps per render frame.
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const animate = (time: number) => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      // Cap deltaTime before adding to accumulator to prevent huge jumps from tab inactivity
      accumulatedTime += Math.min(deltaTime, 1 / 30) * simulationSpeed;

      let stepsTakenThisFrame = 0;
      while (accumulatedTime >= fixedTimeStep && stepsTakenThisFrame < maxSubSteps) {
        world.step(fixedTimeStep);
        accumulatedTime -= fixedTimeStep;
        stepsTakenThisFrame++;
      }

      if (stepsTakenThisFrame > 0) {
        const newStatesUpdate: BodiesState = {};
        let hasChangedAnyBody = false;

        Object.keys(bodiesRef.current).forEach(id => {
          if (id === 'ground') return; 
          const body = bodiesRef.current[id];
          if (body) {
            const lastKnownState = bodiesStateForLoopRef.current[id];
            if ( body.sleepState !== CANNON.Body.SLEEPING || !lastKnownState ||
                 Math.abs(body.position.x - lastKnownState.position.x) > 1e-5 ||
                 Math.abs(body.position.y - lastKnownState.position.y) > 1e-5 ||
                 Math.abs(body.position.z - lastKnownState.position.z) > 1e-5 ||
                 Math.abs(body.quaternion.x - lastKnownState.quaternion.x) > 1e-5 ||
                 Math.abs(body.quaternion.y - lastKnownState.quaternion.y) > 1e-5 ||
                 Math.abs(body.quaternion.z - lastKnownState.quaternion.z) > 1e-5 ||
                 Math.abs(body.quaternion.w - lastKnownState.quaternion.w) > 1e-5 ) {
               newStatesUpdate[id] = {
                  position: { x: body.position.x, y: body.position.y, z: body.position.z },
                  quaternion: { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w },
               };
               hasChangedAnyBody = true;
            }
          }
        });
        
        if (hasChangedAnyBody) {
          setBodiesState(prevStates => ({...prevStates, ...newStatesUpdate}));
        }
      }
    };

    lastTime = performance.now(); // Reset lastTime right before starting the loop
    accumulatedTime = 0; // Reset accumulator
    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [simulationStatus, simulationSpeed]);


  return { bodiesState, updateBody, applyImpulse };
};

export default useCannonPhysics;
