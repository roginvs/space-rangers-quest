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

type Target = Location | Jump;
function isLocation(t: Target): t is Location {
  if ("isStarting" in t) {
    return true;
  } else {
    return false;
  }
}
function isJump(t: Target): t is Jump {
  if ("priority" in t) {
    return true;
  } else {
    return false;
  }
}
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
          <div className="col-3">
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
          <div className="col-9">
            <div className="form-check">
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={!loc.isTextByFormula}
                  onChange={e => {
                    if (e.target.checked) {
                      loc.isTextByFormula = false;
                    }
                  }}
                />
                Выбирать по порядку
              </label>
            </div>
            <div className="form-check">
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={loc.isTextByFormula}
                  onChange={e => {
                    if (e.target.checked) {
                      loc.isTextByFormula = true;
                    }
                  }}
                />
                Выбирать по формуле
              </label>
              {loc.isTextByFormula ? (
                <input
                  // className="form-control"
                  value={loc.textSelectFormula}
                  onChange={e => (loc.textSelectFormula = e.target.value)}
                />
              ) : null}
            </div>
          </div>
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
  target: Target;
  onClose: (target?: Location | Jump) => void;
}> {
  @observable
  target: Target = toJS(this.props.target);

  @observable
  popupForConfirmChanges = false;

  @observable
  changed = false;

  changeCatched = reaction(
    () => toJS(this.target),
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

    const target = this.target;
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
          {isLocation(target)
            ? `Локация L${target.id}`
            : isJump(target)
            ? `Переход J${target.id}`
            : null}
        </ModalHeader>
        <ModalBody className="p-2">
          {isLocation(target) ? <LocationTexts key={target.id} loc={target} /> : null}
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
        target={target}
        onClose={newTarget => {
          if (newTarget) {
            if (selected.type === "location" && isLocation(newTarget)) {
              const idx = quest.locations.findIndex(x => x.id === newTarget.id);
              if (idx > -1) {
                quest.locations[idx] = newTarget;
              }
            } else if (
              (selected.type === "jump_end" || selected.type === "jump_start") &&
              isJump(newTarget)
            ) {
              const idx = quest.jumps.findIndex(x => x.id === newTarget.id);
              if (idx > -1) {
                quest.jumps[idx] = newTarget;
              }
            }
          }
          selected.opened = false;
        }}
      />
    );
  }
}
