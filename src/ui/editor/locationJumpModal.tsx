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
import { range } from "./utils";

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
        <div className="d-flex">
          <div className="form-check flex-shrink-0 mr-2">
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
          <div className="form-check flex-shrink-0 mr-1">
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
          </div>
          {loc.isTextByFormula ? (
            <input
              className="form-control"
              value={loc.textSelectFormula}
              onChange={e => (loc.textSelectFormula = e.target.value)}
            />
          ) : null}
        </div>

        <ul className="nav nav-tabs">
          {range(loc.texts.length).map(textId => (
            <li className="nav-item" key={textId}>
              <a
                className={`nav-link ${textId === this.currentTextId ? "active" : ""}`}
                href="#"
                onClick={e => {
                  e.preventDefault();
                  this.currentTextId = textId;
                }}
              >
                {textId + 1}
              </a>
            </li>
          ))}

          <li className="nav-item">
            <a
              className={`nav-link ${
                loc.texts.length <= 1 || this.currentTextId !== loc.texts.length - 1
                  ? "disabled"
                  : ""
              }`}
              onClick={e => {
                e.preventDefault();
                const idToRemove = this.currentTextId;
                this.currentTextId = Math.max(0, this.currentTextId - 1);
                loc.texts.splice(idToRemove, 1);
                loc.media.splice(idToRemove, 1);
              }}
            >
              -
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link`}
              onClick={e => {
                e.preventDefault();
                loc.texts.push("");
                loc.media.push({
                  img: "",
                  sound: "",
                  track: "",
                });
                this.currentTextId = loc.texts.length - 1;
              }}
            >
              +
            </a>
          </li>
        </ul>

        <div className="tab-content">
          {this.currentTextId < loc.texts.length ? (
            <>
              <textarea
                style={{ width: "100%", height: "10em" }}
                value={loc.texts[this.currentTextId]}
                onChange={e => (loc.texts[this.currentTextId] = e.target.value)}
              />

              <div className="row">
                <div className="col-4 form-group">
                  <input
                    type="text"
                    placeholder="Иллюстрация"
                    title="Иллюстрация"
                    className="form-control form-control-sm"
                    value={loc.media[this.currentTextId].img}
                    onChange={e => (loc.media[this.currentTextId].img = e.target.value)}
                  />
                </div>
                <div className="col-4 form-group">
                  <input
                    placeholder="Фоновый трек"
                    title="Фоновый трек"
                    type="text"
                    className="form-control form-control-sm"
                    value={loc.media[this.currentTextId].track}
                    onChange={e => (loc.media[this.currentTextId].track = e.target.value)}
                  />
                </div>
                <div className="col-4 form-group">
                  <input
                    placeholder="Звуковой эффект"
                    title="Звуковой эффект"
                    type="text"
                    className="form-control form-control-sm"
                    value={loc.media[this.currentTextId].sound}
                    onChange={e => (loc.media[this.currentTextId].sound = e.target.value)}
                  />
                </div>
              </div>
            </>
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
class JumpTexts extends React.Component<{
  jump: Jump;
}> {
  render() {
    const j = this.props.jump;
    return (
      <>
        <label>Вопрос для совершения перехода</label>
        <textarea
          style={{ width: "100%", height: "3em" }}
          value={j.text}
          onChange={e => (j.text = e.target.value)}
        />
        <div className="row">
          <div className="col-9">
            <label>Сообщение, выводящееся при выполнении перехода</label>
            <textarea
              style={{ width: "100%", height: "6em" }}
              value={j.description}
              onChange={e => (j.description = e.target.value)}
            />
          </div>
          <div className="col-3">
            <div className="form-group">
              <input
                type="text"
                placeholder="Иллюстрация"
                title="Иллюстрация"
                className="form-control"
                value={j.img}
                onChange={e => (j.img = e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Фоновый трек"
                title="Фоновый трек"
                type="text"
                className="form-control"
                value={j.track}
                onChange={e => (j.track = e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Звуковой эффект"
                title="Звуковой эффект"
                type="text"
                className="form-control"
                value={j.sound}
                onChange={e => (j.sound = e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-group mb-2 d-flex ">
          <label className="flex-shrink-0 col-form-label">Логическое условие: </label>
          <input
            type="text"
            className="form-control form-control-sm ml-2 xxis-invalid"
            value={j.formulaToPass}
            onChange={e => (j.formulaToPass = e.target.value)}
          />
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
          {isLocation(target) ? (
            <LocationTexts key={target.id} loc={target} />
          ) : isJump(target) ? (
            <JumpTexts key={target.id} jump={target} />
          ) : null}
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
