/*!
 * BTM JavaScript Library v@VERSION
 * https://github.com/dbrianwalton/BTM
 *
 * Copyright D. Brian Walton
 * Released under the MIT license (https://opensource.org/licenses/MIT)
 *
 * Date: @DATE
 */

/* ***************************************************
* Define the Multi-Operand Expression (for sum and product)
* *************************************************** */

import { exprType, opPrec } from "./BTM_root.js"
import { expression } from "./expression.js"
import { create_scalar } from "./scalar_expr.js"
import { rational_number } from "./rational_number.js"

// Do some preliminary testing to reduce the op if redundant inputs.
export function create_multiop(menv, op, inputs) {
    var newInputs = [];
    for (let i in inputs) {
        if (inputs[i].type == exprType.multiop && inputs[i].op == op) {
            newInputs.push(...inputs[i].inputs);
        } else {
            newInputs.push(inputs[i]);
        }
    }
    return new multiop_expr(menv, op, newInputs);
}

export class multiop_expr extends expression {
    constructor(menv, op, inputs) {
        super(menv);
        this.type = exprType.multiop;
        this.op = op;
        this.inputs = inputs; // an array
        for (var i in inputs) {
            if (typeof inputs[i] == 'undefined')
                inputs[i] = new expression(menv);
            inputs[i].parent = this;
        }
        switch (op) {
            case '+':
                this.prec = opPrec.addsub;
                break;
            case '*':
                this.prec = opPrec.multdiv;
                break;
            default:
                alert("Unknown multi-operand operator: '"+op+"'.");
                break;
        }
    }

    toString() {
        var theStr,
            opStr,
            isError = false,
            showOp;

        theStr = '';
        for (var i in this.inputs) {
            showOp = true;
            if (typeof this.inputs[i] == 'undefined') {
                opStr = '?';
                isError = true;
            } else {
                opStr = this.inputs[i].toString();
                if ((this.inputs[i].type >= exprType.unop
                        && this.inputs[i].prec <= this.prec)
                    || (this.inputs[i].type == exprType.number
                        && this.inputs[i].number.q != 1
                        && opPrec.multdiv <= this.prec)
                ) {
                    opStr = '(' + opStr + ')';
                }
            }
            theStr += ( i>0 ? this.op : '' ) + opStr;
        }

        return(theStr);
    }

    // Return an array containing all tested equivalent strings.
    allStringEquivs() {
        var allInputsArrays = [];

        var indexList = [];
        for (var i in this.inputs) {
            allInputsArrays[i] = this.inputs[i].allStringEquivs();
            indexList.push(i);
        }
        var inputPerms = permutations(indexList);

        var retValue = [];

        var theOp = this.op;
        if (theOp == '|') {
            // Don't want "or" to be translated as absolute value
            theOp = ' $ ';
        }

        function buildStringEquivs(indexList, leftStr) {
            if (typeof leftStr == "undefined") {
                leftStr = "";
            } else if (indexList.length > 0) {
                leftStr += theOp;
            }
            if (indexList.length > 0) {
                var workInputs = allInputsArrays[indexList[0]];
                for (var i in workInputs) {
                    buildStringEquivs(indexList.slice(1), leftStr + "(" + workInputs[i] + ")");
                }
            } else {
                retValue.push(leftStr);
            }
        }

        for (var i in inputPerms) {
            buildStringEquivs(inputPerms[i]);
        }

        return(retValue);
    }

