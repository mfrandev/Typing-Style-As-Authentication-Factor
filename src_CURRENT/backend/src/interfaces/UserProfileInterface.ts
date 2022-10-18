import type { KeystrokeAverages } from "./KeystrokeAveragesInterface";

export interface UserProfileInterface {

    username: string,
    password: string,   
    usernameAverages: KeystrokeAverages,
    passwordAverages: KeystrokeAverages

}