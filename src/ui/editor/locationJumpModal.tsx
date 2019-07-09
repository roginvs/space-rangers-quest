import * as React from "react";
import { Store } from "../store";
import {
  QM,
  Location,
  Jump,
  ParamsChanger,
  JumpParameterCondition,
  ParameterChange,
  ParameterShowingType,
} from "../../lib/qmreader";
import { observer } from "mobx-react";
import { observable, computed, runInAction, keys, toJS, reaction } from "mobx";
import Popper from "@material-ui/core/Popper";
import { ReferenceObject, PopperOptions, Modifiers } from "popper.js";
import { EditorStore, EDITOR_MODES } from "./store";
import { assertNever } from "../../lib/formula/calculator";
import { colors } from "./colors";
import { JumpArrow } from "./jumpArrow";
import { LocationPoint } from "./locationPoint";
import { LOCATION_DROP_RADIUS } from "./consts";
import classnames from "classnames";
import { Hotkeys } from "./hotkeys";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

@observer
class LocationTexts extends React.Component<{
  loc: Location;
}> {
  @observable
  currentTextId = 0;

  render() {
    const loc = this.props.loc;

    return (
      <>
        <div className="row">
          <div className="col-6">
            Описание #{" "}
            <select
              value={this.currentTextId}
              onChange={e => (this.currentTextId = parseInt(e.target.value))}
              style={{ marginRight: 4, width: "4em" }}
            >
              {loc.texts.map((t, id) => (
                <option key={id} value={id}>
                  {id + 1}
                </option>
              ))}
            </select>
            <button
              className="btn btn-light btn-sm"
              onClick={() => {
                loc.texts.push("");
                this.currentTextId = loc.texts.length - 1;
              }}
            >
              +
            </button>
            <button
              className="btn btn-light btn-sm"
              disabled={loc.texts.length <= 1 || this.currentTextId !== loc.texts.length - 1}
              onClick={() => {
                const idToRemove = this.currentTextId;
                this.currentTextId = Math.max(0, this.currentTextId - 1);
                loc.texts.splice(idToRemove, 1);
              }}
            >
              -
            </button>
          </div>
          <div className="col-6">todo</div>
        </div>

        <div className="my-2">
          {this.currentTextId < loc.texts.length ? (
            <textarea
              style={{ width: "100%", height: "10em" }}
              value={loc.texts[this.currentTextId]}
              onChange={e => (loc.texts[this.currentTextId] = e.target.value)}
            />
          ) : (
            <div>
              <i>Нет текстов</i>
            </div>
          )}
        </div>
      </>
    );
  }
}

@observer
class ModalInside extends React.Component<{
  loc?: Location;
  jump?: Jump;
  onClose: (target?: Location | Jump) => void;
}> {
  @observable
  loc = toJS(this.props.loc);
  @observable
  jump = toJS(this.props.jump);

  @observable
  popupForConfirmChanges = false;

  @observable
  changed = false;

  changeCatched = reaction(
    () => toJS(this.loc || this.jump),
    (change, reaction) => {
      this.changed = true;
      reaction.dispose();
    },
    {
      fireImmediately: false,
    },
  );

  onClose = () => {
    if (!this.changed) {
      this.props.onClose();
    } else {
      this.popupForConfirmChanges = true;
    }
  };

  render() {
    if (this.popupForConfirmChanges) {
      return (
        <Modal
          isOpen={true}
          toggle={() => (this.popupForConfirmChanges = false)}
          backdrop={true}
          size="sm"
          // TODO: Check timeouts
          modalTransition={{ timeout: 50 }}
          backdropTransition={{ timeout: 50 }}
        >
          <ModalHeader toggle={() => (this.popupForConfirmChanges = false)}>
            Подтверждение
          </ModalHeader>
          <ModalBody>Есть несохраненные изменения</ModalBody>
          <ModalFooter>
            <button
              className="btn btn-primary"
              onClick={() => (this.popupForConfirmChanges = false)}
            >
              Редактировать
            </button>
            <button className="btn btn-danger" onClick={() => this.props.onClose()}>
              Выйти
            </button>
          </ModalFooter>
        </Modal>
      );
    }
    const loc = this.loc;
    const jump = this.jump;
    const target = loc || jump;
    if (!target) {
      return null;
    }
    return (
      <Modal
        isOpen={true}
        toggle={() => this.onClose()}
        backdrop={true}
        size="xl"
        // TODO: Check timeouts
        modalTransition={{ timeout: 50 }}
        backdropTransition={{ timeout: 50 }}
      >
        <ModalHeader toggle={() => this.onClose()} className="py-1">
          {loc ? `Локация L${loc.id}` : jump ? `Переход J${jump.id}` : null}
        </ModalHeader>
        <ModalBody className="p-2">
          {loc ? <LocationTexts key={loc.id} loc={loc} /> : null}
        </ModalBody>
      </Modal>
    );
  }
}

@observer
export class LocationJumpParamsModal extends React.Component<{
  store: EditorStore;
}> {
  render() {
    const store = this.props.store;
    const quest = store.quest;
    const selected = store.selected;
    if (!selected) {
      return null;
    }
    if (!selected.opened) {
      return null;
    }
    const loc =
      selected.type === "location" ? quest.locations.find(l => l.id === selected.id) : undefined;
    const jump =
      selected.type === "jump_end" || selected.type === "jump_start"
        ? quest.jumps.find(x => x.id === selected.id)
        : undefined;
    const target = loc || jump;
    if (!target) {
      console.warn(`Unknown selected type=${selected.type} id=${selected.id}`);
      return null;
    }
    return (
      <ModalInside
        key={`${selected.type}-${selected.id}`}
        loc={loc}
        jump={jump}
        onClose={newTarget => {
          // TODO: save
          selected.opened = false;
        }}
      />
    );
  }
}
/*
<Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className} backdrop={this.state.backdrop}>
<ModalHeader toggle={this.toggle}>Modal title</ModalHeader>
<ModalBody>
  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
</ModalBody>
*/
