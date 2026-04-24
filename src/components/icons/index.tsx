import {createElement} from '../../lib/dom';

interface IProps
{
    size?: number;
}

export const IconDown = (props: IProps) => (
    <svg className="i-down"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 5l0 14"/>
        <path d="M18 13l-6 6"/>
        <path d="M6 13l6 6"/>
    </svg>
);
export const IconUp = (props: IProps) => (
    <svg className="i-up"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 5l0 14"/>
        <path d="M18 11l-6 -6"/>
        <path d="M6 11l6 -6"/>
    </svg>
);

export const IconCheck = (props: IProps) => (
    <svg className="i-check"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M5 12l5 5l10 -10"/>
    </svg>
);

export const IconClock = (props: IProps) => (
    <svg className="i-clock"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="currentColor">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path
            d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z"/>
    </svg>
);
export const IconTriangle = (props: IProps) => (
    <svg className="i-triangle"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
    </svg>
);

export const IconPaused = (props: IProps) => (
    <svg className="i-paused"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="currentColor">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z"/>
        <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z"/>
    </svg>
);

export const IconResume = (props: IProps) => (
    <svg className="i-resume"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path
            d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
    </svg>
);

export const IconPause = (props: IProps) => (
    <svg className="i-pause"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
        <rect x="14" y="3" width="5" height="18" rx="1"/>
        <rect x="5" y="3" width="5" height="18" rx="1"/>
    </svg>
);

export const IconDelete = (props: IProps) => (
    <svg className="i-delete"
         style={{width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px`}}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m15 9-6 6"/>
        <path d="m9 9 6 6"/>
    </svg>
);