    toTeX(showSelect) {
        var theStr;
        var theOp;
        var opStr;
        var argStrL, argStrR, opStrL, opStrR;

        if (typeof showSelect == 'undefined') {
            showSelect = false;
        }

        theOp = this.op;
        if (this.op == '*') {
            if (showSelect && this.select) {
                theOp = '\\times';
            } else {
                theOp = ' ';
            }
        }

        if (showSelect && this.select) {
            argStrL = '{\\color{blue}';
            argStrR = '}';
            opStrL = '{\\color{red}';
            opStrR = '}';
        } else {
            argStrL = '';
            argStrR = '';
            opStrL = '';
            opStrR = '';
        }

        theStr = '';
        var minPrec = this.prec;
        for (var i in this.inputs) {
            if (typeof this.inputs[i] == 'undefined') {
                opStr = '?';
                theStr += ( i>0 ? opStrL + theOp + opStrR : '' ) + opStr;
            } else {
                if (this.op == '*'
                        && this.inputs[i].type == exprType.unop && this.inputs[i].op == '/'
                        && !(showSelect && this.select))
                {
                    opStr = argStrL + this.inputs[i].inputs[0].toTeX(showSelect) + argStrR;
                    if (this.inputs[i].inputs[0].type >= exprType.unop && this.inputs[i].inputs[0].prec < minPrec) {
                        opStr = '\\left(' + opStr + '\\right)';
                    }
                    if (theStr == '') {
                        theStr = '1'
                    }
                    theStr = '\\frac{' + theStr + '}{' + opStr + '}';

                } else if (this.op == '+'
                        && this.inputs[i].type == exprType.unop && this.inputs[i].op == '-'
                        && !(showSelect && this.select))
                {
                    opStr = argStrL + this.inputs[i].toTeX(showSelect) + argStrR;
                    theStr += opStr;
                } else {
                    opStr = argStrL + this.inputs[i].toTeX(showSelect) + argStrR;
                    if ((this.inputs[i].type >= exprType.unop
                            && this.inputs[i].prec <= minPrec)
                        || (i>0 && this.op == '*' && this.inputs[i].type == exprType.number)) {
                        opStr = '\\left(' + opStr + '\\right)';
                    }
                    theStr += ( i>0 ? opStrL + theOp + opStrR : '' ) + opStr;
                }
            }
        }

        return(theStr);
    }

    toMathML() {
        var theStr;
        var theOp;
        var opStr;

        switch (this.op) {
            case '+':
                theOp = "<plus/>"
                break;
            case '*':
                theOp = "<times/>"
                break;
        }

        theStr = "<apply>" + theOp;
        for (var i in this.inputs) {
            if (typeof this.inputs[i] == 'undefined') {
                opStr = '?';
            } else {
                opStr = this.inputs[i].toMathML();
            }
            theStr += opStr;
        }
        theStr += "</apply>";

        return(theStr);
    }

    operateToTeX() {
        var opString = this.op;

        switch (opString) {
            case '*':
                opString = '\\times';
                break;
        }

        return(opString);
    }

    isCommutative() {
        var commutes = false;
        if (this.op === '+' || this.op === '*') {
            commutes = true;
        }
        return(commutes);
    }

    evaluate(bindings) {
        var inputVal;
        var i;
        var retVal;

        switch (this.op) {
            case '+':
                retVal = 0;
                for (i in this.inputs) {
                    inputVal = this.inputs[i].evaluate(bindings);
                    retVal += inputVal;
                }
                break;
            case '*':
                retVal = 1;
                for (i in this.inputs) {
                    inputVal = this.inputs[i].evaluate(bindings);
                    retVal *= inputVal;
                }
                break;
            default:
                console.log("The binary operator '" + this.op + "' is not defined.");
                retVal = undefined;
                break;
        }
        return(retVal);
    }

    // Flatten and also sort terms.
    flatten() {
        var newInputs = [];
        for (var i in this.inputs) {
            var nextInput = this.inputs[i].flatten();
            if (nextInput.type == exprType.multiop && nextInput.op == this.op) {
                for (var j in nextInput.inputs) {
                    newInputs.push(nextInput.inputs[j]);
                }
            } else {
                newInputs.push(nextInput);
            }
        }

        var retValue;
        if (newInputs.length == 0) {
            // Adding no elements = 0
            // Multiplying no elements = 1
            retValue = create_scalar(this.menv, this.op == '+' ? 0 : 1);
        } else if (newInputs.length == 1) {
            retValue = newInputs[0];
        } else {
            // Sort the inputs by precedence for products
            // Usually very small, so bubble sort is good enough
            if (this.op=='*') {
                var tmp;
                for (var i=0; i<newInputs.length-1; i++) {
                    for (var j=i+1; j<newInputs.length; j++) {
                        if (newInputs[i].type > newInputs[j].type) {
                            tmp = newInputs[i];
                            newInputs[i] = newInputs[j];
                            newInputs[j] = tmp;
                        }
                    }
                }
            }
            retValue = create_multiop(this.menv, this.op, newInputs);
        }
        return(retValue);
    }

