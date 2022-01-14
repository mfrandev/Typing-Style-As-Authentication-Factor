//Creates the client side interval data

//Store for the ID interval JSON data
let idData = '{';

//Store for the Password interval JSON data
let passwordData = '{';

//Timing data for ID
let idStart = 0;
let idEnd = 0;

//Timing data for password
let passwordStart = 0;
let passwordEnd = 0;

//Flag indicating whether the ID or password fields are empty
let idStartFlag = true;
let passwordStartFlag = true;

//Keeps track of which character in the input stream is being JSON-ified
let jsonIdKeyIterator = 1;
let jsonPasswordKeyIterator = 1;

//Keeps track of the total entry time for all keys for ID or password
let aggregateLoginIdTime = 0;
let aggregateLoginPasswordTime = 0;

//Completely reset the state of the timing data for a field
function eraseField(element, dataElement, type) {
    
    //Clear the field and the input for which its data is stored
    element.value = '';
    dataElement.value = '';

    //Reset the state for the ID field
    if(type === 'id') {
        idData = '{';
        idStart = 0;
        idEnd = 0;
        idStartFlag = true;
        jsonIdKeyIterator = 1;
        aggregateLoginIdTime = 0;
    } 
    
    //Reset the state for password field
    else {
        passwordData = '{';
        passwordStart = 0;
        passwordEnd = 0;
        passwordStartFlag = true;
        jsonPasswordKeyIterator = 1;
        aggregateLoginPasswordTime = 0;
    }
  }

//Log an individual key pressed in the ID field
function logKeyId(keyEvent, id, login) {

    //If backspce, clear the whole field as above
    if(keyEvent.key === 'Backspace') {
        //clear the input field 
        document.getElementById(id).value = "";
        idData = '{';
        idStart = 0;
        idEnd = 0;
        idStartFlag = true;
        jsonIdKeyIterator = 1;
        aggregateLoginIdTime = 0;
        return;
    } 
    
    //If toggling uppercase, do not add key press to JSON 
    else if(keyEvent.key === 'Shift' || keyEvent.key === 'CapsLock') {
        return;
    } 
    
    //Disable Enter button
    else if(keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
        alert("This form cannot be submitted with Enter");
        return;
    }

    //Disable Tab button
    else if(keyEvent.key === 'Tab') {
        keyEvent.preventDefault();
        alert("Tab is disabled in this window");
        return;
    }

    //If there is no keypress data yet recorded, the first key has an interval of 0
    if(idStartFlag) {
        idData += '\"' + jsonIdKeyIterator++ + '\": \"' + keyEvent.key + '|0\"';
        idStartFlag = false;
    } 
    
    //Otherwise, the interval is the end of the previous press to the start of the most recent press
    else {
        idEnd = Date.now();
        console.log(keyEvent.key + ': ' + idStart + ' ' + idEnd);
        idData += ',\n \"' + jsonIdKeyIterator++ + '\": \"' + keyEvent.key + '|' + (idEnd - idStart) + '\"';
        if(login === 'true') {
            aggregateLoginIdTime += (idEnd - idStart);
        }
    }

    //Save the start time
    idStart = Date.now();
}


//Logs a key pressed in the password field
//Logically works the same as ID field, but with different variable names
function logKeyPassword(keyEvent, id, login) {

    if(keyEvent.key === 'Backspace') {
        //clear the input field 
        document.getElementById(id).value = "";
        passwordData = '{';
        passwordStart = 0;
        passwordEnd = 0;
        passwordStartFlag = true;
        jsonPasswordKeyIterator = 1;
        aggregateLoginPasswordTime = 0;
        return;
    } else if(keyEvent.key === 'Shift' || keyEvent.key === 'CapsLock') {
        return;
    }
    else if(keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
        alert("This form cannot be submitted with Enter");
        return;
    }
    else if(keyEvent.key === 'Tab') {
        keyEvent.preventDefault();
        alert("Tab is disabled in this window");
        return;
    }
    if(passwordStartFlag) {
        passwordData += '\"' + jsonPasswordKeyIterator++ + '\": \"' + keyEvent.key + '|0\"';
        passwordStartFlag = false;
    } else {
        passwordEnd = Date.now();
        console.log(keyEvent.key + ': ' + passwordStart + ' ' + passwordEnd);
        passwordData += ',\n \"' + jsonPasswordKeyIterator++ + '\": \"' + keyEvent.key + '|' + (passwordEnd - passwordStart) + '\"';
        if(login === 'true') {
            aggregateLoginPasswordTime += (passwordEnd - passwordStart);
        }
    }
    passwordStart = Date.now();
}


//Closes the JSON object for a field once the user removes the focus from that field 
function closeObject(objectToClose, id, login) {
    if(objectToClose === 'ID') {
        if(login === 'true') {
            idData += ',\n "' + 'total": ' + aggregateLoginIdTime;
        }
        idData += ' }';
        document.getElementById(id).value = idData;
    } else {
        if(login === 'true') {
            passwordData += ',\n "' + 'total": ' + aggregateLoginPasswordTime;
        }
        passwordData += ' }';
        console.log(passwordData);
        document.getElementById(id).value = passwordData;
    }
}