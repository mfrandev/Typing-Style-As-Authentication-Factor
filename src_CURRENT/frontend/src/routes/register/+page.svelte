<script lang=ts>
    import InputBar from "./../../components/InputBar.svelte";
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import type { ProfileCalibration, CharacterData } from './../../interfaces/ProfileCalibration';

    // =========== Total number of calibration rounds ===========

    // This number must be strictly greater than 2 (7 is preferred)
    const numTotalCalibration = 7;

    // =========== For animations ===========
    let transition = false;

    onMount(() => {
        transition = true;
    });

    // =========== Manage calibration state ===========
    let calibrating = false;
    let numCalibration = 1;

    $: doneCalibrating = numCalibration === numTotalCalibration;

    // =========== Save username and password data ===========
    let username: string = '';
    let password: string = '';
    let usernameConfirm: string = '';
    let passwordConfirm: string = '';

    // =========== Determine if valid input ===========
    $: usernameMatch = username === usernameConfirm && username.length > 1;
    $: passwordMatch = password === passwordConfirm && password.length > 1;

    // =========== On starting calibration ===========
    const startCalibration = () => {
        if(!usernameMatch || !passwordMatch) return;
        password = '';
        username = '';
        calibrating = true;
        profileCalibration.username = usernameConfirm;
        profileCalibration.password = passwordConfirm;
        status = false;
        code = 0;
    }

    // =========== On next iteration of calibration ===========
    const calibrationIteration = () => {
        if(!usernameMatch || !passwordMatch) return;
        password = '';
        username = '';
        numCalibration++;
        profileCalibration.entries.push({usernameTimes: usernameTimes, passwordTimes: passwordTimes});
        usernameTimes = [];
        passwordTimes = [];
    }

    // =========== On completing calibration ===========
    let status: any = false;
    let code: number; 
    const finishCalibration = async () => {
        if(!usernameMatch || !passwordMatch) return;
        profileCalibration.entries.push({usernameTimes: usernameTimes, passwordTimes: passwordTimes});
        let data = await fetch('http://localhost:8080/processSignup', {
            method: 'POST',
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(profileCalibration),
        });
        code = data.status;
        status = await data.json();

        // Reset to pre-calibration state
        calibrating = false;
        username = '';
        password = '';
        usernameConfirm = '';
        passwordConfirm = '';
        transition = !transition;
        numCalibration = 1;
    }

    // =========== Save calibration profile here ===========
    let profileCalibration: ProfileCalibration = {
        username: '',
        password: '',
        entries: []
    };

    // =========== Save keystroke data here ===========
    let usernameTimes: CharacterData[] = [];
    let passwordTimes: CharacterData[] = [];

</script>

<!-- Lets 'Enter' key work universally on the page and functions will execute (assuming the initial conditions are met) -->
<svelte:window on:keyup={async (e) => {
    if(e.key !== 'Enter') return;
    if(doneCalibrating) {
        await finishCalibration();
        return;
    } else if(!calibrating) {
        startCalibration();
        return
    } else if(calibrating) {
        calibrationIteration();
        return;
    }
}} />

<div class='page-container'>

    {#key transition}
        <p class='home' in:fade={{duration: 1500}}>
            <a class='home-link' href='/'>Home</a>
        </p>
    {/key}

    <p class='title' in:fade={{duration: 1500}}>
        Register A New Account
    </p>

    {#if status !== false}
        <p style:color='{code >= 200 && code < 400 ? 'green' : 'red'}' class='error'>{status.message}</p>
    {/if}

    {#if !calibrating}
        <p class='sub-title' in:fade={{duration: 1500}}>
            Complete The Fields Below To Begin Calibration
        </p>
    {:else}
        <p class='sub-title' in:fade={{duration:500}}>
            {#key numCalibration}
                <span in:fade|local={{duration: 500}}>{numCalibration}</span>/{numTotalCalibration}
            {/key}
        </p>
        <div class='login-data' style:color='whitesmoke'>
            <p style:margin='0 1rem 0 0'>Username: {usernameConfirm}</p>
            <p style:margin='0 0 0 1rem'>Password: {passwordConfirm}</p>
        </div>
    {/if}

    <div class='center-input'>

        {#key transition}

            <div class='input-container'>

                {#if !calibrating}

                    <div in:fly={{duration: 1500, x: -50}}>
                        <InputBar bind:bind={username} placeholder='Username'/>
                        <br>
                        <InputBar bind:bind={usernameConfirm} placeholder='Confirm Username'/>
                    </div>

                    <br><br>
                
                    <div type='password' in:fly={{duration: 1500, x: 50}}>
                        <InputBar bind:bind={password} placeholder='Password'/>
                        <br>
                        <InputBar bind:bind={passwordConfirm} placeholder='Confirm Password'/>
                    </div>

                {:else if calibrating}

                    <div style:margin='-2rem 0 0 0' in:fly={{duration: 1500, x: -50}}>
                        <InputBar bind:bind={username} placeholder='Username' recordKeystrokes={true} 
                        bind:times={usernameTimes} />
                        <br><br>
                        <InputBar bind:bind={password} placeholder='Password'recordKeystrokes={true} 
                        bind:times={passwordTimes} />
                    </div>

                {/if}



                {#if doneCalibrating}
                    <div style:color='{passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}' 
                    style='border: 1px solid {passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}'
                    class='button button-div {usernameMatch && passwordMatch ? 'enabled' : ''}' 
                    on:click='{finishCalibration}'>
                        Finish
                    </div>
                    <input type='hidden' id='putBody'/>
                {:else if !calibrating}
                    <div style:color='{passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}' style='border: 1px solid {passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}'
                    class='button button-div {usernameMatch && passwordMatch ? 'enabled' : ''}' on:click="{startCalibration}">
                        Start
                    </div>
                {:else if calibrating}
                    <div style:color='{passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}' style='border: 1px solid {passwordMatch && usernameMatch ? 'whitesmoke' : 'gray'}'
                    class='button button-div {usernameMatch && passwordMatch ? 'enabled' : ''}' on:click="{calibrationIteration}">
                        Next
                    </div>
                {/if}

            </div>

        {/key}

    </div>

</div>

<style>

    .home-link {
        text-decoration: none;
        color: whitesmoke;
    }

    .home {
        background-color: rgb(11, 11, 11);
        /* color: whitesmoke; */
        margin: 0 0 0 2rem;
        transition: .2s ease-in-out;
        transform: translateY(2rem);
    }

    .home:hover {
        cursor: pointer;
    }

    .page-container {
        background-color: rgb(11, 11, 11);
        min-height: 100vh;
        height: 100%;
    }

    .center-input {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin-top: 7rem;
    }

    .title {
        color: whitesmoke;
        font-size: 1.3rem;
        /* transform: translateY(-6rem); */
        text-align: center;
        margin-top: 4.685rem;
    }

    .error {
        font-size: 1.05rem;
        text-align: center;
    }

    .sub-title {
        color: whitesmoke;
        font-size: 1.05rem;
        /* transform: translateY(-6rem); */
        text-align: center;
    }

    .input-container {
        width: 35%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        /* align-items: center; */
    }

    .login-data {
        display: flex;
        justify-content: center;
        margin-top: 3rem;
    }

    .button {
        margin-top: 1.085rem;
        padding: 8px 0 8px 0;
        border-radius: 12px;
        background-color: transparent;
        color: whitesmoke;
        transition: 0.2s ease-in-out;
        width: 50%;
        margin: auto;
        margin-top: 2rem;
        font-size: 1rem;
    }

    .button-div {
        text-align: center;
    }

    .enabled:hover {
        transform: scale(1.05);
    }

</style>