    // See if this operator is now redundant.
    // Return the resulting expression.
    reduce() {
        var workExpr = super.reduce();
        var newExpr = workExpr;
        if (workExpr.type == exprType.multiop && workExpr.inputs.length <= 1) {
            if (workExpr.inputs.length == 0) {
                // Sum with no elements = 0
                // Product with no elements = 1
                newExpr = create_scalar(this.menv, workExpr.op == '+' ? 0 : 1);
            } else {
                // Sum or product with one element *is* that element.
                newExpr = workExpr.inputs[0];
            }
            newExpr.parent = this.parent;
            if (this.parent !== null) {
                this.parent.inputSubst(this, newExpr);
            }
        }
        return(newExpr);
    }

    simplifyConstants() {
        var constIndex = [],
            newInputs = [];
        // Simplify all inputs
        // Notice which inputs are themselves constant 
        for (let i in this.inputs) {
            this.inputs[i] = this.inputs[i].simplifyConstants();
            this.inputs[i].parent = this;
            if (this.inputs[i].type == exprType.number ||
                (this.inputs[i].type == exprType.unop && this.inputs[i].inputs[0].type == exprType.number)
            ) {
                constIndex.push(i);
            } else {
                newInputs.push(this.inputs[i]);
            }
        }

        // For all inputs that are constants, group them together and simplify.
        var newExpr = this;
        if (constIndex.length > 1) {
            var newConstant;
            switch (this.op) {
                case '+':
                    newConstant = new rational_number(0);
                    for (let i in constIndex) {
                        if (this.inputs[constIndex[i]].type == exprType.number) {
                            newConstant = newConstant.add(this.inputs[constIndex[i]].number);
                        } else if (this.inputs[constIndex[i]].type == exprType.unop) {
                            switch (this.inputs[constIndex[i]].op) {
                                case '+':
                                case '*':
                                    newConstant = newConstant.add(this.inputs[constIndex[i]].inputs[0].number);
                                    break;
                                case '-':
                                    newConstant = newConstant.subtract(this.inputs[constIndex[i]].inputs[0].number);
                                    break;
                                case '/':
                                    newConstant = newConstant.add(this.inputs[constIndex[i]].inputs[0].number.multInverse());
                                    break;
                            }
                        }
                    }
                    break;
                case '*':
                    newConstant = new rational_number(1);
                    for (let i in constIndex) {
                        if (this.inputs[constIndex[i]].type == exprType.number) {
                            newConstant = newConstant.multiply(this.inputs[constIndex[i]].number);
                        } else if (this.inputs[constIndex[i]].type == exprType.unop) {
                            switch (this.inputs[constIndex[i]].op) {
                                case '+':
                                case '*':
                                    newConstant = newConstant.multiply(this.inputs[constIndex[i]].inputs[0].number);
                                    break;
                                case '-':
                                    newConstant = newConstant.multiply(this.inputs[constIndex[i]].inputs[0].number.addInverse());
                                    break;
                                case '/':
                                    newConstant = newConstant.divide(this.inputs[constIndex[i]].inputs[0].number);
                                    break;
                            }
                        }
                    }
                    break;
            }

            // For addition, the constant goes to the end.
            // For multiplication, the constant goes to the beginning.
            var newInput;
            switch (this.op) {
                case '+':
                    newInputs.push(newInput = create_scalar(this.menv, newConstant));
                    break;
                case '*':
                    newInputs.splice(0, 0, newInput = create_scalar(this.menv, newConstant));
                    break;
            }
            if (newInputs.length == 1) {
                newExpr = newInputs[0];
            } else {
                newInput.parent = this;
                newExpr = create_multiop(this.menv, this.op, newInputs);
            }
        }
        return(newExpr);
    }

