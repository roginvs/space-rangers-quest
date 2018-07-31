import "babel-polyfill";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { GameList } from "./gamelist";

/* Needed for collapsed button */
import * as $ from "jquery";
(window as any).jQuery = $; // A workaround for 'bootstrap'
(window as any).$ = $; // A workaround to use $ in console
import * as Tether from "tether";
(window as any).Tether = Tether;
import "bootstrap"; // TODO: Types installed for bootstrap v3
import "bootstrap/dist/css/bootstrap.min.css";

import "./index.css";
import { getJson } from "./common";
import { INDEX_JSON } from "./consts";
import { Index } from "../packGameData";

const root = document.getElementById("root");

getJson(INDEX_JSON)
    .then((index: Index) => ReactDOM.render(<GameList index={index} />, root))
    .catch(e =>
        ReactDOM.render(
            <div className="p-3 text-warning">Ошибка {e}</div>,
            root
        )
    );


$('body').append(`
<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog"
 aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Новая версия!</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
      Друзья! Вышла новая версия плеера <a href="https://spacerangers.gitlab.io">https://spacerangers.gitlab.io</a>
      <br/>Прошу тестить. Старая будет здесь и никуда не денется.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Хорошо</button>        
        <button type="button" class="btn btn-primary" onClick='location.href="https://spacerangers.gitlab.io"'>Перейти на новую</button>
      </div>
    </div>
  </div>
</div>
`);
$('#exampleModal').modal();
