//Require dependencies
//WebApp routing
const express = require('express');

//File system
const fs = require('fs');

//Loads HTML documents into a variable
const cheerio = require('cheerio');

//Port number
const port = 3000;

const fileHeader = '{\n ';

//Create app
var app = express();

//Set the app's settings
app.use(express.static('content'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Notifies that the server is up and running 
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
});

//Main Page mapping
app.get('/', (req, res) => {
    res.redirect('/testKeylogger')
});

app.get('/testKeylogger', (req, res) => {

    //Load the page HTML into a variable with Cheerio
    let $ = cheerio.load(fs.readFileSync(__dirname + '/content/testingPage.html'));

    //True if notice is an error
    let errorFlag = false;

    //True if notice is a message
    let messageFlag = false;
    
    //Setting up the document to view messages
    $('#confirmIdSignup').removeAttr('hidden');
    $('#confirmPasswordSignup').removeAttr('hidden');
    $('#newUserForm').attr('action', '/initialSignupCheck');

    //Error for: entered two different IDs during calibration
    if(req.query.failure === 'ID') {
        $('#userMessage').text('Error: Please make sure the IDs match');
        errorFlag = true;
    } 
    
    //Error for: entered two different passwordss during calibration
    else if(req.query.failure === 'password') {
        $('#userMessage').text('Error: Please make sure the passwords match');
        errorFlag = true;
    } 

    //Error for: did not fully fill-in login form
    else if(req.query.failure === 'badJSON') {
        $('#userMessage').text('Error: Please only hit the submit button after filling out both fields');
        errorFlag = true;
    } 
    
    //Message for: processing a login profile
    else if(req.query.processing === 'true') {
        $('#userMessage').text('ID ' + req.query.user + ' processing registration');
        messageFlag = true;
    } 
    
    //Message for: successfully creating a profile
    else if(req.query.success === 'true') {
        $('#userMessage').text('ID ' + req.query.user + ' successfully registered');
        messageFlag = true;
    } 
    
    //Error for: failing to create a profile
    else if(req.query.success === 'false') {
        $('#userMessage').text('There was an error registering' + req.query.id + ', please try again');
        errorFlag = true;
    } 
    
    //Message for: successfully accessing the user's resources
    else if(req.query.loginStatus === 'success') {
        $('#userMessage').text('Can successfully access ' + req.query.id + '\'s resources');
        messageFlag = true;
    } 
    
    //Message for: failing to access the user's resources
    else if(req.query.loginStatus === 'failure') {
        $('#userMessage').text('Access to ' + req.query.id + '\'s resources not permitted');
        messageFlag = true;
    } 
    
    //Message for: trying to log in with an non-existant login
    else if(req.query.loginStatus === 'dne') {
        $('#userMessage').text('There is no profile with these credentials');
        messageFlag = true;
    }

    //If the message is an error, put it in red
    if(errorFlag) {
        $('#userMessage').css('color', 'red');
    }

    //If there's a message, show it
    if(errorFlag || messageFlag) {
        $('#userMessageContainer').removeAttr('hidden');
    }

    //Render the document
    res.send($.html());
});

//Endpoint for determining whether a user's login is valid or not 
app.post('/processLogin', (req, res) => {
 
    //Construct a JSON-formatted string consisting of the data from the login attempt
    jsonString = '{ "id": "' + req.body.idLogin + '", "password": "' + req.body.passwordLogin + '", "id_time": ' + 
    req.body.idLoginData + ', "password_time": ' + req.body.passwordLoginData + '}';

    //Turn the JSON-formatted string into a JSON object
    jsonString = JSON.parse(jsonString);

    //Compute whether or not the login should be accepted
    loginSuccessful = compareFrequencyData(jsonString, __dirname + '/users/user_data/' + req.body.idLogin + '_profile.json');

    //Put the login status and the ID entered into the URI
    res.redirect('/testKeylogger?loginStatus=' + loginSuccessful + '&id=' + req.body.idLogin);
});

//Endpoint that determines whether or not calibration can begin
app.post('/initialSignupCheck', (req, res) => {

    //Check that the same ID was entered twice
    if(req.body.idSignup === req.body.idSignupConfirmation) {

        //Check that the same password was entered twice 
        if(req.body.passwordSignup === req.body.passwordSignupConfirmation) {

            //If successful, start creating the profile 
            recordInitialSignupData(req.body.idSignup, req.body.passwordSignup, 'one');

            //Go start the calibration process
            res.redirect('calibrationPage?iteration=1');
        } else {

            //If passwords do not match
            res.redirect("/testKeylogger?failure=password");
        }
    } else {

        //If IDs do not match
        res.redirect("/testKeylogger?failure=ID");
    }
});

