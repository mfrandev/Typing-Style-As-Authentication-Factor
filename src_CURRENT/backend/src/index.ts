import app from './server';
import config from '../config.json';
import fs from 'fs';
import type { KeystrokeAverages } from './interfaces/KeystrokeAveragesInterface';
import type { UserProfileInterface } from './interfaces/UserProfileInterface';
import type { KeystrokeTimes, CharacterData } from './interfaces/ProfileCalibration';

// Start the application by listening to specific port
const port = Number(process.env.PORT || config.PORT || 8080);
app.listen(port, () => {
  console.info('Express application started on port: ' + port);
});

/**
 * Endpoint for registering a user in the system
 */
app.post('/processSignup', (req, res) => {

  // Check if user already exists
  let isRegistered = isUsernameRegistered(req.body.username);

  // Null is effectively true
  if(isRegistered === null) {
    return res.status(500).send({message: `Error, username "${req.body.username}" already registered`});
  }

  // If another unexpected error occured, return a failure status with message
  else if(isRegistered.errCode !== 'ENOENT') {
    return res.status(500).send({message: `Error, something went wrong registering "${req.body.username}". Please check the user files and see that ${req.body.username} is not already registered`});
  }

  // Generate the aggregate average data needed for the user profile
  let avgs = calculateUsernameAndPasswordAverages(req.body.entries);

  // Construct the user profile
  const userProfile: UserProfileInterface = {
    username: req.body.username,
    password: req.body.password,
    usernameAverages: avgs.username,
    passwordAverages: avgs.password
  }

  // Save the user profile in the file system
  let success = registerUserProfile(userProfile);

  // If error writing the profile, return a failure status
  if(!success) return res.status(500).send({message: `Something went wrong writing the profile file for "${userProfile.username}"`});

  // Otherwise success
  res.status(200).send({message: `Profile "${userProfile.username}" successfully created`});
});

/**
 * 
 * @param username string: username to check for existance
 * @returns null | {errNo: number, errCode: string}: null on success, object on failure
 */
const isUsernameRegistered = (username: string): null | {errNo: number, errCode: string} => {

  // Save failure data
  let errCode: string;
  let errNo: number;

  // Try to open the the file for the username to create
  try {
    fs.readFileSync(`./src/users/${username}_profile.json`, 'utf8');
  } catch(error: any) {

    // Error means the file does not exist and should be created
    errCode = error.code !== undefined ? error.code : '';
    errNo = error.errno !== undefined ? error.errno : 0;
    return {errCode: errCode, errNo: errNo};
  }

  // Null is effectively true, used for overlap with JSON object
  return null;
}

/**
 * Calculate the aggregate average keystroke data for the username and password
 * @param data KeystrokeTimes[]: Overall keystroke data for username and password over the entire calibration
 * @returns KeystrokeAverages: For both username and password
 */
const calculateUsernameAndPasswordAverages = (data: KeystrokeTimes[]) => {

  // Inner loop is number of calibration rounds
  let inner: number = data.length;

  // Outer loop is the length of the username
  let outer: number = data[0].usernameTimes.length;

  // Store the average time intervals between each character in the username
  const avgUsernameTimes: CharacterData[] = [];

  // Format the above data with the total average time
  let usernameAvg: KeystrokeAverages;

  // Store total average time
  let total: number = 0;

  // Calculate average for each characer in the username
  for(let i = 0; i < outer; i++) {

    // Store all of the times for the current character 
    const times: number[] = [];
    for(let j = 0; j < inner; j++) {
      times.push(data[j].usernameTimes[i].interval);
    }

    // Sort all of the times in increasing order
    times.sort((a, b) => (a - b));

    // Save aggregate of all but the 2 slowest intervals
    let aggregate: number = 0;
    for(let j = 0; j < times.length - 2; j++) {
      aggregate += times[j];
    }

    // Get the average of the intervals 
    aggregate = Math.round((aggregate / (times.length - 2)));

    // Save the aggregate average to the total aggregate average 
    total += aggregate;

    // Push the aggregate average for the current character
    avgUsernameTimes.push({character: data[0].usernameTimes[i].character, interval: aggregate});
  }

  // Format the aggregate average username data as KeystrokeAverages
  usernameAvg = {
    averageData: avgUsernameTimes, 
    total: total
  };

   // Inner loop is number of calibration rounds
  inner = data.length;

  // Outer loop is the length of the password
  outer = data[0].passwordTimes.length;

  // Store the average time intervals between each character in the password
  const avgPasswordTimes: CharacterData[] = [];

  // Format the above data with the total average time
  let passwordAvg: KeystrokeAverages;
  
  // Store total average time
  total = 0;

  // Calculate average for each characer in the password
  for(let i = 0; i < outer; i++) {

    // Store all of the times for the current character 
    const times: number[] = [];
    for(let j = 0; j < inner; j++) {
      times.push(data[j].passwordTimes[i].interval);
    }

    // Sort all of the times in increasing order
    times.sort((a, b) => (a - b));

    // Save aggregate of all but the 2 slowest intervals
    let aggregate: number = 0;
    for(let j = 0; j < times.length - 2; j++) {
      aggregate += times[j];
    }

    // Get the average of the intervals 
    aggregate = Math.round((aggregate / (times.length - 2)));

    // Save the aggregate average to the total aggregate average 
    total += aggregate;

    // Push the aggregate average for the current character
    avgPasswordTimes.push({character: data[0].passwordTimes[i].character, interval: aggregate});
  }

  // Format the aggregate average password data as KeystrokeAverages
  passwordAvg = {
    averageData: avgPasswordTimes, 
    total: total
  };

  // Return the calculated data
  return {
    username: usernameAvg,
    password: passwordAvg
  };

}

// Write the generated aggregate user profile to the filesystem
const registerUserProfile = (profile: UserProfileInterface) => {

  // Catch failures
  try {

    // write (from root of backend) to ./src/users/<username>_profile.json
    fs.writeFileSync(`./src/users/${profile.username}_profile.json`, JSON.stringify(profile, null, 2));
  } 
  
  // Log error and return false on failure
  catch(error) {
    console.log(error);
    return false;
  }

  // Return true on success
  return true;
}

