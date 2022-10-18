export interface ProfileCalibration {
    username: string,
    password: string,
    entries: KeystrokeTimes[]
}

export interface KeystrokeTimes {
    usernameTimes: CharacterData[],
    passwordTimes: CharacterData[]
}

export interface CharacterData {
    character: string,
    interval: number
}