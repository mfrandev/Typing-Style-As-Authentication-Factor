<script lang=ts>
    import InputBar from "./../../components/InputBar.svelte";
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import type { CharacterData } from './../../interfaces/ProfileCalibration';
    import type { UserProfileInterface } from './../../interfaces/UserProfileInterface';

    // =========== For animations ===========
    let transition = false;

    onMount(() => {
        transition = true;
    });

    // =========== Save username and password data ===========
    let username: string = '';
    let password: string = '';

    // =========== Determine if submit button enabled ===========
    $: loginReady = username.length > 1 && password.length > 1;

    // =========== On completing login ===========
    let status: any = false;
    let code: number; 
    const submitLogin = async () => {

        // Create the user profile to use in the login process
        profileLogin.username = username;
        profileLogin.password = password;

        // Calculate the total login time for username and password
        let total = 0;
        usernameTimes.forEach(value => total += value.interval);
        profileLogin.usernameAverages = { averageData: usernameTimes, total: total };
        total = 0;
        passwordTimes.forEach(value => total += value.interval);
        profileLogin.passwordAverages = { averageData: passwordTimes, total: total };

        // Do fetch request
        let data = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(profileLogin),
        });
        code = data.status;
        status = await data.json();

        // Reset to pre-login state
        username = '';
        password = '';
        profileLogin = {
            username: '',
            password: '',
            usernameAverages: {
                averageData: [],
                total: 0
            },
            passwordAverages: {
                averageData: [],
                total: 0
            }
        };
        usernameTimes = [];
        passwordTimes = [];
    }

    // =========== Save login profile here ===========
    let profileLogin: UserProfileInterface = {
        username: '',
        password: '',
        usernameAverages: {
            averageData: [],
            total: 0
        },
        passwordAverages: {
            averageData: [],
            total: 0
        }
    };

    // =========== Save keystroke data here ===========
    let usernameTimes: CharacterData[] = [];
    let passwordTimes: CharacterData[] = [];

</script>

<!-- Lets 'Enter' key work universally on the page and function will execute (assuming the initial conditions are met) -->
<svelte:window on:keyup={async (e) => {
    if(e.key !== 'Enter') return;
    if(!loginReady) return;
    await submitLogin();
}} />

<div class='page-container'>

    {#key transition}
        <p class='home' in:fade={{duration: 1500}}>
            <a class='home-link' href='/'>Home</a>
        </p>
    {/key}

    <p class='title' in:fade={{duration: 1500}}>
        Login To Existing Account
    </p>

    {#if status !== false}
        <p style:color='{code >= 200 && code < 400 ? 'green' : 'red'}' class='error'>{status.message}</p>
    {/if}

    <p class='sub-title' in:fade={{duration: 1500}}>
        Complete The Fields Below To Login
    </p>


    <div class='center-input'>

        {#key transition}

            <div class='input-container'>

               <div in:fly={{duration: 1500, x: 50}}>
                   <InputBar bind:bind={username} placeholder='Username' bind:times={usernameTimes} recordKeystrokes={true} />
                   <br><br>
                   <InputBar bind:bind={password} placeholder='Pasword' bind:times={passwordTimes} recordKeystrokes={true} />
               </div>

               <div style:color='{loginReady ? 'whitesmoke' : 'gray'}' style='border: 1px solid {loginReady ? 'whitesmoke' : 'gray'}'
                    class='button button-div {loginReady ? 'enabled' : ''}' on:click="{submitLogin}">
                        Start
                </div>

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