<script lang=ts>

    import type { CharacterData } from './../interfaces/ProfileCalibration';

    // Placeholder text 
    export let placeholder = '';
    export let width = '100%';

    // Bind the value of the input field to a parent component
    export let bind: string = '';

    // If true, bind the keystroke timing to parent
    export let recordKeystrokes = false;

    // Store aggregate keystroke data
    export let times: CharacterData[] | null = null;

    let start = 0;
    let end = 0;

    /**
     * Enter, Space, Arrows, Control, Tab, Escape: do nothing
     * Shift, Caps Lock, Command, Alt: Normal behavior, do not log keystroke
     * Delete: Clear the field and reset the calibration iteration
     * @param e
     */
    const modifyKeyBehavior = (e: KeyboardEvent) => {
        if(!recordKeystrokes) return;
        // console.log(`key: ${e.key} and code: ${e.code}`);
        switch(e.key) {
            
            case 'Enter':
            case ' ':
            case 'Control':
            case 'Escape':
                e.preventDefault();
                return;

            case 'Shift':
            case 'CapsLock':
            case 'Command':
            case 'Alt':
            case 'Tab':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                return;

            case 'Backspace':
                bind = '';
                times = times !== null ? [] : null;
                return;
            
            default:
              break;
        }
        if(times?.length === 0) {
            start = Date.now();
        } 
        end = Date.now();
        times?.push({
            character: e.key, 
            interval: times.length === 0 ? 0 : end - start
        });
        start = end;
        times = times;
    }

</script>

<div class='input-bar-wrapper' style="width: {width}" style:color='white'>
    <input bind:value={bind} class='input-bar' placeholder="{placeholder}" on:keydown={modifyKeyBehavior}>
</div>

<style>

    .input-bar-wrapper {
        /* background-color: red; */
        padding: 0 0 2px 0;
        border-bottom: 1px solid whitesmoke;
        transition: 0.2s ease-in-out;
    }

    .input-bar-wrapper:hover {
        transform: scale(1.05);
    }

    .input-bar {
        background-color: rgb(11, 11, 11);
        color: whitesmoke;
        border: none;
        width: calc(100% - 2px);
        font-size: 1.15rem;
    }

    .input-bar:focus {
        outline: none;
    }

</style>