/*!
 * menv JavaScript Library v@VERSION
 * https://github.com/dbrianwalton/menv
 *
 * Copyright D. Brian Walton
 * Released under the MIT license (https://opensource.org/licenses/MIT)
 *
 * Date: @DATE
 */

/* *********************************************************************************
**  Dealing with identities and reductions.
********************************************************************************* */

import {MENV, exprType, exprValue } from "./BTM_root.js";

class Identity {
    constructor(refExpr, eqExpr, description, isValid, idNum) {
        this.refExpr = refExpr;
        this.eqExpr = eqExpr;
        this.description = description;
        this.isValid = isValid;
        this.isActive = true;
        this.idNum = idNum;
    }
}

class Match {
    constructor(testRule, bindings) {
        // Find unbound variables.
        var allVars = testRule.eqExpr.dependencies(),
            missVars = [];
        for (var j in allVars) {
            if (typeof bindings[allVars[j]] == 'undefined') {
                missVars.push(allVars[j]);
            }
        }
        for (var j in missVars) {
            bindings[missVars[j]] = "input"+(+j+1)+"";
        }
        this.subExpr = testRule.eqExpr.compose(bindings);

        this.subTeX = this.subExpr.toTeX();
        this.subStr = this.subExpr.toString();
        this.name = testRule.description;
        if (this.subExpr.type == exprType.binop && this.subExpr.valueType == exprValue.bool) {
            this.equation = testRule.refExpr.toTeX() + " \\iff " + testRule.eqExpr.toTeX();
        } else {
            this.equation = testRule.refExpr.toTeX() + "=" + testRule.eqExpr.toTeX();
        }
        this.bindings = bindings;
        this.numInputs = missVars.length;
        this.ruleID = testRule.idNum;
    }
}



export function newRule(menv, reductionList, equation, description, isValid, useOneWay, constraints) {
    var exprFormulas = equation.split('==');
    if (exprFormulas.length != 2) {
        console.log("Invalid equation in identity list: " + equation);
    } else {
        for (var refID=0; refID <= 1; refID++) {
            if (refID == 1 && typeof useOneWay != 'undefined' && useOneWay) {
                break;
            }
            var identity;

            var refExpr = menv.parse(exprFormulas[refID],"formula");
            var eqExpr = menv.parse(exprFormulas[1-refID],"formula");
            var numVars = refExpr.dependencies().length;
            var allRefExpr = [exprFormulas[refID]];
            // this is a big slow down, so just make sure each rule is written in multiple ways.
            //      var allRefExpr = refExpr.allStringEquivs();

            var uniqueExpr = [];
            for (var i in allRefExpr) {
                var nextExpr = menv.parse(allRefExpr[i],"formula");
                var isNew = true;
                for (var j in uniqueExpr) {
                    var bindings = uniqueExpr[j].match(nextExpr, {});
                    if (bindings !== null) {
                        isNew = false;
                    }
                }
                if (isNew) {
                    var ruleID = reductionList.length+1;
                    identity = new Identity(nextExpr, eqExpr, description, isValid, ruleID);
                    reductionList.push(identity);
                    uniqueExpr.push(nextExpr);
                }
            }
        }
    }
}

// Disable a rule in the list.
export function disableRule(menv, reductionList, equation) {
  // Match only on refExpr.
  var exprFormulas = equation.split('==');
  var refExpr, eqExpr;
  if (exprFormulas.length > 2) {
    console.log("Invalid equation in identity list: " + equation);
    return;
  } else {
    refExpr = menv.parse(exprFormulas[0],"formula");
  }
  for (var i in reductionList) {
    var testRule = reductionList[i];
    var bindings = testRule.refExpr.match(refExpr, {})
    if (bindings !== null) {
      reductionList[i].isActive = false;
    }
}
}

/* *******************
** Given a list of reduction rules and a given expression,
** test each reduction rule to see if it matches the structure.
** Create an array of new objects with bindings stating what
** substitutions are necessary to make the matches.
******************* */
export function findMatchRules(reductionList, testExpr, doValidate) {
    var matchList = [];
    var i, testRule;
    for (i in reductionList) {
        testRule = reductionList[i];
        var bindings = testRule.refExpr.match(testExpr, {})
        if (testRule.isActive && bindings !== null) {
            var match = new Match(testRule, bindings);
            matchList.push(match);
        }
    }
    return(matchList);
}


