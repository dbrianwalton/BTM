/*!
 * BTM JavaScript Library v@VERSION
 * https://github.com/dbrianwalton/BTM
 *
 * Copyright D. Brian Walton
 * Released under the MIT license (https://opensource.org/licenses/MIT)
 *
 * Date: @DATE
 */

/* *******************************
** Define a number array (ala numpy)
******************************* */
import { real_number } from "./real_number.js";
import { rational_number } from "./rational_number.js";

// Build a multidimensional array and fill with zero.
private zeros_array(shape) {
  var retArray;
  retArray = new Array(shape[0]);
  for (var i=0; i<shape[0]; i++) {
    if (shape.length > 1) {
      retArray[i] = zeros_array(shape.slice(1));
    } else {
      retArray[i] = new rational_number(0);
    }
  }
  return retArray;
}

class array_index {
  constructor(shape) {
    this.shape = shape;
    this.curIndex = zeros_array();
    this.done = false;
  }

  next() {
    var newIndex = this.curIndex;

    if (!this.done) {
      newIndex[this.shape.length-1]++;
      for (let i=this.shape.length-1; i > 1; i--) {
        if (newIndex[i] >= this.shape[i]) {
          newIndex[i] = 0;
          newIndex[i-1]++;
        }
      }
    }
    if (newIndex[0] >= this.shape[0]) {
      this.done = true;
    }

    this.curIndex = newIndex;
    return { value:this.curIndex, done:this.done };
  }
}

export class real_array {
  constructor(shape) {
    // shape should be a length or list of positive integers
    try {
      if (typeof shape === 'number' || shape instanceof Number) {
        // Put the shape in array
        shape = [ shape ];
      }
      if (Array.isArray(shape)) {
        for (i in shape) {
          if (typeof shape[i] !== 'number') {
            throw new Error("real_array constructor called with non-numeric dimension");
          }
          if (shape <= 0 || Math.floor(shape) != shape) {
            throw new Error("real_array constructor called with dimension that is not positive integer");
          }
        }
      } else {
        throw new Error("real_array constructor called with invalid shape")
      }
      // With valid shape, generate an array of values to store
      this.shape = shape;
      this.values = real_array.zeros_array(shape);
    }
    catch (error) {
      console.error(error);
    }
  }

  // Return the object stored at the given location
  entry() {
    var valueSelect = this.values;
    try {
      if (arguments.length != this.shape.length) {
        throw new Error("real_array.value dimension mismatch")
      }
      for (dim=0; dim<this.shape.length-1; dim++) {
        if (arguments[dim] < 0 || arguments[dim] >= this.shape[dim]) {
          throw new Error("real_array.value out of bounds request")
        }
        valueSelect = valueSelect[arguments[dim]];
      }
      return valueSelect.value();
    } catch(error) {
      console.error(error);
    }
  }

  // Return the value stored at the given location
  value() {
    var valueSelect = this.entry(arguments);
    return valueSelect.value();
  }
    
  // Simplify each internal entry.
  simplify() {
    var curFocus;
    for (let index in new array_index(this.shape)) {
      curFocus = this.values;
      for (let i=0; i<index.length; i++) {
        curFocus = curFocus[index[i]];
      }
      curFocus.simplify();
    }
  }

  equal(other) {
    if (other instanceof real_array && other.shape.length == this.shape.length) {
      let match=true;
      // Verify same dimensions.
      for (let i=0; match && i<this.shape.length; i++) {
        match = this.shape[i] == other.shape[i];
      }
      for (let index in new array_index(this.shape)) {
        if (this.value(index) != other.value(index)) {
          match = false;
          break;
        }
      }
      return match;
    } else {
      return false;
    }
  }

  is_close(other) {
    if (other instanceof real_array && other.shape.length == this.shape.length) {
      let match=true, sum_squares=0;
      // Verify same dimensions.
      for (let i=0; match && i<this.shape.length; i++) {
        match = this.shape[i] == other.shape[i];
      }
      if (match) {
        for (let index in new array_index(this.shape)) {
          let deviation = this.value(index) - other.value(index);
          sum_squares += deviation * deviation;
        }
      }
      return match && sum_squares < 1e-12;
    } else {
      return false;
    }
  }

    // Add numbers.
    add(other) {
      try {
        if (typeof other === 'number') {

        } else if (other instanceof real_number) {

        } else if (other instanceof real_array) {
          if (other.shape.length != this.shape.length) {
            throw new Error("real_array.add called with arrays of different dimensions");
          }
          // Verify same dimensions.
          let same_dims=true;
          for (let i=0; same_dims && i<this.shape.length; i++) {
            same_dims = this.shape[i] == other.shape[i];
          }
          if (!same_dims) {
            throw new Error("real_array.add called with arrays with mismatched dimensions");
          }
        } else {
          throw new Error("real_array.add called with non-numeric type");
        }

      } catch(error) {
        console.error(error);
      }
      if (typeof other === 'number') {
        other = new real_number(other);
      }
        var sum = new real_number(this.number + other.value());
        return(sum);
    }

    // Subtract this - other
    subtract(other) {
      if (typeof other === 'number') {
        other = new real_number(other);
      }
        var sum = new real_number(this.number - other.value());
        return(sum);
    }

    // Multiply this rational by another rational number and create new object.
    multiply(other) {
      if (typeof other === 'number') {
        other = new real_number(other);
      }
        var product = new real_number(this.number * other.value());
        return(product);
    }

    // Divide this rational by another rational number and create new object.
    divide(other) {
      if (typeof other === 'number') {
        other = new real_number(other);
      }
        var product;
        if (other.value != 0) {
            product = new real_number(this.number / other.value());
        } else {
            product = new real_number(NaN);
        }
        return(product);
    }

    // Additive Inverse
    addInverse() {
        var inverse = new real_number(-this.number);
        return(inverse);
    }

    // Multiplicative Inverse
    multInverse() {
        var inverse;
        if (this.number != 0) {
            inverse = new real_number(this.number);
        } else {
            inverse = new real_number(NaN);
        }
        return(inverse);
    }

    toString(leadSign) {
        if (typeof leadSign == 'undefined') {
            leadSign = false;
        }
        var str = (leadSign && this.number>0) ? '+' : '';
        if (isNaN(this.number)) {
            str = 'NaN';
        } else {
            str = str + Number(this.number.toFixed(10));
        }
  
        return(str);
    }
  
    // Format the rational number as TeX string.
    toTeX(leadSign) {
        if (typeof leadSign == 'undefined') {
            leadSign = false;
        }
        var str = (leadSign && this.number>0) ? '+' : '';
        if (isNaN(this.number)) {
            str = '\\mathrm{NaN}';
        } else {
            str = str + Number(this.toString(leadSign));
        }
        return(str);
    }

    // Format as a root MathML element.
    toMathML(leadSign) {
        return("<cn>" + this.toString() + "</cn>");
    }
}





 