//Load the calibration page
app.get('/calibrationPage', (req, res) => {

    //Get the current iteration number
    let iteration = req.query.iteration;

    //Load the page
    let $ = cheerio.load(fs.readFileSync(__dirname + '/content/testingPage.html'));

    //Set up the page for calibration
    $('#newUserForm').attr('action', '/appendKeyloggerData?iteration=' + ++iteration);
    $('#userMessageContainer').removeAttr('hidden');
    $('#userMessage').text('Currently on entry ' + req.query.iteration + ' of 7');
    $('#navButtons').attr('hidden', true);
    $('#newUser').removeAttr('hidden');
    
    //If the previous iteration failed because the password was wrong, display appropriate message
    if(req.query.failure === 'password') {
        $('#userMessage').text('Currently on entry ' + req.query.iteration +
        ' of 7.\nPlease make sure the password you enter matches the password before starting calibration');
    } 
    
    //If the previous iteration failed because the ID was wrong, display appropriate message
    else if(req.query.failure == 'ID') {
        $('#userMessage').text('Currently on entry ' + req.query.iteration +
        ' of 7.\nPlease make sure the ID you enter matches the ID before starting calibration');
    }
    res.send($.html());
});

//Process the data from the calibration round
app.post('/appendKeyloggerData', (req, res) => {

    //Determine if the login credentials are correct
    correctLoginData = checkComboDuringCalibration(req.body.idSignup, req.body.passwordSignup, 'one');

    //If the password does not match the login
    if(correctLoginData === 0) {
        console.log('Password does not match the account password');
        res.redirect('/calibrationPage?iteration=' + --req.query.iteration + '&failure=password');
        return;
    } 
    
    //If the ID does not match the login
    else if(correctLoginData === -1) {
        console.log('ID does not match the profile ID');
        res.redirect('/calibrationPage?iteration=' + --req.query.iteration + '&failure=ID');
        return;
    }
    
    //If the login is correct...
    //Make a JSON-styled string from the recored signup data
    jsonDataString = makeDataArray(req.body.idSignupData, req.body.passwordSignupData);

    //If there was an error making the JSON, then repeat the calibration number
    if(jsonDataString === null) {
        res.redirect('/calibrationPage?iteration=' + --req.query.iteration + '&failure=badJSON');
        return;
    }

    //Add the JSON data to the login profile
    appendToProfileCreation(__dirname + '/users/user_data/' + req.body.idSignup + '_profile_creation.json', jsonDataString, 'One', req.query.iteration-1, false);

    //If all seven calibration phases aren't done, then go to the next one
    if(req.query.iteration < 8) {
        redirectPath = '/calibrationPage?iteration=' + req.query.iteration;
        res.redirect(redirectPath);
    } 
    
    //If calibration is done...
    else {

        //Close the user-profile json object
        setTimeout(()=> {
            appendToProfileCreation(__dirname + '/users/user_data/' + req.body.idSignup + '_profile_creation.json', jsonDataString, 'One', req.query.iteration-1, true);
        },2000);

        //Use the profile file to create the file with the averaged user data used during login
        setTimeout(() => {
            generateFinalProfile(__dirname + '/users/user_data/' + req.body.idSignup + '_profile_creation.json',
            __dirname + '/users/user_data/' + req.body.idSignup + '_profile.json', req.body.idSignup, req.body.passwordSignup);
        }, 25000);
       
        //Redirection with notice that signup was successful
        res.redirect('/testKeylogger?success=true&user=' + req.body.idSignup);
    }
    
});

/* ---------- Setup for functions that help process the keylogging data ---------- */