export function defaultReductions(menv) {
    var reduceRules = new Array();

    newRule(menv, reduceRules, '0+x==x', 'Additive Identity', true, true);
    newRule(menv, reduceRules, 'x+0==x', 'Additive Identity', true, true);
    newRule(menv, reduceRules, '0-x==-x', 'Additive Inverse', true, true);
    newRule(menv, reduceRules, 'x-0==x', 'Additive Identity', true, true);
    newRule(menv, reduceRules, 'x+-(0)==x', 'Additive Identity', true, true);
    newRule(menv, reduceRules, '0*x==0', 'Multiply by Zero', true, true);
    newRule(menv, reduceRules, 'x*0==0', 'Multiply by Zero', true, true);
    newRule(menv, reduceRules, '1*x==x', 'Multiplicative Identity', true, true);
    newRule(menv, reduceRules, 'x*1==x', 'Multiplicative Identity', true, true);
    newRule(menv, reduceRules, '0/x==0', 'Multiply by Zero', true, true);
    newRule(menv, reduceRules, 'x/1==x', 'Divide by One', true, true);
    newRule(menv, reduceRules, 'x^1==x', 'First Power', true, true);
    newRule(menv, reduceRules, 'x^0==1', 'Zero Power', true, true);
    newRule(menv, reduceRules, 'x^(-a)==1/(x^a)', 'Negative Power', true, true);
    newRule(menv, reduceRules, '1^x==1', 'One to a Power', true, true);
    newRule(menv, reduceRules, '-1*x==-x', 'Multiplicative Identity', true, true);
    newRule(menv, reduceRules, 'x*-1==-x', 'Multiplicative Identity', true, true);
    newRule(menv, reduceRules, 'x-x==0', 'Additive Inverses Cancel', true, true);
    newRule(menv, reduceRules, 'x+-x==0', 'Additive Inverses Cancel', true, true);
    newRule(menv, reduceRules, '-x+x==0', 'Additive Inverses Cancel', true, true);
    newRule(menv, reduceRules, 'x+(-y)==x-y', "Subtraction", true, true);
    newRule(menv, reduceRules, '(-x)+(-y)==-(x+y)', "Factor Negation from Addition", true, true);
    newRule(menv, reduceRules, 'x-(-y)==x+y', "Additive Inverse's Inverse", true, true);
    newRule(menv, reduceRules, 'x*(-y)==(-x)*y', "Factor Negation from Multiplication", true, true);
    newRule(menv, reduceRules, '(-x)/y==-(x/y)', "Factor Negation from Multiplication", true, true);
    newRule(menv, reduceRules, 'x/(-y)==-(x/y)', "Factor Negation from Multiplication", true, true);
    newRule(menv, reduceRules, '-(-x)==x', "Additive Inverse's Inverse", true, true);
    newRule(menv, reduceRules, '/(/x)==x', "Multiplicative Inverse's Inverse", true, true);

    return(reduceRules);
}

export function defaultSumReductions(menv) {
    var sumReductions = new Array();

    newRule(menv, sumReductions, 'a+0==a', 'Simplify Addition by Zero', true, true);
    newRule(menv, sumReductions, '0+a==a', 'Simplify Addition by Zero', true, true);
    newRule(menv, sumReductions, 'a-a==0', 'Cancel Additive Inverses', true, true);
    newRule(menv, sumReductions, 'a+-a==0', 'Cancel Additive Inverses', true, true);
    newRule(menv, sumReductions, '-a+a==0', 'Cancel Additive Inverses', true, true);
    newRule(menv, sumReductions, 'a*b+-a*b==0', 'Cancel Additive Inverses', true, true);
    newRule(menv, sumReductions, '-a*b+a*b==0', 'Cancel Additive Inverses', true, true);
    newRule(menv, sumReductions, 'a*(b+c)==a*b+a*c', 'Expand Products by Distributing', true, true);
    newRule(menv, sumReductions, '(a+b)*c==a*c+b*c', 'Expand Products by Distributing', true, true);
    newRule(menv, sumReductions, 'a*(b-c)==a*b-a*c', 'Expand Products by Distributing', true, true);
    newRule(menv, sumReductions, '(a-b)*c==a*c-b*c', 'Expand Products by Distributing', true, true);

    return(sumReductions);
}

export function defaultProductReductions(menv) {
    var productReductions = new Array();

    newRule(menv, productReductions, '0*a==0', 'Simplify Multiplication by Zero', true, true);
    newRule(menv, productReductions, 'a*0==0', 'Simplify Multiplication by Zero', true, true);
    newRule(menv, productReductions, '1*a==a', 'Simplify Multiplication by One', true, true);
    newRule(menv, productReductions, 'a*1==a', 'Simplify Multiplication by One', true, true);
    newRule(menv, productReductions, 'a/a==1', 'Cancel Multiplicative Inverses', true, true);
    newRule(menv, productReductions, 'a*/a==1', 'Cancel Multiplicative Inverses', true, true);
    newRule(menv, productReductions, '/a*a==1', 'Cancel Multiplicative Inverses', true, true);
    newRule(menv, productReductions, '(a*b)/(a*c)==b/c', 'Cancel Common Factors', true,true);
    newRule(menv, productReductions, 'a^m/a^n==a^(m-n)', 'Cancel Common Factors', true,true);
    newRule(menv, productReductions, '(a^m*b)/(a^n*c)==(a^(m-n)*b)/c', 'Cancel Common Factors', true,true);
    newRule(menv, productReductions, 'a*a==a^2', 'Write Products of Common Terms as Powers', true, true);
    newRule(menv, productReductions, 'a*a^n==a^(n+1)', 'Write Products of Common Terms as Powers', true, true);
    newRule(menv, productReductions, 'a^n*a==a^(n+1)', 'Write Products of Common Terms as Powers', true, true);
    newRule(menv, productReductions, 'a^m*a^n==a^(m+n)', 'Write Products of Common Terms as Powers', true, true);
    newRule(menv, productReductions, '(a^-m*b)/c==b/(a^m*c)', 'Rewrite Using Positive Powers', true,true);
    newRule(menv, productReductions, '(b*a^-m)/c==b/(a^m*c)', 'Rewrite Using Positive Powers', true,true);
    newRule(menv, productReductions, 'b/(a^-m*c)==(a^m*b)/c', 'Rewrite Using Positive Powers', true,true);
    newRule(menv, productReductions, 'b/(c*a^-m)==(a^m*b)/c', 'Rewrite Using Positive Powers', true,true);

    return (productReductions);
  }