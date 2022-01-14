# Keylogger ss Authentication Factor Program and Experiment Report

In this repository, you will find code to a keylogger program that was used to perform two experiments. The details of these experiments can be found in Keylogger_Report.pdf. 

## Usage Instructions

1. After downloading the repository, go into the /src directory of this project and run 'node keylogger.js' to start the server.
2. Go to 'localhost:3000/' (or whichever port is specified if modified in keylogger.js) to access the UI
3. For the purposes of generating clean JSON, the 'enter' and 'tab' keys have been disabled in the UI

## Managing User Profiles

Only profiles located within the directory /src/users/user_data/ are considered for login. <br>

All of the profiles in /src/users/ExperimentData are not considered for login purposes, but to preserve the data used in the experiments. If you want to test the replicability of an experiment, I would strongly recommend making your own copies of those login (ID/Password) combinations because it's fairly given that you and I do not type in the same way. <br>

Abandoning the calibration process before completion will not delete the {id}_profile_creation.json file, so that process must be performed manually under those circumstances. 

### Disclaimer

I wrote this code before learning how to use any frontend frameworks or Node.js beyond basic routing, so feel free to make my code better if for some reason you want to.