class example extends Promise {
  constructor(props){
    super(props)
  }
}

class DevPromise {
// your code
  constructor(exec) {
    if (typeof this !== 'object') throw new TypeError('must be new');
    if (typeof exec !== 'function') throw new TypeError('Argument must be a function');
    this.state = 'pending';
    this.settled = false;
    this.value = null;
    this.callbacks = [];
    try{
      exec(this._resolve.bind(this), this._reject.bind(this))
    } catch (e) {
      this._reject(e)
    }
  }


  static resolve(value) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError('resolve is static method');
    }
    if (value instanceof DevPromise) {
      return value;
    }
    return new this((resolve) => {
      resolve(value);
    })
  }
  static reject(reason) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError('reject is static method');
    }
    return new this((resolve, reject) => {
      reject(reason);
    });
  }

  catch(onReject) {
    return this.then(null, onReject);
  }

  _release(onResolve, onReject) {
    let handler;
    if (this.state === 'reject') {
      handler =  typeof onReject === 'function' ? onReject(this.value) : err => { throw new Error(err) }; 
    } else {
      handler =  typeof onResolve === 'function' ? onResolve(this.value) : v => v; 
    }
  }
  
  _resolve(value) {
    if (value === this) throw new TypeError('A promise cannot be resolved with itself.');
    if (this.state !== 'pending') return;
    this.state = 'fulfilled';
    if (value instanceof DevPromise) {
      value.done((value) => this._settle(value), (error) => {
        this.state = 'reject';
        this._settle(error);
      });
    } else {
      this._settle(value);
    }
  }
  
  _reject(value) {
    if (this.state !== 'pending') return;
    this.state = 'reject';
    this._settle(value);
  }

  _settle(value) {
    this.settled = true;
    this.value = value;
    setTimeout(() => {
      this.callbacks.forEach(item =>{
        this._release(item.onResolve, item.onReject);
      });
    }, 0);
  }

  done(onResolve, onReject) {
    if(this.settled) {
      setTimeout(() => this._release(onResolve, onReject),0)
    } else {
      this.callbacks.push({ onResolve, onReject });
    }
  }

  then(onResolve, onReject) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError('is invalid');
    }
    if (arguments.length === 0) return this;
    
    return new DevPromise((resolve, reject) => {
      this.done((value) => {
        if (typeof onResolve === 'function' || typeof onResolve === 'object') {
          try {
            value = onResolve(value);
          } catch (e) {
            reject(e);
          }
        }
        resolve(value);
      }, (value) => {
        if (typeof onReject === 'function') {
          try {
            value = onReject(value);
          } catch (e) {
            reject(e);
          }
          resolve(value);
        }
        reject(value);
      });
    });
  }
  static all (promises) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError('is invalid');
    }
    if(!Array.isArray(promises)) return new this((res,rej) => rej(TypeError('arguments shall be array of promises')));
    const results = [];  
    const merged = promises.reduce(
      (init, prItem) => init.then(() => prItem).then(res => results.push(res)),
      DevPromise.resolve(null));

    return merged.then(() => results);
  }
  
  static race(promises) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError('is invalid');
    }
    return new DevPromise((resolve, reject) => {
      promises.forEach(pr => pr.then(resolve, reject))
    });
  }

}



module.exports =  DevPromise // change to devPromise;