    // This comparison routine needs to deal with two issues.
    // (1) The passed expression has more inputs than this (in which case we group them)
    // (2) Possibility of commuting makes the match work.
    match(expr, bindings) {
        function copyBindings(bindings)
        {
            var retValue = {};
            for (var key in bindings) {
                retValue[key] = bindings[key];
            }
            return(retValue);
        }

        var retValue = null,
            n = this.inputs.length;
        if ((expr.type == exprType.multiop || expr.type == exprType.binop)
            && this.op == expr.op && n <= expr.inputs.length) {

            // Match on first n-1 and group remainder at end.
            var cmpExpr,
                cmpInputs = [];

            for (var i=0; i<n; i++) {
                if (i<(n-1) || expr.inputs.length==n) {
                    cmpInputs[i] = expr.inputs[i].copy();
                } else {
                    // Create copies of the inputs
                    var newInputs = [];
                    for (var j=0; j<=expr.inputs.length-n; j++) {
                        newInputs[j] = expr.inputs[n+j-1].copy();
                    }
                    cmpInputs[i] = create_multiop(this.menv, expr.op, newInputs);
                }
            }
            cmpExpr = create_multiop(this.menv, expr.op, cmpInputs);

            // Now make the comparison.
            retValue = copyBindings(bindings);
            retValue = expression.prototype.match.call(this, cmpExpr, retValue);

            // If still fail to match, try the reverse grouping: match on last n-1 and group beginning.
            if (retValue == null && n < expr.inputs.length) {
                var diff = expr.inputs.length - n;
                cmpInputs = [];

                for (var i=0; i<n; i++) {
                    if (i==0) {
                        // Create copies of the inputs
                        var newInputs = [];
                        for (var j=0; j<=diff; j++) {
                            newInputs[j] = expr.inputs[j].copy();
                        }
                        cmpInputs[i] = create_multiop(this.menv, expr.op, newInputs);
                    } else {
                        cmpInputs[i] = expr.inputs[diff+i].copy();
                    }
                }
                cmpExpr = create_multiop(this.menv, expr.op, cmpInputs);

                // Now make the comparison.
                retValue = copyBindings(bindings);
                retValue = expression.prototype.match.call(this, cmpExpr, retValue);
            }
        }
        return(retValue);
    }

    copy() {
        var newInputs = new Array();
        for (var i in this.inputs) {
            newInputs.push(this.inputs[i].copy());
        }
        return (create_multiop(this.menv, this.op, newInputs));
      }

    compose(bindings) {
        var newInputs = [];

        for (var i in this.inputs) {
            newInputs.push(this.inputs[i].compose(bindings));
        }

        var retValue;
        if (newInputs.length == 0) {
            retValue = create_scalar(this.menv, this.op == '+' ? 0 : 1);
        } else if (newInputs.length == 1) {
            retValue = newInputs[0];
        } else {
            retValue = create_multiop(this.menv, this.op, newInputs);
        }
        return(retValue);
    }

    derivative(ivar, varList) {
        var dTerms = [];

        var theDeriv;
        var i, dudx;
        for (i in this.inputs) {
            if (!this.inputs[i].isConstant()) {
                dudx = this.inputs[i].derivative(ivar, varList);
                switch (this.op) {
                    case '+':
                        dTerms.push(dudx);
                        break;
                    case '*':
                        var dProdTerms = [];
                        for (let j in this.inputs) {
                            if (i == j) {
                                dProdTerms.push(dudx);
                            } else {
                                dProdTerms.push(this.inputs[j].compose({}));
                            }
                        }
                        dTerms.push(create_multiop(this.menv, '*', dProdTerms));
                        break;
                }
            }
        }
        if (dTerms.length == 0) {
            theDeriv = create_scalar(this.menv, 0);
        } else if (dTerms.length == 1) {
            theDeriv = dTerms[0];
        } else {
            theDeriv = create_multiop(this.menv, '+', dTerms);
        }
        return(theDeriv);
    }
}