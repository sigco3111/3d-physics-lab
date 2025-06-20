
import React, { useState, useCallback, useEffect, useRef } from 'react';
import * // Import THREE
from 'three';
import { 
    PhysicsObject, ObjectType, SimulationStatus, Vector3, 
    PhysicsObjectProperties, UpdatableCannonObjectFields, BodiesState, 
    PhysicsCanvasHandle, CameraViewPreset, GlobalPhysicsSettings,
    PhysicsConstraint, ConstraintType, HistoryEntry, SavedScene, GizmoMode,
    AISceneResponse, AIPhysicsObject, AIConstraint, AIGlobalPhysicsSettings
} from './types';
import ObjectPalette from './components/ObjectPalette';
import PropertiesEditor from './components/PropertiesEditor';
import Controls from './components/Controls';
import CameraControls from './components/CameraControls';
import GlobalSettingsPanel from './components/GlobalSettingsPanel';
import ConstraintEditor from './components/ConstraintEditor';
import SceneLibraryPanel from './components/SceneLibraryPanel';
import PhysicsCanvas from './components/PhysicsCanvas';
import GizmoControls from './components/GizmoControls'; 
import AIControls from './components/AIControls'; 
import ApiKeyManager from './components/ApiKeyManager'; 
import HelpModal from './components/HelpModal'; // New Help Modal
import useCannonPhysics from './hooks/useCannonPhysics';
import CollapsiblePanel from './components/CollapsiblePanel'; 
import LibraryIcon from './components/icons/LibraryIcon'; 
import SparklesIcon from './components/icons/SparklesIcon'; 
import HelpIcon from './components/icons/HelpIcon'; // New Help Icon
import { generateSceneDescription, setDynamicApiKey as setGeminiDynamicApiKey, isSystemKeyAvailable as isGeminiSystemKeyAvailable, parseAIResponse } from './ai/geminiService';


// Declare CANNON as it is loaded via CDN (already in types.ts)
declare var CANNON: any;

const LOG_PREFIX_APP = "[App]";
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
const MAX_HISTORY_SIZE = 50;
const LOCAL_STORAGE_KEY_SCENES = 'physicsLabSavedScenes';
const LOCAL_STORAGE_KEY_USER_API_KEY = 'userGeminiApiKey'; // For user-provided API key

const DEFAULT_GLOBAL_PHYSICS_SETTINGS: GlobalPhysicsSettings = {
  gravity: { x: 0, y: -9.82, z: 0 },
  simulationSpeed: 2.0, // Increased simulation speed
};

const createDefaultObject = (type: ObjectType, existingObjects: PhysicsObject[]): PhysicsObject => {
  const newId = generateId();
  let positionYOffset = 1; 
  
  const dynamicObjects = existingObjects.filter(obj => obj.type !== ObjectType.PLANE);
  if (dynamicObjects.length > 0) {
    const highestY = Math.max(...dynamicObjects.map(o => o.position.y), 0);
    positionYOffset = highestY + 2; 
  }

  if (type === ObjectType.SPHERE) positionYOffset += (0.5 + Math.random() * 0.5) / 2;
  else if (type === ObjectType.BOX) positionYOffset += (0.5 + Math.random()) / 2;
  else if (type === ObjectType.CYLINDER) positionYOffset += (1 + Math.random()) / 2;
  else if (type === ObjectType.CONE) positionYOffset += (1 + Math.random() * 0.5) / 2;
  else if (type === ObjectType.CAPSULE) positionYOffset += ( ( (0.5 + Math.random() * 0.3) * 2 + (0.5 + Math.random() * 0.5) ) / 2 ); 
  else if (type === ObjectType.TORUS) positionYOffset += (0.5 + Math.random() * 0.3); 


  const baseProperties: PhysicsObjectProperties = {
    mass: 1,
    friction: 0.4, 
    restitution: 0.3, 
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    metalness: 0.1, 
    roughness: 0.7, 
  };

  const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
  const randomPosition = { x: Math.random() * 4 - 2, y: positionYOffset, z: Math.random() * 4 - 2 };
  const defaultRotation = { x: 0, y: 0, z: 0 };


  switch (type) {
    case ObjectType.SPHERE:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: { ...baseProperties, radius: 0.5 + Math.random() * 0.5 },
      };
    case ObjectType.BOX:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: { ...baseProperties, size: { x: 0.5 + Math.random(), y: 0.5 + Math.random(), z: 0.5 + Math.random() } },
      };
    case ObjectType.CYLINDER:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: { 
            ...baseProperties, 
            radiusTop: 0.5 + Math.random() * 0.3, 
            radiusBottom: 0.5 + Math.random() * 0.3, 
            height: 1 + Math.random(),
            numSegments: 16,
        },
      };
    case ObjectType.CONE:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: {
            ...baseProperties,
            radius: 0.5 + Math.random() * 0.5, 
            height: 1 + Math.random() * 0.5,
            numSegments: 16,
        },
      };
    case ObjectType.CAPSULE:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: {
            ...baseProperties,
            radius: 0.3 + Math.random() * 0.3,
            height: 0.5 + Math.random() * 0.5, 
        },
      };
    case ObjectType.TORUS:
      return {
        id: newId, type, position: randomPosition, rotation: defaultRotation, color: randomColor,
        properties: {
            ...baseProperties,
            radius: 0.8 + Math.random() * 0.4, 
            tube: 0.2 + Math.random() * 0.2,   
            radialSegments: 16,
            tubularSegments: 32,
        },
      };
    default: 
      throw new Error(`Unsupported object type: ${type}`);
  }
};

interface PanelCollapseStates {
  objectPalette: boolean;
  globalSettings: boolean;
  constraintEditor: boolean;
  aiControls: boolean;
}

export type GeminiApiKeyStatus = 'LOADING' | 'READY_USER' | 'READY_SYSTEM' | 'NOT_CONFIGURED';

