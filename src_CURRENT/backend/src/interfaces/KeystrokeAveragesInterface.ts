import { CharacterData } from "./ProfileCalibration";

/**
 * Object that contains the data for determining a successful login
 */
export interface KeystrokeAverages {
    averageData: CharacterData[],
    total: number
}