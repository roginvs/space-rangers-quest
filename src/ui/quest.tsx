import * as React from "react";
import { Loader, DivFadeinCss, Tabs } from "./common";
import { LangTexts } from "./lang";
import { DB } from "./db";
import { Player, Lang } from "../lib/qmplayer/player";
import { Index, Game } from "../packGameData";
import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem
} from "reactstrap";
import {
    HashRouter,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";

