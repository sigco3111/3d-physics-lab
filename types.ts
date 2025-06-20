// Forward declare CANNON as it is loaded via CDN
declare var CANNON: any;
// THREE will be imported as a module where needed.

export enum ObjectType {
  SPHERE = 'SPHERE',
  BOX = 'BOX',
  CYLINDER = 'CYLINDER',
  PLANE = 'PLANE', // Typically static ground
  CONE = 'CONE',
  TORUS = 'TORUS',
  CAPSULE = 'CAPSULE',
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsObjectProperties {
  mass: number;
  friction: number;
  restitution: number;
  velocity: Vector3;
  angularVelocity: Vector3;
  
  // Visual Material Properties
  metalness?: number; // PBR property (0-1)
  roughness?: number; // PBR property (0-1)

  // Specific shape properties
  radius?: number; // For Sphere, Cone (bottom), Capsule
  size?: Vector3; // For Box (width, height, depth)
  radiusTop?: number; // For Cylinder
  radiusBottom?: number; // For Cylinder
  height?: number; // For Cylinder, Capsule (cylindrical part), Cone
  numSegments?: number; // For Cylinder (radial segments), Cone (radial segments)
  
  // Torus specific
  tube?: number; // For Torus (radius of the tube)
  radialSegments?: number; // For Torus
  tubularSegments?: number; // For Torus
}

export interface PhysicsObject {
  id: string;
  type: ObjectType;
  position: Vector3;
  rotation: Vector3; // Euler angles in degrees for UI
  color: string;
  properties: PhysicsObjectProperties;
}

export type SimulationStatus = 'stopped' | 'playing' | 'paused';

export interface CannonBodyState {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
}

export type BodiesState = Record<string, CannonBodyState>;

export interface UpdatableCannonObjectFields {
  position?: Vector3;
  rotation?: Vector3; // Euler angles in degrees
  properties?: Partial<PhysicsObjectProperties>;
  color?: string; // Added to allow color updates through the same mechanism
}

export type CameraViewPreset = 'top' | 'front' | 'side';

// Interface for methods exposed by PhysicsCanvas via useImperativeHandle
export interface PhysicsCanvasHandle {
  focusOnObject: (targetPosition: { x: number; y: number; z: number }) => void; // Using a simple object for THREE.Vector3 like structure
  setCameraView: (view: CameraViewPreset) => void;
}

export interface MaterialPreset {
  name: string;
  displayName: string;
  friction: number;
  restitution: number;
  metalness?: number;
  roughness?: number;
  baseColor?: string; // Hex color string, e.g., '#RRGGBB'
}

export interface GlobalPhysicsSettings {
  gravity: Vector3;
  simulationSpeed: number;
}

// Constraints
export enum ConstraintType {
  POINT_TO_POINT = 'POINT_TO_POINT',
  HINGE = 'HINGE',
  LOCK = 'LOCK',
  DISTANCE = 'DISTANCE',
  // Future: SLIDER etc.
}

export interface PhysicsConstraint {
  id: string;
  type: ConstraintType;
  bodyAId: string;
  bodyBId: string;
  pivotA: Vector3; // Local offset on bodyA, relative to its center.
  pivotB: Vector3; // Local offset on bodyB, relative to its center.
  // Optional properties based on constraint type
  axisA?: Vector3; // For Hinge: Local hinge axis on bodyA
  axisB?: Vector3; // For Hinge: Local hinge axis on bodyB
  distance?: number; // For Distance: Target distance between pivotA and pivotB
  maxForce?: number;
  collideConnected?: boolean;
}

// For Undo/Redo History
export interface HistoryEntry {
  objects: PhysicsObject[];
  constraints: PhysicsConstraint[];
  // Potentially selectedObjectId could also be stored if needed for consistent selection restoration
}

export interface SavedScene {
  id: string;
  name: string;
  timestamp: number;
  objects: PhysicsObject[];
  constraints: PhysicsConstraint[];
  globalPhysicsSettings: GlobalPhysicsSettings;
}

export type GizmoMode = 'translate' | 'rotate' | null;

// Types for AI Scene Generation
export interface AIObjectProperties extends Omit<Partial<PhysicsObjectProperties>, 'velocity' | 'angularVelocity' | 'size'> {
  // All properties from PhysicsObjectProperties are optional for AI.
  // Velocity and angularVelocity are explicitly optional Vector3.
  velocity?: Partial<Vector3>;
  angularVelocity?: Partial<Vector3>;
  size?: Partial<Vector3>; // For BOX, make components optional
}

export interface AIPhysicsObject {
  tempId: string; // Temporary ID used by AI for referencing in constraints
  type: ObjectType;
  position: Partial<Vector3>; // Allow partial for flexibility, will be defaulted
  rotation?: Partial<Vector3>; // Euler angles in degrees
  color?: string;
  properties: AIObjectProperties;
}

export interface AIConstraint {
  type: ConstraintType;
  bodyAId: string; // Refers to AIPhysicsObject.tempId
  bodyBId: string; // Refers to AIPhysicsObject.tempId
  pivotA: Partial<Vector3>;
  pivotB: Partial<Vector3>;
  axisA?: Partial<Vector3>;
  axisB?: Partial<Vector3>;
  distance?: number;
}

export interface AIGlobalPhysicsSettings {
  gravity?: Partial<Vector3>;
  simulationSpeed?: number;
}

export interface AISceneResponse {
  objects: AIPhysicsObject[];
  constraints?: AIConstraint[];
  globalPhysicsSettings?: AIGlobalPhysicsSettings;
}