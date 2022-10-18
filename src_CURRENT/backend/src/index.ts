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

/************************************************************************************
 *                                    Endpoints
 ***********************************************************************************/

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
 * Attempt to log the user in based on the login profile received
 */
app.post('/login', (req, res) => {

  // Get the existing user profile to compare against
  let profile: UserProfileInterface | false = getUserProfile(req.body.username);

  // If the profile does not exist, return proper error message
  if(!profile) return res.status(500).send({message: `Error, username "${req.body.username}" is not registered`});

  // Invalid login credentials
  if(req.body.username !== profile.username || req.body.password !== profile.password) return res.status(500).send({message: `Error, invalid login credentials`});

  // Pretty printing to show how system performs checks
  console.log('');
  console.log('===== CHECKING USERNAME =====');

  // Check if the username was typed correctly
  let status = loginSuccessful(req.body.usernameAverages, profile.usernameAverages);

  // If not, send a failure status with error
  if(!status) return res.status(500).send({message: "Error validating username"});
  console.log('');

  console.log('===== CHECKING PASSWORD =====');

  // Check if the password was typed correctly
  status = loginSuccessful(req.body.passwordAverages, profile.passwordAverages);
  console.log('');

  // If not, return error message
  if(!status) return res.status(500).send({message: "Error validating password"});

  // If nothing went wrong, return success status
  res.status(200).send({message: "Login successful!"});
});

/************************************************************************************
 *                                Helper Functions
 ***********************************************************************************/

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

/**
 *  Write the generated aggregate user profile to the filesystem
 * @param profile UserProfileInterface: data to write to file
 * @returns boolean: true on success, false on failure
 */
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

/**
 * Get the user profile for a specified user
 * @param username string: Check if the file with this username exists
 * @returns UserProfileInterface | false: false if user does not exist, otherwise user
 */
const getUserProfile = (username: string): UserProfileInterface | false => {

  // Catching errors
  try {

    // Get the user profile and return it
    let data = fs.readFileSync(`./src/users/${username}_profile.json`, 'utf-8');
    return JSON.parse(data);
  } 
  
  // Log the error and return failure
  catch(error) {
    console.log(error);
    return false;
  }

}

/**
 * Determine if the login profile is close enough to the saved profile to approve login
 * @param loginAttempt KeystrokeAverages: 
 * @param aggregateData KeystrokeAverages: 
 * @returns boolean: true for successful login, false for failure
 */
const loginSuccessful = (loginAttempt: KeystrokeAverages, aggregateData: KeystrokeAverages): boolean => {

  // If bad login values, return false
  if(loginAttempt.averageData.length !== aggregateData.averageData.length) return false;

  // Set upper and lower threshold ranges for text field
  let lowerThresholdModifier: number = 0.60;
  let upperThresholdModifier: number = 1.40;

  // Save the number of range matches
  let numMatches: number = 0;

  // Set the high and low threshold values
  let high = 0;
  let low = 0;

  // Set the actual value to check against the threshold range
  let actual = 0;

  // Get the number of interval matches for each letter in the entry to the profile
  console.log('Character by character validation:');
  for(let i = 1; i < loginAttempt.averageData.length; i++) {

    // Calculate threshold values
    high = Math.round(aggregateData.averageData[i].interval * upperThresholdModifier);
    low = Math.round(aggregateData.averageData[i].interval * lowerThresholdModifier);

    // Get actual value and print range
    actual = loginAttempt.averageData[i].interval;
    console.log(`if ${low} < ${actual} < ${high}, then numMatches++`);

    // Determine if threshold is met
    if(actual <= low || actual >= high) {

      // Interval difference is quite small, so match is permissible
      if(Math.abs(actual - aggregateData.averageData[i].interval) <= 50) {console.log(`    Since ${Math.abs(actual - aggregateData.averageData[i].interval)} <= 50, numMatches++`);numMatches++;}
    } 
    
    // Simply falls in the range
    else {
      numMatches++;
    }

  }

  // Print if enough matches were made
  console.log(`${numMatches}/${loginAttempt.averageData.length - 1} = ${(numMatches / (loginAttempt.averageData.length - 1))} (>= 0.60 is successful)`);

  // Enough matches were made, return true
  if((numMatches / (loginAttempt.averageData.length - 1)) >= 0.6) {
    return true;
  }

  // If every match was met, return true
  if(numMatches === loginAttempt.averageData.length) {
    console.log(`${numMatches}===${loginAttempt.averageData.length - 1}`);
    return true
  }

  // Check the proximity of the total time for the entry to the profile
  upperThresholdModifier = 1.20;
  lowerThresholdModifier = 0.80;

  // Get new threshold for total 
  high = Math.round(aggregateData.total *  upperThresholdModifier);
  low = Math.round(aggregateData.total * lowerThresholdModifier);

  // Get actual range
  actual = loginAttempt.total;

  // Show range
  console.log('\nTotal time validation');
  console.log(`${low} ---- ${actual} ---- ${high}`);

  // Determine if range for total time was met and if not, return false
  if(actual <= low || actual >= high) {
    console.log(`if ${Math.abs(actual - aggregateData.total)} <= 50, success`);
    if(Math.abs(actual - aggregateData.total) <= 50) return true;
    return false;
  }

  // Success, so return true
  console.log('validation success');
  return true;

}
