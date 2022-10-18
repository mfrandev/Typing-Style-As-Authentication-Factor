<script>
    import { fly, fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    let pageReady = false;

    onMount(() => {
        pageReady = true;
    });

</script>

<!-- <svelte:head>

</svelte:head> -->

<!-- <div class='background-image'/> -->

<div class='page-container'>

    <div class='button-wrapper'>

        {#key pageReady}
            <div in:fade = {{ duration: 1500 }} class='title'>
                Typing Style As Authentication Factor
            </div>
        {/key}

        <div class='nav-box'>
            {#key pageReady}
                <a in:fly = {{ duration: 1500, y: -50 }} class='button left' href='/register'>Register A New Login</a>
                <a in:fly = {{ duration: 1500, y: 50 }} class='button right' href='/login'>Attempt A Login</a>
            {/key}
        </div>
    </div>

</div>

<!-- On this page: Offer option to register an account or to try logging in  -->

<style> 

    /* .background-image {
        background-image: url('/brick-wall-1194038.jpeg');
        position: absolute;
        height: 100vh;
        width: 100vw;
        z-index: -1;
        opacity: 35%;
    } */
    
    .page-container {
        min-height: 100vh;
        height: 100%;
        background-color: rgb(11, 11, 11);
    }

    .button-wrapper {
        min-height: 100vh;
        height: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;
    }

    .title {
        /* margin-top: 5rem; */
        /* position: absolute; */
        transform: translateY(-10rem);
        font-size: 1.5rem;
        color: whitesmoke;
    }

    .nav-box {
        display: flex;
        justify-content: space-between;
        width: 60%;
    }

    .button {
        border: 1px solid whitesmoke;
        border-radius: 12px;
        padding: 0.638rem 0 0.638rem 0;
        transition: 0.2s ease-in-out;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        color: whitesmoke;
        font-size: 1.3rem;
    }

    .button:hover {
        transform: scale(1.05);
    }

    .left {
        flex: 1;
        margin-right: 2rem;
    }

    .right {
        flex: 1;
        margin-left: 2rem;
    }

    div a {
        text-decoration: none; 
    }

</style>