/* This function creates and formats the file that holds the data from each ID/PW entry pair during calibration */
function recordInitialSignupData(id, password, hypothesis_num) {

    // Create the file with the appropriate text in the correct location in the file system
    fs.writeFile(__dirname + '/users/user_data/' + 
    id + '_profile_creation.json', fileHeader + '"id": "' + id + '",\n "password": "' + password + '", \n ', err => {
        if(err) {

            //notify the user there was an error with the system and redirect to the original signup page
            $('#userMessageContainer').removeAttr('hidden');
            $('#userMessage').css('color', 'red');
            $('#userMessage').text('There was an error logging the data, please try again');

            //Delete the file if there was a problem
            deleteFile(__dirname + '/users/user_data/' + id + '_profile_creation.json');

            //Redirect to the start page
            res.redirect('/testKeylogger' + hypothesis_num.charAt(0).toUpperCase() + hypothesis_num.slice(1));
        }
    });
}

/* This function Inserts the JSON-formatted response from the front end */
function appendToProfileCreation(path, string, upper_hypothesis_num, entry_num, end) {

    //Create the actual JSON string to add to the user_profile_creation file
    //If there is more data to add to the user_profile_creation...
    if(!end) {
        string = '"entry_' + entry_num + '": ' + string;
        if(entry_num < 7) { 
            string += ',\n ';
        } 
        fs.writeFile(path, string, { flag: 'a' }, err => {
            if(err) {

                //notify the user there was an error with the system and redirect to the original signup page
                $('#userMessageContainer').removeAttr('hidden');
                $('#userMessage').css('color', 'red');
                $('#userMessage').text('There was an error logging the data, please try again');
    
                //Delete the file if there was a problem
                deleteFile(path);
    
                //Redirect to the start page
                res.redirect('/testKeylogger');
            }
        });
    } 
    
    //Since there is no more data to add, close the user_profile_creation
    else {
        fs.writeFile(path, '\n}', { flag: 'a' }, err => {
            if(err) {

                //notify the user there was an error with the system and redirect to the original signup page
                $('#userMessageContainer').removeAttr('hidden');
                $('#userMessage').css('color', 'red');
                $('#userMessage').text('There was an error logging the data, please try again');
    
                //Delete the file if there was a problem
                deleteFile(path);
    
                //Redirect to the start page
                res.redirect('/testKeylogger');
            }
        });
    }

}

/* This function takes the keylogger data for the ID and password and formats them into a JSON arrray */
function makeDataArray(idData, passwordData) {

    //Create the JSON-styled string and turn it into a JSON object
    jsonArray = '[' + idData + ', ' + passwordData + ']';
    try {
        JSON.parse(jsonArray);
    } catch(err) {
        return null;
    }

    //Return the JSON object
    return jsonArray;
}

/* Delete File From the filesysetm */
function deleteFile(path) {
    fs.unlink(path, err => {
        if(err) {
            console.log(path + '. Please remove the file manually');
        }
    });
}

/* This method checks if the ID/PW combo entered during the calibration phases is even correct
   If it's not, redirect to the same page without updating any information */
   function checkComboDuringCalibration(id, password, hypothesis_num) {

    //Set empty string where data from user_profile_creation will be stored
    data = '';
    try {

        //Read in the profile data 
        data = fs.readFileSync(__dirname + '/users/user_data/' + id + '_profile_creation.json');
    } catch(err) {
        return -1;
    }

    //Retrieve the username and password data from the user_profile_creation
    data = String(data).split('\n');
    data.length = 3;
    jsonData = '';
    for(var i = 0; i < data.length; i++) { 
        jsonData += data[i];
    }
    jsonData = jsonData.substring(0, jsonData.length-2);
    jsonData += '}';

    //Turn those two fields into a temp JSON object
    jsonData = JSON.parse(jsonData);

    //If current login data matches record, return 1
    //If current ID does not match record ID, return -1
    //If current ID matches but password does not, return 0
    if(jsonData.id === id) {
        if(jsonData.password === password) {
            //success
            return 1;
        } else{ 
            return 0;
        }
    } else {
        return -1;
    }
}

/* This method should generate the final user profile with the averaged data and whatnot */
function generateFinalProfile(oldPath, newPath, id, password) {

    //Get all the calibration data
    testData = JSON.parse(String(fs.readFileSync(oldPath)));

    //Create a the start of a new JSON object in string form 
    beginningofJSON = '{\n "id": "' + id + '",\n "password": "' + password + '",\n'

    //Caluclate the average time interval between each key press in the ID
    avgKeyPressID = ' "id_averages": {' + getAverageTimePerInterval(testData, 'id').toString() + '}, \n';

    //Caluclate the average time interval between each key press in the password
    avgKeyPressPassword = ' "password_averages": {' + getAverageTimePerInterval(testData, 'password').toString() + '}\n}';

    //Combine all the generated JSON-styled string keylog data into an object
    finalJSON = JSON.parse(beginningofJSON + avgKeyPressID + avgKeyPressPassword);

    // Create the file with the appropriate text in the correct location in the file system
    fs.writeFile(newPath, JSON.stringify(finalJSON, null, '\t'), (err) => {
        if(err) {
            console.log('oof');
        }
    });
}

