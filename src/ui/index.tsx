import * as React from "react";
import * as ReactDOM from "react-dom";

import { GameList } from './gamelist';


/* Needed for collapsed button */
import * as $ from "jquery";
(window as any).jQuery = $; // A workaround for 'bootstrap'
(window as any).$ = $; // A workaround to use $ in console
import * as Tether from "tether";
(window as any).Tether = Tether;
import 'bootstrap'; // TODO: Types installed for bootstrap v3
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css';

const root = document.getElementById('root');

ReactDOM.render(
    <GameList
    />,
    root
)
