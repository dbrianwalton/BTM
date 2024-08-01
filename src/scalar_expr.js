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
* Define the Scalar Expression -- a numerical value
* *************************************************** */

import { expression } from "./expression.js"
import { real_number } from "./real_number.js"
import { rational_number } from "./rational_number.js"
import { unop_expr } from "./unop_expr.js"
import { exprType } from "./BTM_root.js"

export function create_scalar(menv, number) {
    var theNumber;
    var numObj;
    if (typeof number === "number" || number instanceof Number) {
        if (Math.floor(number)==number) {
            theNumber = new rational_number(number, 1);
        } else {
            theNumber = new real_number(number);
        }
    } else if (number instanceof real_number) {
        theNumber = number;
    } else if (number instanceof scalar_expr) {
        theNumber = number.number;
    } else {
        console.log("Trying to create a scalar_expr with a non-number object: " + number);
    }

    if (menv.options.negativeNumbers || theNumber.value() >=0) {
        numObj = new scalar_expr(menv, theNumber);
    } else {
        numObj = new unop_expr(menv, '-', new scalar_expr(menv, theNumber.multiply(-1)));
    }
    return (numObj);
}

export class scalar_expr extends expression {
    constructor(menv, number) {
        super(menv);
        this.type = exprType.number;
        if (typeof number === "number" ||
                number instanceof Number) {
            if (Math.floor(number)==number) {
                this.number = new rational_number(number, 1);
            } else {
                this.number = new real_number(number);
            }
        } else if (number instanceof real_number) {
                this.number = number;
        } else if (number instanceof scalar_expr) {
            this.number = number.number;
        } else {
            console.log("Trying to instantiate a scalar_expr with a non-number object: " + number);
        }
        this.context = "number";
    }

    // Parsed representation.
    toString(elementOnly) {
        if (typeof elementOnly == 'undefined') {
            elementOnly = false;
        }
        return(this.number.toString());
    }
    
    // Display representation.
    toTeX(showSelect) {
        if (typeof showSelect == 'undefined') {
            showSelect = false;
        }
        var word = this.number.toTeX();
        if (showSelect && this.select) {
            word = "{\\color{red}" + word + "}";
        }
        return(word);
    }
    
    // MathML representation.
    toMathML() {
        return("<cn>" + this.toString() + "</cn>");
    }
    
    // Return an array containing all tested equivalent strings.
    allStringEquivs() {
        return([this.toString()]);
    }
    
    // Test if represents constant value.
    isConstant() {
        /*
        This could just use expression.prototype.constant, but use this
        because it ALWAYS is true for scalar_expr and does not need a check
        */
        return(true);
    }
    
    // Combine constants where possible
    simplifyConstants() {
        var retValue;
        if (!this.menv.options.negativeNumbers && this.number.value() < 0) {
            var theNumber = this.number.multiply(-1);
            retValue = new unop_expr(this.menv, '-', new scalar_expr(this.menv, theNumber));
        } else {
            retValue = this;
        }
        return(retValue);
    }
    
    value() {
        return(this.number.value());
    }

    evaluate(bindings) {
        return(this.value());
    }
    
    copy() {
        return(create_scalar(this.menv, this.number));
    }
    
    compose(bindings) {
        return(create_scalar(this.menv, this.number));
    }
    
    derivative(ivar, varList) {
        return(create_scalar(this.menv, 0));
    }
    
    /*
        See expressions.prototype.match for explanation.
    
        A scalar might match a constant formula.
    */
    match(expr, bindings) {
        var retValue = null,
            testExpr = expr;
    
        // Special named constants can not match expressions.
        if (expr.isConstant() && expr.type != exprType.number) {
            var testExpr = expr.copy().simplifyConstants();
            if (this.toString() === testExpr.toString()) {
              retValue = bindings;
            }
        }
        else if (testExpr.type == exprType.number
                && this.number.equal(testExpr.number)) {
            retValue = bindings;
        }
    
        return(retValue);
    }    
}