// Get the average time 
function getAverageTimePerInterval(data, input) {

    //Need to get the value accoring to the jth key in entry_i and split the value by '|'
    let aggregate = 0;

    //Calculations if ID is passed...
    if(input === 'id') {
        let idLen = Object.keys(data['entry_1'][0]).length;
        let idAvgs = [];

        //populates the id array above
        for(let i = 0; i <= idLen; i++) {
            
            //Stores the individual intervals for each calibration run for a single character
            let keySpeedMillis = [];
            let character = '';

            //If the average calculation is now complete...
            if(i === idLen) {
                
                //Add the total entry time for that character across the five best calabration rounds to the JSON string
                character = 'total';
                let avgString = ('"' + character + '": ' + aggregate);
                idAvgs[i] = avgString;

                //Return it all as a JSON-styled string
                return idAvgs;
            }

            //iterates through JSON entries 1 - 7 inclusive
            for(let j = 1; j < 8; j++) {

                //Character entered is value[0]
                //Interval for that character in a single calibration phase is value[1]
                let value = data['entry_' + j][0][i+1].split('|');
                if(character === '') {
                    character = value[0];
                }

                //Add the speed for the single interval into the keySpeedMillis array
                keySpeedMillis[j-1] = parseInt(value[1]);
            }

            //Sort the intervals from lowest to highest to easily disregard the worst times as an outlier
            keySpeedMillis = keySpeedMillis.sort((a, b) => {
                return a - b;
            });
            
            //Get the average of the five fastest calibration runs
            let avg = 0;
            for(let j = 0; j < 5; j++) {
                avg += keySpeedMillis[j];
            }

            //Calculate the five best average intervals for that letter
            avg = (avg / 5).toFixed(0);

            //Save that average in aggregate to get total 
            aggregate += parseInt(avg);
            let key = i+1;
            
            //avgString is the JSON format that ends up in the final user profile
            let avgString = ('"' + key + '": "' + character + '|' + avg + '"');
            idAvgs[i] = avgString;
        }
    } 
    
    //Calculations if PASSWORD is passed...
    //This else if block is virtually the same as the if block above, so I won't add comments.
    //Perhaps in the future, I will clean this up into a single block
    else if(input === 'password') {
        let passwordLen = Object.keys(data['entry_1'][1]).length;;
        let passwordAvgs = [];

        //populates the passwordAvgs array above
        for(let i = 0; i <= passwordLen; i++) {
            let keySpeedMillis = [];
            let character = '';
            if(i === passwordLen) {
                character = 'total';
                let avgString = ('"' + character + '": ' + aggregate);
                passwordAvgs[i] = avgString;
                return passwordAvgs;
            }
            //iterates through JSON entries 1 - 7 inclusive
            for(let j = 1; j < 8; j++) {
                let value = data['entry_' + j][1][i+1].split('|');
                if(character === '') {
                    character = value[0];
                }
                keySpeedMillis[j-1] = parseInt(value[1]);
            }
            keySpeedMillis = keySpeedMillis.sort((a, b) => {
                return a - b;
            });
            let avg = 0;
            for(let j = 0; j < 5; j++) {
                avg += keySpeedMillis[j];
            }
            avg = (avg / 5).toFixed(0);
            aggregate += parseInt(avg);
            let key = i+1;
            let avgString = ('"' + key + '": "' + character + '|' + avg + '"');
            passwordAvgs[i] = avgString;
        }
    }
}

