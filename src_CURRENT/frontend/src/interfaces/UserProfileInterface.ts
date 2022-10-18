import type { KeystrokeAverages } from "./KeystrokeAveragesInterface";

export interface UserProfileInterface {

    id: string,
    password: string,   
    idAverages: KeystrokeAverages,
    passwordAverages: KeystrokeAverages

}