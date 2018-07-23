"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbolicValues_1 = require("./symbolicValues");
const util_1 = require("util");
const constraints_1 = require("./constraints");
const immutable_1 = require("immutable");
class ProgramState {
    static empty() {
        return new ProgramState(immutable_1.Map(), [], immutable_1.Map());
    }
    constructor(symbolicValues, expressionStack, constraints) {
        this.symbolicValues = symbolicValues;
        this.expressionStack = expressionStack;
        this.constraints = constraints;
    }
    sv(symbol) {
        return this.symbolicValues.get(symbol);
    }
    setSV(symbol, sv) {
        return new ProgramState(this.symbolicValues.set(symbol, sv), this.expressionStack, this.constraints);
    }
    pushSV(sv) {
        const newExpressionStack = [...this.expressionStack, sv];
        return new ProgramState(this.symbolicValues, newExpressionStack, this.constraints);
    }
    popSV() {
        const newExpressionStack = [...this.expressionStack];
        return [newExpressionStack.pop(), new ProgramState(this.symbolicValues, newExpressionStack, this.constraints)];
    }
    getStackSize() {
        return this.expressionStack.length;
    }
    constrain(constraint) {
        if (this.expressionStack.length > 0) {
            const sv = this.expressionStack[this.expressionStack.length - 1];
            const svConstraints = constraints_1.constrain(this.getConstraints(sv), constraint);
            if (svConstraints) {
                return new ProgramState(this.symbolicValues, this.expressionStack, this.constraints.set(sv, svConstraints));
            }
            else {
                // impossible program state
                return undefined;
            }
        }
        else {
            throw new Error("Cannot apply a constraint, because the expression stack is empty");
        }
    }
    constrainToTruthy() {
        return this.constrain(constraints_1.truthyConstraint());
    }
    constrainToFalsy() {
        return this.constrain(constraints_1.falsyConstraint());
    }
    getConstraints(sv) {
        if (symbolicValues_1.isUndefinedSymbolcValue(sv) || (symbolicValues_1.isNumericLiteralSymbolicValue(sv) && sv.value === "0")) {
            return [constraints_1.falsyConstraint()];
        }
        if (symbolicValues_1.isNumericLiteralSymbolicValue(sv) && sv.value !== "0") {
            return [constraints_1.truthyConstraint()];
        }
        return this.constraints.get(sv) || [];
    }
    hasEmptyStack() {
        return this.expressionStack.length === 0;
    }
    toString() {
        let prettyEntries = immutable_1.Map();
        this.symbolicValues.forEach((value, key) => {
            if (key && value) {
                prettyEntries = prettyEntries.set(key.name, value);
            }
        });
        return util_1.inspect({ prettyEntries, expressionStack: this.expressionStack, constraints: this.constraints });
    }
    isEqualTo(another) {
        return (this.areTopStackConstraintsEqual(another) &&
            this.areSymbolsEqual(another) &&
            this.areSymbolicValuesEqual(another) &&
            this.areSymbolConstraintsEqual(another));
    }
    areSymbolsEqual(another) {
        if (this.symbolicValues.size !== another.symbolicValues.size) {
            return false;
        }
        return this.symbolicValues.keySeq().equals(another.symbolicValues.keySeq());
    }
    areSymbolicValuesEqual(another) {
        return this.symbolicValues.entrySeq().reduce((result, entry) => {
            const [symbol, value] = entry;
            const anotherValue = another.symbolicValues.get(symbol);
            return result && anotherValue !== undefined && symbolicValues_1.isEqualSymbolicValues(value, anotherValue);
        }, true);
    }
    areSymbolConstraintsEqual(another) {
        const symbols = this.symbolicValues.keySeq();
        return !symbols.find(symbol => {
            const value = this.sv(symbol);
            const anotherValue = another.sv(symbol);
            if (value && anotherValue) {
                const constraints = this.getConstraints(value);
                const anotherConstraints = another.getConstraints(anotherValue);
                if (!areArraysEqual(constraints, anotherConstraints, constraints_1.isEqualConstraints)) {
                    return true;
                }
            }
            return false;
        });
    }
    areTopStackConstraintsEqual(another) {
        const top = this.expressionStack.length > 0 && this.expressionStack[this.expressionStack.length - 1];
        const anotherTop = another.expressionStack.length > 0 && another.expressionStack[another.expressionStack.length - 1];
        if (!top && !anotherTop) {
            return true;
        }
        if (!top || !anotherTop) {
            return false;
        }
        const constraints = this.getConstraints(top);
        const anotherConstraints = another.getConstraints(anotherTop);
        return areArraysEqual(constraints, anotherConstraints, constraints_1.isEqualConstraints);
    }
}
exports.ProgramState = ProgramState;
function createInitialState(declaration, program) {
    let state = ProgramState.empty();
    declaration.parameters.forEach(parameter => {
        const symbol = program.getTypeChecker().getSymbolAtLocation(parameter.name);
        if (symbol) {
            state = state.setSV(symbol, symbolicValues_1.simpleSymbolicValue());
        }
    });
    return state;
}
exports.createInitialState = createInitialState;
function areArraysEqual(a, b, comparator = (a, b) => a === b) {
    return (a.length === b.length &&
        a.reduce((result, valueA, index) => {
            const valueB = b[index];
            return result && comparator(valueA, valueB);
        }, true));
}
//# sourceMappingURL=programStates.js.map