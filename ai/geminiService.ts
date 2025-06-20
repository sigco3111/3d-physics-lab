
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AISceneResponse } from '../types';

// This is the API key provided at build time (if any)
const SYSTEM_API_KEY = process.env.API_KEY;
const trimmedSystemApiKey = SYSTEM_API_KEY ? SYSTEM_API_KEY.trim() : null;

let dynamicApiKey: string | null = null;

if (!trimmedSystemApiKey) {
  console.warn("System API_KEY (process.env.API_KEY) is not set or is empty/whitespace. AI scene generation will rely on user-provided key.");
} else {
  console.log("System API_KEY found and appears non-empty.");
}

export function setDynamicApiKey(key: string | null): void {
  dynamicApiKey = key;
  if (dynamicApiKey) {
    console.log("User-provided dynamic API key has been set for Gemini service.");
  } else {
    console.log("User-provided dynamic API key has been cleared. Will fallback to system key if available.");
  }
}

export function isSystemKeyAvailable(): boolean {
  return !!trimmedSystemApiKey;
}

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const generateSceneDescription = async (userPrompt: string): Promise<string> => {
  const apiKeyToUse = dynamicApiKey || trimmedSystemApiKey; // Use trimmed system key

  if (!apiKeyToUse) { // This check now correctly handles empty/whitespace system keys
    const errorMsg = "Gemini API Key is not configured. Please set an API key in the settings to use AI features.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

  const fullPrompt = `
You are a helpful assistant for a 3D physics simulation.
Generate a scene based on the following user prompt.
The scene should be described in JSON format.
The JSON must have a top-level key "objects", which is an array.
It can optionally have "constraints" (an array) and "globalPhysicsSettings" (an object).

Each object in the "objects" array must have:
  - "tempId": string (a unique temporary ID, e.g., "object1", "object2", for referencing in constraints)
  - "type": string (SPHERE, BOX, CYLINDER, CONE, CAPSULE, TORUS)
  - "position": { "x": number, "y": number, "z": number } (values typically between -10 and 10 for x/z, and 0.5 to 10 for y)
  - "rotation": { "x": number, "y": number, "z": number } (Euler angles in degrees, 0-360)
  - "color": string (hex color, e.g., "#RRGGBB")
  - "properties": an object containing:
    - "mass": number (e.g., 0.1-100, must be > 0 for dynamic objects)
    - "friction": number (0-1)
    - "restitution": number (0-1)
    - "velocity": { "x": number, "y": number, "z": number } (optional, default 0,0,0)
    - "angularVelocity": { "x": number, "y": number, "z": number } (optional, default 0,0,0)
    - "metalness": number (0-1, optional, default 0.1)
    - "roughness": number (0-1, optional, default 0.7)
    - Shape-specific properties. Ensure these are appropriate for the type and have reasonable positive values:
      - SPHERE: { "radius": number (e.g., 0.2-3) }
      - BOX: { "size": { "x": number, "y": number, "z": number } (e.g., each 0.2-5) }
      - CYLINDER: { "radiusTop": number, "radiusBottom": number, "height": number, "numSegments": number (e.g., 8-32) }
      - CONE: { "radius": number, "height": number, "numSegments": number (e.g., 8-32) }
      - CAPSULE: { "radius": number, "height": number } (height is for the cylindrical part)
      - TORUS: { "radius": number (main radius), "tube": number (tube radius), "radialSegments": number, "tubularSegments": number }
Keep object dimensions and positions reasonable for a small simulation. Avoid objects interpenetrating initially.
Generate between 2 to 7 objects.

"constraints" (optional) should be an array of constraint objects. Each constraint object must have:
  - "type": string (POINT_TO_POINT, HINGE, LOCK, DISTANCE)
  - "bodyAId": string (must match a "tempId" from one of the generated objects)
  - "bodyBId": string (must match a "tempId" from one of the generated objects, different from bodyAId)
  - "pivotA": { "x": number, "y": number, "z": number } (local offset on bodyA)
  - "pivotB": { "x": number, "y": number, "z": number } (local offset on bodyB)
  - "axisA" (optional, for HINGE): { "x": number, "y": number, "z": number } (default {x:0,y:1,z:0})
  - "axisB" (optional, for HINGE): { "x": number, "y": number, "z": number } (default {x:0,y:1,z:0})
  - "distance" (optional, for DISTANCE): number (>0)
Generate 0 to 3 constraints. Ensure referenced body IDs are valid.

"globalPhysicsSettings" (optional) object can have:
  - "gravity": { "x": number, "y": number, "z": number } (e.g., y usually negative)
  - "simulationSpeed": number (0.1-2)

User prompt: "${userPrompt}"

Provide only the JSON object as your response, without any surrounding text, explanations, or markdown fences.
The JSON output must strictly follow this structure.
If the prompt is too vague or complex, try to generate a simple, relevant scene (e.g., a few stacked boxes or rolling spheres).
Ensure all numerical property values are valid numbers (not strings).
For object types like CONE, CYLINDER, CAPSULE, TORUS, ensure required dimensions (radius, height, tube etc.) are always present and positive.
Example for a BOX property: "size": {"x": 1, "y": 1, "z": 1}.
Example for a SPHERE property: "radius": 0.5.
All objects should have a 'mass' property greater than 0.
'numSegments', 'radialSegments', 'tubularSegments' should be integers, typically 8 or more.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log("Gemini API Response Text:", response.text);
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // Check for common API key related errors if possible (e.g., based on status codes if available)
        // For now, rethrow with a generic message, specific errors are hard to catch without error types from SDK
        throw new Error(`Gemini API error: ${error.message}. API 키가 유효한지 확인해주세요.`);
    }
    throw new Error("An unknown error occurred with the Gemini API. API 키를 확인해주세요.");
  }
};

export const parseAIResponse = (jsonString: string): AISceneResponse | null => {
  try {
    let parsableString = jsonString.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = parsableString.match(fenceRegex);
    if (match && match[2]) {
      parsableString = match[2].trim();
    }
    
    const parsed = JSON.parse(parsableString);

    if (!parsed.objects || !Array.isArray(parsed.objects)) {
      console.error("Parsed AI response is missing 'objects' array or it's not an array.");
      return null;
    }
    if (parsed.constraints && !Array.isArray(parsed.constraints)) {
      console.error("Parsed AI response has 'constraints' but it's not an array.");
      return null;
    }
    if (parsed.globalPhysicsSettings && typeof parsed.globalPhysicsSettings !== 'object') {
      console.error("Parsed AI response has 'globalPhysicsSettings' but it's not an object.");
      return null;
    }

    return parsed as AISceneResponse;
  } catch (error) {
    console.error("Failed to parse AI scene response:", error, "Raw string:", jsonString);
    return null;
  }
};
