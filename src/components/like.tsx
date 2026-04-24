import { createElement } from '../lib/dom';

export interface Props {
    big?: boolean;
    more?: string;
}

export const LikeComponent = (props: Props) => {
    return <div>
        LIKE LikeComponent {props.big} :: {props.more}
        :: {props.big ? "YES": "NO"}
    </div>;
}

