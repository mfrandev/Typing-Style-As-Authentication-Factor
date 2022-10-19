# Keylogger: Authentication By Typing Style

In this repository, you will find code to two functionally equivalent (server side) keylogger programs. The code in src_DEPRICATED was used to perform two experiments and the details of these experiments can be found in Keylogger_Report.pdf. 

The code in src_CURRENT is a (drastically) improved implementation of src_DEPRICATED using TypeScript, where the data structures have been modified, the core algorithm used to determine login success is unchanged, and provides a superior user experience. 

## Usage Instructions

For src_DEPRICATED (Linux/UNIX) <b>(NOT RECOMMENDED FOR USE)</b>: 
1. Run 'sh runDepricated.sh' from the root directory
    a. This ensures all dependencies are installed and starts the server
2. Open your web browser and navigate to 'localhost:3000/' to be taken to the homepage 

For src_CURRENT (Linux/UNIX) <b>(RECOMMENDED FOR USE)</b>: 
1. Run 'sh runCurrent.sh' from the root directory
    a. This ensures all dependencies are installed and starts the backend/frontend servers
2. Open your web browser and navigate to '127.0.0.1:5173/' to be taken to the homepage 

## Managing User Profiles

For src_DEPRICATED:
1. Only profiles located within the directory /src/users/user_data/ are considered for login. <br>

2. All of the profiles in /src/users/ExperimentData are not considered for login purposes, but to preserve the data used in the experiments. If you want to test the replicability of an experiment, I would strongly recommend making your own copies of those login (ID/Password) combinations because it's fairly given that you and I do not type in the same way. <br>

3. Abandoning the calibration process before completion will not delete the {id}_profile_creation.json file, so that process must be performed manually under those circumstances. 

For src_CURRENT:
1. All user profiles are stored in ./src_CURRENT/backend/users and there is no secondary directory for experiment data at this time. 
    a. I hope to reproduce the experiements for src_DEPRICATED on src_CURRENT to the best of my ability, given I don't have access to the same resources/test subjects. 

2. Profile files are now created post calibration on the server-side, so abandonning calibration will no longer produce an orphaned file. 