//Determines whether or not a login match is found
function compareFrequencyData(login, filepath) {
    let userProfile = null;

    //Load the user profile from the user_profile file
    try {
        userProfile = JSON.parse(String(fs.readFileSync(filepath)));
    } catch(error) {
        return 'dne';
    }

    console.log("\n---------------- Stored User Profile Data ----------------");
    console.log(userProfile);
    console.log('\n');

    console.log("---------------- Attempted Login Data ----------------");
    console.log(login);
    console.log('\n');

    //If the login entered is not yet registered, return dne ('does not exist')
    if(userProfile.id !== login.id || userProfile.password !== login.password) {
        return 'dne';
    }

    //Determine whether or not the ID interval sufficiently matches the user profile
    let length = Object.keys(login.id_time).length;
    let idMatches = 0;

    //Go through ID interval data...
    for(var i = 2; i < length; i++) {
        console.log(userProfile.id_averages[i]);
        
        //If the interval is good, increase the number of idMatches by one
        if(marginOfError(userProfile.id_averages, login.id_time, i, false)) {
            idMatches++;
        }
    } 

    //Log a notice that the match was successful for that character
    console.log('Total number of id matches: ' + idMatches);

    //Check if the aggregate average of the intervals is valid
    let idTotalMargin = marginOfError(userProfile.id_averages, login.id_time, 0, true);

    // console.log((idMatches/(length - 2)));
    // console.log(!idTotalMargin);

    //If the aggregate total check or enough individual ID matches fall in the success threshold, pass the ID entry 
    if(!idTotalMargin || (idMatches/(length - 2)) < 0.60) {
        if(idMatches + 1 !== length - 1) {
            console.log('Could not rhythmically authenticate ID');
            return 'failure';
        }
    }
    console.log('\nSuccesfully recognized ID\n');

    //Check passwords
    //Exact same process as above for the username takes place for the password
    length = Object.keys(login.password_time).length;
    let passwordMatches = 0;
    for(var i = 2; i < length; i++) {
        console.log(userProfile.password_averages[i]);

        if(marginOfError(userProfile.password_averages, login.password_time, i, false)) {
            passwordMatches++;
        }
    }
    console.log('Total number of password matches: ' + passwordMatches);
    let passwordTotalMargin = marginOfError(userProfile.password_averages, login.password_time, 0, true);
    
    //console.log((passwordMatches/(length - 2)));
    //console.log(!passwordTotalMargin);
    
    if(!passwordTotalMargin || (passwordMatches/(length - 2)) < 0.60) {
        if(passwordMatches + 1 === length - 1) {
            return 'success';
        }
        console.log('Could not rhythmically authenticate password');
        return 'failure'; 
    }

    console.log('\nSuccesfully recognized password\n\n---------- USER ' + userProfile.id.toUpperCase() + ' SUCCESSFULLY AUTHENTICATED ----------');
    return 'success';
}

//Determine whether or not an individual interval or the aggregate entry should be accepted
function marginOfError(profile, login, index, last) {

    //Individual character threshold
    if(!last) {
        //Get the average login data from the profile
        let first = parseInt(profile[index].split('|')[1]);

        //Get the login attempt data
        let second = parseInt(login[index].split('|')[1]);

        //Set the accepted threshold to 40% above or below the exact entry interval
        let high = (first * 1.40).toFixed(0);
        let low = (first * 0.60).toFixed(0);

        //Log the lower and upper thesholds with the actual login attempt interval in between
        console.log(low);
        console.log(second);
        console.log(high);

        //If it's within the threshold or less than a 50ms difference between the actual time and the profile time,
        //interval should be accepted
        if(second > low && second < high || Math.abs(first - second) <= 50) {
            console.log(index + ' falls within the margin of error');
            if(Math.abs(first - second) <= 50 && !(second > low && second < high)) {
                console.log('Difference between login interval and profile interval (' + Math.abs(first - second) + ') is less than 50ms\n');
            } else {
                console.log('\n');
            }
            return true;
        } else {
            console.log(index + ' does not fall within the margin of error\n');
            return false;
        }
    } 
    
    //Aggregate average threshold
    else {

        //Get the average login data from the profile
        let first = profile['total'];

        //Get the login attempt data
        let second = login['total'];

         //Set the accepted threshold to 20% above or below the exact entry interval
        let high = (first * 1.20).toFixed(0);
        let low = (first * 0.80).toFixed(0);

        //Log the lower and upper thesholds with the actual login attempt interval in between
        console.log('\nAverage aggregate entry time:')
        console.log(low);
        console.log(second);
        console.log(high);

        //If total login entry is within the threshold,
        //or less than a 50ms difference between the actual time and the profile time,
        //attempt should be accepted
        if(second > low && second < high || Math.abs(first - second) <= 50) {
            return true;
        } else {
            return false;
        }
    }
}