const App: React.FC = () => {
  const [physicsObjects, setPhysicsObjects] = useState<PhysicsObject[]>([]);
  const [initialPhysicsObjects, setInitialPhysicsObjects] = useState<PhysicsObject[]>([]);
  const [constraints, setConstraints] = useState<PhysicsConstraint[]>([]); 
  const [initialConstraints, setInitialConstraints] = useState<PhysicsConstraint[]>([]); 

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('stopped');
  const physicsCanvasRef = useRef<PhysicsCanvasHandle>(null);

  const [globalPhysicsSettings, setGlobalPhysicsSettings] = useState<GlobalPhysicsSettings>(
    JSON.parse(JSON.stringify(DEFAULT_GLOBAL_PHYSICS_SETTINGS)) // Deep copy
  );

  const [panelCollapseStates, setPanelCollapseStates] = useState<PanelCollapseStates>({
    objectPalette: true,
    globalSettings: false, // Changed from true to false
    constraintEditor: false, // Changed from true to false
    aiControls: true,
  });

  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]); 
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]); 
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [isSceneLibraryModalOpen, setIsSceneLibraryModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false); // New state for Help Modal
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>(null);

  // AI Generation State
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);
  const [aiGenerationError, setAIGenerationError] = useState<string | null>(null);
  
  // API Key Management State
  const [userApiKeyInput, setUserApiKeyInput] = useState<string>(''); // For the input field itself
  const [geminiApiKeyStatus, setGeminiApiKeyStatus] = useState<GeminiApiKeyStatus>('LOADING');


  useEffect(() => {
    const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY_USER_API_KEY);
    if (storedKey) {
      setUserApiKeyInput(storedKey);
      setGeminiDynamicApiKey(storedKey);
      setGeminiApiKeyStatus('READY_USER');
    } else {
      setGeminiDynamicApiKey(null); 
      if (isGeminiSystemKeyAvailable()) {
        setGeminiApiKeyStatus('READY_SYSTEM');
      } else {
        setGeminiApiKeyStatus('NOT_CONFIGURED');
      }
    }
  }, []);

  const handleUserApiKeyInputChange = (key: string) => {
    setUserApiKeyInput(key);
  };

  const handleSaveUserApiKey = () => {
    const trimmedKey = userApiKeyInput.trim();
    if (trimmedKey) {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_API_KEY, trimmedKey);
      setGeminiDynamicApiKey(trimmedKey);
      setGeminiApiKeyStatus('READY_USER');
      alert('사용자 API 키가 저장되어 활성화되었습니다.');
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER_API_KEY);
      setGeminiDynamicApiKey(null);
      if (isGeminiSystemKeyAvailable()) {
        setGeminiApiKeyStatus('READY_SYSTEM');
        alert('사용자 API 키가 삭제되었습니다. 시스템 기본 키를 사용합니다 (설정된 경우).');
      } else {
        setGeminiApiKeyStatus('NOT_CONFIGURED');
        alert('사용자 API 키가 삭제되었습니다. 현재 설정된 API 키가 없습니다.');
      }
    }
  };


  const handleResetScene = useCallback((showAlert = true) => {
    console.log(LOG_PREFIX_APP, "handleResetScene called (clear all objects).");
    
    setPhysicsObjects([]);
    setConstraints([]);
    setInitialPhysicsObjects([]);
    setInitialConstraints([]);
    setSelectedObjectId(null);
    setGizmoMode(null);
    setUndoStack([]);
    setRedoStack([]);
    setGlobalPhysicsSettings(JSON.parse(JSON.stringify(DEFAULT_GLOBAL_PHYSICS_SETTINGS)));
    setSimulationStatus('stopped');
    if (showAlert) {
      alert("장면의 모든 객체가 삭제되었습니다.");
    }
    console.log(LOG_PREFIX_APP, "Scene has been cleared of all objects.");
  }, []); 

  useEffect(() => {
    const loadInitialLibraryAndScene = async () => {
      let initialLibraryScenes: SavedScene[] | null = null;
      let loadedFromLocalStorage = false;
  
      try {
        const storedScenes = localStorage.getItem(LOCAL_STORAGE_KEY_SCENES);
        if (storedScenes) {
          const parsedScenes = JSON.parse(storedScenes);
          if (Array.isArray(parsedScenes) && parsedScenes.length > 0) {
            initialLibraryScenes = parsedScenes;
            loadedFromLocalStorage = true;
            console.log(LOG_PREFIX_APP, `Scene library loaded from localStorage: ${parsedScenes.length}`);
          } else {
            console.log(LOG_PREFIX_APP, "localStorage scene library data is empty or invalid.");
          }
        } else {
          console.log(LOG_PREFIX_APP, "No scene library found in localStorage.");
        }
      } catch (error) {
        console.error(LOG_PREFIX_APP, "Error loading scene library from localStorage:", error);
      }
  
      if (!loadedFromLocalStorage) {
        console.log(LOG_PREFIX_APP, "Attempting to load default scene library from physics_lab_scenes.json");
        try {
          const response = await fetch('/physics_lab_scenes.json'); 
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for /physics_lab_scenes.json. Make sure the file exists in the public directory.`);
          }
          const data: unknown = await response.json();
  
          if (Array.isArray(data) && data.length > 0) {
            const isValidData = data.every(scene =>
              typeof scene.id === 'string' &&
              typeof scene.name === 'string' &&
              typeof scene.timestamp === 'number' &&
              Array.isArray(scene.objects) &&
              Array.isArray(scene.constraints) &&
              typeof scene.globalPhysicsSettings === 'object' && scene.globalPhysicsSettings !== null &&
              typeof (scene.globalPhysicsSettings.gravity as Vector3).x === 'number' &&
              typeof (scene.globalPhysicsSettings.gravity as Vector3).y === 'number' &&
              typeof (scene.globalPhysicsSettings.gravity as Vector3).z === 'number' &&
              typeof scene.globalPhysicsSettings.simulationSpeed === 'number'
            );
  
            if (isValidData) {
              initialLibraryScenes = data as SavedScene[];
              console.log(LOG_PREFIX_APP, `Default scene library loaded from JSON file: ${initialLibraryScenes.length}`);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY_SCENES, JSON.stringify(initialLibraryScenes));
                console.log(LOG_PREFIX_APP, "Default scene library saved to localStorage.");
              } catch (storageError) {
                console.error(LOG_PREFIX_APP, "Error saving default scene library to localStorage:", storageError);
              }
            } else {
              console.error(LOG_PREFIX_APP, "Default scene library JSON data is invalid.");
            }
          } else {
             console.log(LOG_PREFIX_APP, "Default scene library JSON file is empty or not an array.");
          }
        } catch (error) {
          console.error(LOG_PREFIX_APP, "Error fetching or parsing default scene library JSON:", error);
        }
      }
  
      if (initialLibraryScenes && initialLibraryScenes.length > 0) {
        setSavedScenes(initialLibraryScenes);
      }
  
      if (physicsObjects.length === 0 && constraints.length === 0) {
        console.log(LOG_PREFIX_APP, "Editor is empty on initial load. Resetting to a blank scene.");
        handleResetScene(false); 
      }
    };
  
    loadInitialLibraryAndScene();
  }, [handleResetScene]); // handleResetScene is stable, physicsObjects/constraints are for the condition


  useEffect(() => {
    try {
      if (savedScenes.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY_SCENES) !== null) {
         console.log(LOG_PREFIX_APP, `Persisting ${savedScenes.length} scenes to localStorage.`);
         localStorage.setItem(LOCAL_STORAGE_KEY_SCENES, JSON.stringify(savedScenes));
      }
    } catch (error) {
      console.error(LOG_PREFIX_APP, "Error saving scenes to localStorage in general useEffect:", error);
    }
  }, [savedScenes]);


  const { bodiesState, updateBody, applyImpulse } = useCannonPhysics(
    initialPhysicsObjects, 
    simulationStatus, 
    globalPhysicsSettings.gravity,
    globalPhysicsSettings.simulationSpeed,
    initialConstraints 
  );

  const pushToUndoStack = useCallback((currentObjects: PhysicsObject[], currentConstraints: PhysicsConstraint[]) => {
    console.log(LOG_PREFIX_APP, "Pushing to undo stack.");
    setUndoStack(prevStack => {
      const newStack = [...prevStack, { objects: JSON.parse(JSON.stringify(currentObjects)), constraints: JSON.parse(JSON.stringify(currentConstraints)) }];
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(newStack.length - MAX_HISTORY_SIZE);
      }
      return newStack;
    });
    setRedoStack([]); 
  }, []);

  const handleTogglePanel = (panelKey: keyof PanelCollapseStates) => {
    setPanelCollapseStates(prev => ({ ...prev, [panelKey]: !prev[panelKey] }));
  };

  const handleAddObject = useCallback((type: ObjectType) => {
    if (type === ObjectType.PLANE) return;
    console.log(LOG_PREFIX_APP, `handleAddObject: type ${type}. Current objects: ${physicsObjects.length}`);
    pushToUndoStack(physicsObjects, constraints); 
    setPhysicsObjects(prevObjects => {
      const newObject = createDefaultObject(type, prevObjects);
      console.log(LOG_PREFIX_APP, `New object created ID: ${newObject.id}, Pos: ${JSON.stringify(newObject.position)}`);
      setSelectedObjectId(newObject.id); 
      setGizmoMode('translate'); 
      console.log(LOG_PREFIX_APP, `handleAddObject: Selected new object ${newObject.id}, gizmoMode set to 'translate'.`);
      return [...prevObjects, newObject];
    });
  }, [physicsObjects, constraints, pushToUndoStack]);


  const handleUpdateObject = useCallback((id: string, updates: UpdatableCannonObjectFields, fromGizmo: boolean = false) => {
    console.log(LOG_PREFIX_APP, `handleUpdateObject: ID ${id}, fromGizmo: ${fromGizmo}, updates: ${JSON.stringify(updates)}`);
    const objectIndex = physicsObjects.findIndex(obj => obj.id === id);
    if (objectIndex === -1) {
      console.warn(LOG_PREFIX_APP, `handleUpdateObject: Object ID ${id} not found.`);
      return;
    }
    
    if (!fromGizmo) { 
        console.log(LOG_PREFIX_APP, `handleUpdateObject: Pushing to undo stack (not from gizmo).`);
        pushToUndoStack(physicsObjects, constraints);
    }
    
    setPhysicsObjects(prevPhysicsObjects => {
        const updatedObjects = prevPhysicsObjects.map(obj => {
            if (obj.id === id) {
                const newObj = JSON.parse(JSON.stringify(obj));

                if (updates.position) newObj.position = { ...newObj.position, ...updates.position };
                if (updates.rotation) newObj.rotation = { ...newObj.rotation, ...updates.rotation };
                if (updates.color) newObj.color = updates.color;
                
                if (updates.properties) {
                    newObj.properties = { ...newObj.properties, ...updates.properties };
                    if (updates.properties.velocity) newObj.properties.velocity = { ...obj.properties.velocity, ...updates.properties.velocity };
                    if (updates.properties.angularVelocity) newObj.properties.angularVelocity = { ...obj.properties.angularVelocity, ...updates.properties.angularVelocity };
                    if (updates.properties.size && obj.properties.size) newObj.properties.size = { ...obj.properties.size, ...updates.properties.size };
                }
                console.log(LOG_PREFIX_APP, `handleUpdateObject: Object ${id} updated in state. New pos: ${JSON.stringify(newObj.position)}`);
                return newObj;
            }
            return obj;
        });
        return updatedObjects;
    });

    const bodyUpdatesForCannon: UpdatableCannonObjectFields = {};
    let needsCannonUpdate = false;

    if (updates.position) {
      bodyUpdatesForCannon.position = updates.position;
      needsCannonUpdate = true;
    }
    if (updates.rotation) {
      bodyUpdatesForCannon.rotation = updates.rotation;
      needsCannonUpdate = true;
    }

    const physicalPropsToUpdate: Partial<PhysicsObjectProperties> = {};
    if (updates.properties) {
        const { mass, friction, restitution, velocity, angularVelocity } = updates.properties;
        if (mass !== undefined) physicalPropsToUpdate.mass = mass;
        if (friction !== undefined) physicalPropsToUpdate.friction = friction;
        if (restitution !== undefined) physicalPropsToUpdate.restitution = restitution;
        
        if (velocity) physicalPropsToUpdate.velocity = velocity;
        if (angularVelocity) physicalPropsToUpdate.angularVelocity = angularVelocity;
    }

    if (Object.keys(physicalPropsToUpdate).length > 0) {
        bodyUpdatesForCannon.properties = { ...bodyUpdatesForCannon.properties, ...physicalPropsToUpdate };
        needsCannonUpdate = true;
    }
    
    if (fromGizmo && (simulationStatus === 'paused' || simulationStatus === 'stopped')) {
        bodyUpdatesForCannon.properties = {
            ...bodyUpdatesForCannon.properties,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };
        needsCannonUpdate = true; 
    }


    if (needsCannonUpdate && Object.keys(bodyUpdatesForCannon).length > 0) {
        console.log(LOG_PREFIX_APP, `Calling updateBody for ${id} with: ${JSON.stringify(bodyUpdatesForCannon)}`);
        updateBody(id, bodyUpdatesForCannon);
    }

  }, [physicsObjects, constraints, simulationStatus, updateBody, pushToUndoStack]);
  
  useEffect(() => {
    if (simulationStatus === 'stopped') {
      console.log(LOG_PREFIX_APP, "Sim status is 'stopped'. Updating initialPhysicsObjects and initialConstraints.");
      setInitialPhysicsObjects(JSON.parse(JSON.stringify(physicsObjects.filter(obj => obj.type !== ObjectType.PLANE))));
      setInitialConstraints(JSON.parse(JSON.stringify(constraints))); 
    }
  }, [physicsObjects, constraints, simulationStatus]);

  useEffect(() => {
    if (selectedObjectId && !physicsObjects.find(obj => obj.id === selectedObjectId)) {
      console.log(LOG_PREFIX_APP, `Selected object ${selectedObjectId} no longer exists. Deselecting.`);
      setSelectedObjectId(null);
      setGizmoMode(null);
    }
  }, [physicsObjects, selectedObjectId]);

  useEffect(() => {
    if (simulationStatus === 'playing' && gizmoMode !== null) {
      console.log(LOG_PREFIX_APP, "Simulation started. Turning off gizmo.");
      setGizmoMode(null);
    }
  }, [simulationStatus, gizmoMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ( (event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement) || (event.target instanceof HTMLSelectElement) ) {
        return; 
      }

      if (selectedObjectId && simulationStatus !== 'playing') {
        if (event.key.toLowerCase() === 't') {
          console.log(LOG_PREFIX_APP, "T key pressed. Toggling translate gizmo.");
          setGizmoMode(prev => prev === 'translate' ? null : 'translate');
        } else if (event.key.toLowerCase() === 'r') {
          console.log(LOG_PREFIX_APP, "R key pressed. Toggling rotate gizmo.");
          setGizmoMode(prev => prev === 'rotate' ? null : 'rotate');
        } else if (event.key === 'Escape' && gizmoMode !== null) {
            console.log(LOG_PREFIX_APP, "Escape key pressed with active gizmo. Turning off gizmo.");
            setGizmoMode(null);
        }
      }
       if (event.key === 'Escape' && selectedObjectId !== null) {
            console.log(LOG_PREFIX_APP, "Escape key pressed with selected object. Deselecting object and gizmo.");
            setSelectedObjectId(null); 
            setGizmoMode(null);
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObjectId, simulationStatus, gizmoMode]);


  const handleDeleteObject = useCallback((id: string) => {
    console.log(LOG_PREFIX_APP, `handleDeleteObject: ID ${id}`);
    pushToUndoStack(physicsObjects, constraints); 
    const newObjects = physicsObjects.filter(obj => obj.id !== id);
    const newConstraints = constraints.filter(c => c.bodyAId !== id && c.bodyBId !== id);
    
    setPhysicsObjects(newObjects);
    setConstraints(newConstraints);

    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      setGizmoMode(null); 
    }
  }, [physicsObjects, constraints, selectedObjectId, pushToUndoStack]);

  const handleAddConstraint = useCallback((
    bodyAId: string, 
    bodyBId: string, 
    pivotA: Vector3, 
    pivotB: Vector3, 
    type: ConstraintType,
    options?: {
      axisA?: Vector3,
      axisB?: Vector3,
      distance?: number
    }
  ) => {
    console.log(LOG_PREFIX_APP, `handleAddConstraint: type ${type} between ${bodyAId} and ${bodyBId}`);
    pushToUndoStack(physicsObjects, constraints);
    const newConstraint: PhysicsConstraint = {
      id: generateId(),
      type,
      bodyAId,
      bodyBId,
      pivotA,
      pivotB,
      collideConnected: false, 
      maxForce: 1e6 
    };

    if (type === ConstraintType.HINGE && options?.axisA && options?.axisB) {
      newConstraint.axisA = options.axisA; 
      newConstraint.axisB = options.axisB; 
    } else if (type === ConstraintType.HINGE) { 
      newConstraint.axisA = { x: 0, y: 1, z: 0 }; 
      newConstraint.axisB = { x: 0, y: 1, z: 0 }; 
    }

    if (type === ConstraintType.DISTANCE) {
      newConstraint.distance = options?.distance !== undefined && options.distance > 0 ? options.distance : 1.0;
    }
    
    setConstraints(prev => [...prev, newConstraint]);
  }, [physicsObjects, constraints, pushToUndoStack]);

  const handleDeleteConstraint = useCallback((constraintId: string) => {
    console.log(LOG_PREFIX_APP, `handleDeleteConstraint: ID ${constraintId}`);
    pushToUndoStack(physicsObjects, constraints);
    setConstraints(prev => prev.filter(c => c.id !== constraintId));
  }, [physicsObjects, constraints, pushToUndoStack]);


  const handlePlay = useCallback(() => {
    console.log(LOG_PREFIX_APP, "handlePlay called.");
    if (simulationStatus === 'stopped') {
      console.log(LOG_PREFIX_APP, "Sim was stopped, setting initial states for physics engine.");
      setInitialPhysicsObjects(JSON.parse(JSON.stringify(physicsObjects.filter(obj => obj.type !== ObjectType.PLANE))));
      setInitialConstraints(JSON.parse(JSON.stringify(constraints)));
    }
    setGizmoMode(null); 
    setSimulationStatus('playing');
  }, [physicsObjects, constraints, simulationStatus]);

  const handlePause = useCallback(() => {
    console.log(LOG_PREFIX_APP, "handlePause called.");
    setSimulationStatus('paused');
  }, []);

  const handleReset = useCallback(() => {
    console.log(LOG_PREFIX_APP, "handleReset called (reset current simulation).");
    setSimulationStatus('stopped');
    const resetObjects = JSON.parse(JSON.stringify(initialPhysicsObjects)).map((obj: PhysicsObject) => ({
      ...obj, 
      properties: {
        ...obj.properties,
        velocity: {x:0, y:0, z:0}, 
        angularVelocity: {x:0, y:0, z:0} 
      }
    }));
    setPhysicsObjects(resetObjects); 
    setConstraints(JSON.parse(JSON.stringify(initialConstraints))); 
    
    setSelectedObjectId(null);
    setGizmoMode(null);
    setUndoStack([]); 
    setRedoStack([]);
  }, [initialPhysicsObjects, initialConstraints]);


  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    console.log(LOG_PREFIX_APP, "handleUndo called.");
    const previousHistoryEntry = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    setRedoStack(prev => [{ objects: JSON.parse(JSON.stringify(physicsObjects)), constraints: JSON.parse(JSON.stringify(constraints)) }, ...prev].slice(0, MAX_HISTORY_SIZE));
    setPhysicsObjects(JSON.parse(JSON.stringify(previousHistoryEntry.objects)));
    setConstraints(JSON.parse(JSON.stringify(previousHistoryEntry.constraints)));
    setUndoStack(newUndoStack);

    if (selectedObjectId && !previousHistoryEntry.objects.find(obj => obj.id === selectedObjectId)) {
        setSelectedObjectId(null);
        setGizmoMode(null);
    }
  }, [undoStack, physicsObjects, constraints, selectedObjectId]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    console.log(LOG_PREFIX_APP, "handleRedo called.");
    const nextHistoryEntry = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    setUndoStack(prev => [...prev, { objects: JSON.parse(JSON.stringify(physicsObjects)), constraints: JSON.parse(JSON.stringify(constraints)) }].slice(0, MAX_HISTORY_SIZE));
    setPhysicsObjects(JSON.parse(JSON.stringify(nextHistoryEntry.objects)));
    setConstraints(JSON.parse(JSON.stringify(nextHistoryEntry.constraints)));
    setRedoStack(newRedoStack);

    if (selectedObjectId && !nextHistoryEntry.objects.find(obj => obj.id === selectedObjectId)) {
        setSelectedObjectId(null);
        setGizmoMode(null);
    }
  }, [redoStack, physicsObjects, constraints, selectedObjectId]);


  const handleFocusObject = useCallback((id: string) => {
    const object = physicsObjects.find(obj => obj.id === id);
    if (!object || !physicsCanvasRef.current) return;
    console.log(LOG_PREFIX_APP, `handleFocusObject: ID ${id}`);

    let targetPos: Vector3;
    if ((simulationStatus === 'playing' || simulationStatus === 'paused') && bodiesState[id]) {
      targetPos = bodiesState[id].position;
    } else {
      targetPos = object.position;
    }
    physicsCanvasRef.current.focusOnObject({ x: targetPos.x, y: targetPos.y, z: targetPos.z });
  }, [physicsObjects, bodiesState, simulationStatus]);

  const handleSetCameraView = useCallback((view: CameraViewPreset) => {
    if (physicsCanvasRef.current) {
      console.log(LOG_PREFIX_APP, `handleSetCameraView: ${view}`);
      physicsCanvasRef.current.setCameraView(view);
    }
  }, []);

  const handleGravityChange = useCallback((newGravity: Vector3) => {
    setGlobalPhysicsSettings(prev => ({ ...prev, gravity: newGravity }));
  }, []);

  const handleSimulationSpeedChange = useCallback((newSpeed: number) => {
    setGlobalPhysicsSettings(prev => ({ ...prev, simulationSpeed: newSpeed }));
  }, []);

  const handleApplyImpulse = useCallback((objectId: string, impulse: Vector3) => {
    if (simulationStatus === 'stopped') {
      console.warn(LOG_PREFIX_APP, "Cannot apply impulse when simulation is stopped.");
      return;
    }
    console.log(LOG_PREFIX_APP, `handleApplyImpulse: ID ${objectId}, Impulse: ${JSON.stringify(impulse)}`);
    applyImpulse(objectId, impulse);
  }, [applyImpulse, simulationStatus]);

  const handleSetGizmoMode = useCallback((mode: GizmoMode) => {
    console.log(LOG_PREFIX_APP, `handleSetGizmoMode: mode ${mode}, simStatus: ${simulationStatus}, selectedObj: ${selectedObjectId}`);
    if (simulationStatus === 'playing') {
      setGizmoMode(null);
      return;
    }
    if (!selectedObjectId) { 
        setGizmoMode(null);
        return;
    }
    setGizmoMode(mode);
  }, [simulationStatus, selectedObjectId]);

  const handleSelectObject = useCallback((id: string | null) => {
    console.log(LOG_PREFIX_APP, `handleSelectObject: selected ID ${id}. Current gizmoMode: ${gizmoMode}, simStatus: ${simulationStatus}`);
    setSelectedObjectId(id);
    if (!id) { 
        console.log(LOG_PREFIX_APP, "Object deselected, turning off gizmo.");
        setGizmoMode(null); 
    }
  }, [gizmoMode, simulationStatus]);

  const handleGenerateSceneWithAI = useCallback(async (prompt: string) => {
    console.log(LOG_PREFIX_APP, `handleGenerateSceneWithAI: Prompt "${prompt}"`);
    if (geminiApiKeyStatus === 'NOT_CONFIGURED') {
        setAIGenerationError("Gemini API 키가 설정되지 않았습니다. AI 기능을 사용하려면 API 키를 입력해주세요.");
        setIsAIGenerating(false);
        return;
    }
    pushToUndoStack(physicsObjects, constraints);
    setIsAIGenerating(true);
    setAIGenerationError(null);

    try {
      const jsonString = await generateSceneDescription(prompt);
      const aiSceneData = parseAIResponse(jsonString);

      if (!aiSceneData || !aiSceneData.objects) {
        throw new Error("AI did not return valid scene data, or objects array is missing.");
      }

      const tempIdToNewIdMap: Record<string, string> = {};
      const newPhysicsObjects: PhysicsObject[] = aiSceneData.objects.map((aiObj: AIPhysicsObject) => {
        const newId = generateId();
        tempIdToNewIdMap[aiObj.tempId] = newId;
        const position: Vector3 = { x: aiObj.position?.x ?? 0, y: aiObj.position?.y ?? 1, z: aiObj.position?.z ?? 0 };
        const rotation: Vector3 = { x: aiObj.rotation?.x ?? 0, y: aiObj.rotation?.y ?? 0, z: aiObj.rotation?.z ?? 0 };
        const velocity: Vector3 = { x: aiObj.properties.velocity?.x ?? 0, y: aiObj.properties.velocity?.y ?? 0, z: aiObj.properties.velocity?.z ?? 0 };
        const angularVelocity: Vector3 = { x: aiObj.properties.angularVelocity?.x ?? 0, y: aiObj.properties.angularVelocity?.y ?? 0, z: aiObj.properties.angularVelocity?.z ?? 0 };
        
        let specificProps: Partial<PhysicsObjectProperties> = {};
        switch(aiObj.type) {
            case ObjectType.SPHERE: specificProps.radius = Math.max(0.1, aiObj.properties.radius ?? 0.5); break;
            case ObjectType.BOX: specificProps.size = { 
                x: Math.max(0.1, aiObj.properties.size?.x ?? 1), 
                y: Math.max(0.1, aiObj.properties.size?.y ?? 1), 
                z: Math.max(0.1, aiObj.properties.size?.z ?? 1) 
            }; break;
            case ObjectType.CYLINDER: specificProps = {
                radiusTop: Math.max(0.01, aiObj.properties.radiusTop ?? 0.5),
                radiusBottom: Math.max(0.01, aiObj.properties.radiusBottom ?? 0.5),
                height: Math.max(0.1, aiObj.properties.height ?? 1),
                numSegments: Math.max(3, aiObj.properties.numSegments ?? 16),
            }; break;
            case ObjectType.CONE: specificProps = {
                radius: Math.max(0.01, aiObj.properties.radius ?? 0.5), 
                height: Math.max(0.1, aiObj.properties.height ?? 1),
                numSegments: Math.max(3, aiObj.properties.numSegments ?? 16),
            }; break;
            case ObjectType.CAPSULE: specificProps = {
                radius: Math.max(0.01, aiObj.properties.radius ?? 0.25),
                height: Math.max(0.1, aiObj.properties.height ?? 0.5), 
            }; break;
            case ObjectType.TORUS: specificProps = {
                radius: Math.max(0.1, aiObj.properties.radius ?? 1), 
                tube: Math.max(0.01, aiObj.properties.tube ?? 0.2),
                radialSegments: Math.max(3, aiObj.properties.radialSegments ?? 16),
                tubularSegments: Math.max(3, aiObj.properties.tubularSegments ?? 32),
            }; break;
        }

        return {
          id: newId, type: aiObj.type, position, rotation,
          color: aiObj.color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
          properties: {
            mass: Math.max(0.1, aiObj.properties.mass ?? 1),
            friction: Math.min(1, Math.max(0, aiObj.properties.friction ?? 0.4)),
            restitution: Math.min(1, Math.max(0, aiObj.properties.restitution ?? 0.3)),
            metalness: Math.min(1, Math.max(0, aiObj.properties.metalness ?? 0.1)),
            roughness: Math.min(1, Math.max(0, aiObj.properties.roughness ?? 0.7)),
            velocity, angularVelocity, ...specificProps,
          },
        };
      });

      const newConstraints: PhysicsConstraint[] = (aiSceneData.constraints || []).map((aiCons: AIConstraint) => {
        const bodyAId = tempIdToNewIdMap[aiCons.bodyAId];
        const bodyBId = tempIdToNewIdMap[aiCons.bodyBId];
        if (!bodyAId || !bodyBId) {
          console.warn("Skipping constraint due to missing body ID mapping:", aiCons);
          return null; 
        }
        return {
          id: generateId(), type: aiCons.type, bodyAId, bodyBId,
          pivotA: { x: aiCons.pivotA?.x ?? 0, y: aiCons.pivotA?.y ?? 0, z: aiCons.pivotA?.z ?? 0 },
          pivotB: { x: aiCons.pivotB?.x ?? 0, y: aiCons.pivotB?.y ?? 0, z: aiCons.pivotB?.z ?? 0 },
          axisA: aiCons.axisA ? { x: aiCons.axisA.x ?? 0, y: aiCons.axisA.y ?? 1, z: aiCons.axisA.z ?? 0 } : undefined,
          axisB: aiCons.axisB ? { x: aiCons.axisB.x ?? 0, y: aiCons.axisB.y ?? 1, z: aiCons.axisB.z ?? 0 } : undefined,
          distance: aiCons.distance ? Math.max(0.01, aiCons.distance) : undefined,
          collideConnected: false, maxForce: 1e6,
        };
      }).filter(c => c !== null) as PhysicsConstraint[];

      let newGlobalSettings = { ...globalPhysicsSettings };
      if (aiSceneData.globalPhysicsSettings) {
        const aiSettings = aiSceneData.globalPhysicsSettings;
        if (aiSettings.gravity) {
          newGlobalSettings.gravity = {
            x: aiSettings.gravity.x ?? newGlobalSettings.gravity.x,
            y: aiSettings.gravity.y ?? newGlobalSettings.gravity.y,
            z: aiSettings.gravity.z ?? newGlobalSettings.gravity.z,
          };
        }
        if (aiSettings.simulationSpeed !== undefined) {
          newGlobalSettings.simulationSpeed = Math.min(10, Math.max(0.1, aiSettings.simulationSpeed));
        }
      }
      
      setPhysicsObjects(newPhysicsObjects);
      setConstraints(newConstraints);
      setGlobalPhysicsSettings(newGlobalSettings);
      setInitialPhysicsObjects(JSON.parse(JSON.stringify(newPhysicsObjects.filter(obj => obj.type !== ObjectType.PLANE))));
      setInitialConstraints(JSON.parse(JSON.stringify(newConstraints)));
      setSelectedObjectId(null);
      setGizmoMode(null);
      setSimulationStatus('stopped');
      alert('AI 장면이 성공적으로 생성되었습니다!');

    } catch (error) {
      console.error("Error generating scene with AI:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setAIGenerationError(errorMessage);
      if (undoStack.length > 0) {
        handleUndo(); 
      } else { 
        handleResetScene(false); 
      }
    } finally {
      setIsAIGenerating(false);
    }
  }, [physicsObjects, constraints, globalPhysicsSettings, pushToUndoStack, handleUndo, handleResetScene, undoStack, geminiApiKeyStatus]);


  // Scene Library Handlers
  const openSceneLibraryModal = () => setIsSceneLibraryModalOpen(true);
  const closeSceneLibraryModal = () => setIsSceneLibraryModalOpen(false);
  const openHelpModal = () => setIsHelpModalOpen(true); // New handler
  const closeHelpModal = () => setIsHelpModalOpen(false); // New handler


  const handleSaveCurrentScene = useCallback((name: string) => {
    console.log(LOG_PREFIX_APP, `Saving current scene as: ${name}`);
    const newScene: SavedScene = {
      id: generateId(), name, timestamp: Date.now(),
      objects: JSON.parse(JSON.stringify(physicsObjects)),
      constraints: JSON.parse(JSON.stringify(constraints)),
      globalPhysicsSettings: JSON.parse(JSON.stringify(globalPhysicsSettings)),
    };
    setSavedScenes(prevScenes => [...prevScenes, newScene].sort((a,b) => b.timestamp - a.timestamp));
    alert(`장면 '${name}'이(가) 저장되었습니다.`);
  }, [physicsObjects, constraints, globalPhysicsSettings]);

  const handleLoadScene = useCallback((sceneId: string) => {
    console.log(LOG_PREFIX_APP, `Loading scene: ${sceneId}`);
    const sceneToLoad = savedScenes.find(s => s.id === sceneId);
    if (!sceneToLoad) {
      alert("장면을 불러올 수 없습니다.");
      return;
    }
    pushToUndoStack(physicsObjects, constraints); 
    
    setSimulationStatus('stopped'); 
    setPhysicsObjects(JSON.parse(JSON.stringify(sceneToLoad.objects)));
    setConstraints(JSON.parse(JSON.stringify(sceneToLoad.constraints)));
    setGlobalPhysicsSettings(JSON.parse(JSON.stringify(sceneToLoad.globalPhysicsSettings)));
    setInitialPhysicsObjects(JSON.parse(JSON.stringify(sceneToLoad.objects.filter((obj: PhysicsObject) => obj.type !== ObjectType.PLANE))));
    setInitialConstraints(JSON.parse(JSON.stringify(sceneToLoad.constraints)));
    setSelectedObjectId(null);
    setGizmoMode(null);
    alert(`장면 '${sceneToLoad.name}'을(를) 불러왔습니다.`);
  }, [savedScenes, physicsObjects, constraints, pushToUndoStack]);

  const handleDeleteScene = useCallback((sceneId: string) => {
    console.log(LOG_PREFIX_APP, `Deleting scene: ${sceneId}`);
    setSavedScenes(prevScenes => prevScenes.filter(s => s.id !== sceneId));
    alert("장면이 삭제되었습니다.");
  }, []);

  const handleRenameScene = useCallback((sceneId: string, newName: string) => {
    console.log(LOG_PREFIX_APP, `Renaming scene ${sceneId} to: ${newName}`);
    setSavedScenes(prevScenes => 
      prevScenes.map(s => (s.id === sceneId ? { ...s, name: newName, timestamp: Date.now() } : s))
                .sort((a,b) => b.timestamp - a.timestamp)
    );
    alert("장면 이름이 변경되었습니다.");
  }, []);

  const handleOverwriteScene = useCallback((sceneId: string) => {
    console.log(LOG_PREFIX_APP, `Overwriting scene: ${sceneId}`);
    pushToUndoStack(physicsObjects, constraints); 
    setSavedScenes(prevScenes =>
      prevScenes.map(s =>
        s.id === sceneId
          ? {
              ...s, name: s.name, timestamp: Date.now(),
              objects: JSON.parse(JSON.stringify(physicsObjects)),
              constraints: JSON.parse(JSON.stringify(constraints)),
              globalPhysicsSettings: JSON.parse(JSON.stringify(globalPhysicsSettings)),
            }
          : s
      ).sort((a,b) => b.timestamp - a.timestamp)
    );
    alert("장면을 현재 상태로 덮어썼습니다.");
  }, [physicsObjects, constraints, globalPhysicsSettings, pushToUndoStack]);

  const handleImportScenes = useCallback((importedScenesData: SavedScene[]) => {
    console.log(LOG_PREFIX_APP, `Importing ${importedScenesData.length} scenes.`);
    if (!Array.isArray(importedScenesData)) {
      alert("가져오기 실패: 파일 형식이 올바르지 않습니다. 장면 배열이 필요합니다.");
      return;
    }
  
    const scenesWithNewIds = importedScenesData.map(scene => {
      if (
        typeof scene.name !== 'string' || typeof scene.timestamp !== 'number' ||
        !Array.isArray(scene.objects) || !Array.isArray(scene.constraints) ||
        typeof scene.globalPhysicsSettings !== 'object' ||
        !scene.objects.every((obj: any) => typeof obj.id === 'string' && typeof obj.type === 'string')
      ) {
        console.warn(LOG_PREFIX_APP, "Skipping invalid scene during import due to missing/invalid basic properties:", scene);
        return null; 
      }
      return { ...scene, id: generateId() };
    }).filter(scene => scene !== null) as SavedScene[];
  
    if (scenesWithNewIds.length === 0 && importedScenesData.length > 0) {
       alert("가져오기 실패: 유효한 장면을 파일에서 찾을 수 없습니다. 각 장면에는 name, timestamp, objects, constraints, globalPhysicsSettings가 포함되어야 합니다.");
       return;
    }
    
    if (scenesWithNewIds.length > 0) {
      pushToUndoStack(physicsObjects, constraints); 
      setSavedScenes(prevScenes => 
        [...prevScenes, ...scenesWithNewIds].sort((a,b) => b.timestamp - a.timestamp)
      );
      alert(`${scenesWithNewIds.length}개 장면을 성공적으로 가져왔습니다.`);
    } else if (importedScenesData.length === 0) {
      alert("가져올 장면이 없습니다. 파일이 비어있거나 장면 데이터가 없습니다.");
    }
  }, [physicsObjects, constraints, pushToUndoStack]);


  const selectedObject = physicsObjects.find(obj => obj.id === selectedObjectId) || null;
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const isAiDisabled = geminiApiKeyStatus === 'NOT_CONFIGURED' || geminiApiKeyStatus === 'LOADING';


  return (
    <div className="flex flex-col md:flex-row w-screen h-screen bg-gray-900 text-gray-100">
      
      <div className="hidden md:flex md:flex-col md:w-auto md:min-w-[280px] md:order-1 bg-gray-800">
        <ApiKeyManager
            apiKey={userApiKeyInput}
            onApiKeyChange={handleUserApiKeyInputChange}
            onSaveApiKey={handleSaveUserApiKey}
            status={geminiApiKeyStatus}
        />
        <div
          className="p-3 cursor-pointer bg-gray-800 hover:bg-gray-700 border-b border-gray-700 flex items-center justify-between"
          onClick={openHelpModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openHelpModal()}
          aria-haspopup="dialog"
          aria-expanded={isHelpModalOpen}
        >
          <h3 className="text-md font-semibold text-gray-100 flex items-center">
            <HelpIcon className="w-5 h-5 mr-2 text-gray-300" />
            도움말
          </h3>
          <span className="text-xs text-sky-400">열기</span>
        </div>

        <CollapsiblePanel 
          title="객체 추가"
          isOpen={panelCollapseStates.objectPalette}
          onToggle={() => handleTogglePanel('objectPalette')}
          headerClassName="p-3 cursor-pointer bg-gray-800 hover:bg-gray-700 border-b border-gray-700"
        >
          <ObjectPalette onAddObject={handleAddObject} />
        </CollapsiblePanel>

        <CollapsiblePanel 
            title="AI 장면 생성"
            isOpen={panelCollapseStates.aiControls}
            onToggle={() => handleTogglePanel('aiControls')}
        >
            <AIControls 
                onGenerateScene={handleGenerateSceneWithAI}
                isLoading={isAIGenerating}
                error={aiGenerationError}
                disabled={isAiDisabled}
            />
        </CollapsiblePanel>

        <CollapsiblePanel 
          title="전역 설정"
          isOpen={panelCollapseStates.globalSettings}
          onToggle={() => handleTogglePanel('globalSettings')}
        >
          <GlobalSettingsPanel 
            currentSettings={globalPhysicsSettings}
            onGravityChange={handleGravityChange}
            onSimulationSpeedChange={handleSimulationSpeedChange}
          />
        </CollapsiblePanel>

        <CollapsiblePanel 
          title="제약 조건 편집기"
          isOpen={panelCollapseStates.constraintEditor}
          onToggle={() => handleTogglePanel('constraintEditor')}
          className="flex-grow flex flex-col min-h-0" 
          contentClassName="flex-grow flex flex-col min-h-0" 
        >
          <ConstraintEditor 
              physicsObjects={physicsObjects}
              constraints={constraints}
              onAddConstraint={handleAddConstraint}
              onDeleteConstraint={handleDeleteConstraint}
          />
        </CollapsiblePanel>

        <div
          className="p-3 cursor-pointer bg-gray-800 hover:bg-gray-700 border-b border-t border-gray-700 flex items-center justify-between"
          onClick={openSceneLibraryModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openSceneLibraryModal()}
          aria-haspopup="dialog"
          aria-expanded={isSceneLibraryModalOpen}
        >
          <h3 className="text-md font-semibold text-gray-100 flex items-center">
            <LibraryIcon className="w-5 h-5 mr-2 text-gray-300" />
            장면 라이브러리
          </h3>
          <span className="text-xs text-sky-400">열기</span>
        </div>
        
        <div className="flex-shrink-0 mt-auto"> 
          <GizmoControls 
            currentMode={gizmoMode}
            onSetMode={handleSetGizmoMode}
            simulationStatus={simulationStatus}
            selectedObjectId={selectedObjectId}
          />
          <Controls
            simulationStatus={simulationStatus}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onResetScene={() => handleResetScene(true)}
          />
        </div>
        <div className="flex-shrink-0">
          <CameraControls onSetView={handleSetCameraView} />
        </div>
      </div>

      <div className="flex-grow h-3/5 md:h-full order-1 md:order-2 bg-gray-600 relative">
        <PhysicsCanvas 
            ref={physicsCanvasRef}
            objects={physicsObjects} 
            bodiesState={bodiesState} 
            onSelectObject={handleSelectObject}
            selectedObjectId={selectedObjectId}
            gizmoMode={gizmoMode}
            simulationStatus={simulationStatus}
            onUpdateObjectFromGizmo={(id, updates) => handleUpdateObject(id, updates, true)}
        />
      </div>

      <div
        className={`
          w-full md:w-80
          order-2 md:order-3
          bg-gray-800 shadow-lg
          overflow-y-auto properties-editor-scrollbar 
          h-2/5 md:h-full
          flex flex-col 
        `}
      >
        <div className="md:hidden p-3 space-y-3">
          <ApiKeyManager
              apiKey={userApiKeyInput}
              onApiKeyChange={handleUserApiKeyInputChange}
              onSaveApiKey={handleSaveUserApiKey}
              status={geminiApiKeyStatus}
          />
           <button
            onClick={openHelpModal}
            className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-150 ease-in-out shadow-md flex items-center justify-center space-x-2"
            aria-haspopup="dialog"
            aria-expanded={isHelpModalOpen}
          >
            <HelpIcon className="w-5 h-5" />
            <span>도움말 보기</span>
          </button>
          <ObjectPalette onAddObject={handleAddObject} />
          <AIControls 
            onGenerateScene={handleGenerateSceneWithAI}
            isLoading={isAIGenerating}
            error={aiGenerationError}
            disabled={isAiDisabled}
          />
          <GlobalSettingsPanel 
            currentSettings={globalPhysicsSettings}
            onGravityChange={handleGravityChange}
            onSimulationSpeedChange={handleSimulationSpeedChange}
          />
           <ConstraintEditor 
            physicsObjects={physicsObjects}
            constraints={constraints}
            onAddConstraint={handleAddConstraint}
            onDeleteConstraint={handleDeleteConstraint}
          />
          <button
            onClick={openSceneLibraryModal}
            className="w-full p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-150 ease-in-out shadow-md flex items-center justify-center space-x-2"
            aria-haspopup="dialog"
            aria-expanded={isSceneLibraryModalOpen}
          >
            <LibraryIcon className="w-5 h-5" />
            <span>장면 라이브러리 열기</span>
          </button>
          <GizmoControls 
            currentMode={gizmoMode}
            onSetMode={handleSetGizmoMode}
            simulationStatus={simulationStatus}
            selectedObjectId={selectedObjectId}
          />
          <Controls
            simulationStatus={simulationStatus}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onResetScene={() => handleResetScene(true)}
          />
          <CameraControls onSetView={handleSetCameraView} />
        </div>

        <div className="flex-grow overflow-y-auto properties-editor-scrollbar">
          <PropertiesEditor
            selectedObject={selectedObject}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            onFocusObject={handleFocusObject}
            onApplyImpulse={handleApplyImpulse}
            simulationStatus={simulationStatus}
          />
        </div>
      </div>

      <SceneLibraryPanel
        isOpen={isSceneLibraryModalOpen}
        onClose={closeSceneLibraryModal}
        savedScenes={savedScenes}
        onSaveCurrentScene={handleSaveCurrentScene}
        onLoadScene={handleLoadScene}
        onDeleteScene={handleDeleteScene}
        onRenameScene={handleRenameScene}
        onOverwriteScene={handleOverwriteScene}
        onImportScenes={handleImportScenes}
      />
      <HelpModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
    </div>
  );
};

export default App;
