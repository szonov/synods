import {App} from './app';
import {mount} from '../vendor/tsx-create-element';

document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector<HTMLDivElement>('#app')!
    // app.append(App);
    mount(App, app)
})

console.log(App);
