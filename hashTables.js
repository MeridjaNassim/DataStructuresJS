var exports = (module.exports = {});
/// hash Tables  :
// linear probing :
function Item(key, val) {
  this.key = key;
  this.val = val;
  this.del = false;
  this.show = () => {
    return { key: this.key, value: this.val };
  };
}

function Case(item, empty) {
  this.item = item;
  this.empty = empty;
  this.get = () => {
    return empty ? null : this.item;
  };
}

function HashTableLinProb(initCapacity, load_factor, hashFunction) {
  this.datastore = new Array(initCapacity);
  this.capacity = initCapacity;
  this.load_factor = load_factor;
  this.hashFunction = hashFunction;
  this.inserted = 0;
  this.find = key => {
    let adr = this.hashFunction(key) % this.capacity;

    let i;
    let j = adr;
    let trouv = false;
    let stop = false;
    while (
      !trouv &&
      this.datastore[j] != null &&
      this.datastore[j].empty != true &&
      !stop
    ) {
      if (
        this.datastore[j].get().key == key &&
        this.datastore[j].get().del != true
      ) {
        trouv = true;
        i = j;
      } else {
        j = (j - 1) % initCapacity;
        if (j < 0) j += initCapacity;
        if (j == adr) {
          stop = true;
          trouv = false;
        }
      }
    }
    if (!trouv) {
      if (!stop) {
        i = j;
      } else {
        i = -1;
      }
    }
    return {
      found: trouv,
      adr: i
    };
  };
  this.insert = (key, val) => {
    let search = this.find(key);
    if (!search["found"]) {
      let index = search["adr"];
      if (this.inserted / this.capacity < this.load_factor) {
        let casse = new Case(new Item(key, val), false);
        this.datastore[index] = casse;
        this.inserted++;
      } else {
        this.rehash();
        this.insert(key, val);
      }
    }
  };
  this.rehash = () => {
    let capacity = initCapacity * 2;
    let newHashTable = new HashTableLinProb(
      capacity,
      this.load_factor,
      this.hashFunction
    );
    for (let i in this.datastore) {
      if (this.datastore[i] != null) {
        if (this.datastore[i].get().del != true) {
          newHashTable.insert(
            this.datastore[i].item.key,
            this.datastore[i].item.val
          );
        }
      }
    }
    this.datastore = newHashTable.datastore;
    this.capacity = capacity;
  };
  this.delete = key => {
    let search = this.find(key);
    if (search["found"] == true) {
      this.datastore[search["adr"]].get().del = true;
    }
  };
}
function hash(key) {
  let stringFormat = key.toString();
  let hash = stringFormat.charCodeAt(0);
  for (let i = 1; i < stringFormat.length; i++) {
    hash = hash + stringFormat.charCodeAt(i) * 191 * i;
  }
  return hash;
}

// external chaining HashTable

function ChainedItem(key, val, next) {
  this.key = key;
  this.val = val;
  this.next = next;
  this.show = () => {
    return { key: key, value: val, next: next == null ? null : next.show() };
  };
  this.hasNext = () => this.next != null;
}
function LinkedHashTable(initCapacity, load_factor, hashFunction) {
  this.datastore = new Array(initCapacity);
  this.capacity = initCapacity;
  this.load_factor = load_factor;
  this.hashFunction = hashFunction;
  this.shrink_factor = this.load_factor / 3;
  this.inserted = 0;
  this.find = key => {
    let adr = hashFunction(key) % this.capacity;
    let item = this.datastore[adr];
    let found = false;
    if (item == null) {
      return { found: false, adr: adr };
    } else if (item.key == key) {
      return { found: true, adr: adr };
    }
    let prec = -1;
    while (!found) {
      if (item.key == key) {
        found = true;
        return { found: found, previous: prec, item: item };
      } else {
        if (item.hasNext()) {
          prec = item;
          item = item.next;
        } else {
          break;
        }
      }
    }
    if (!found) {
      return { found: found, previous: prec == -1 ? item : prec };
    }
  };
  this.insert = (key, val) => {
    let search = this.find(key);
    if (!search["found"]) {
      let e = new ChainedItem(key, val, null);
      if (this.inserted / this.capacity < this.load_factor) {
        if (search["adr"] != null) {
          this.datastore[search["adr"]] = e;
          this.inserted++;
        } else {
          search["previous"].next = e;
          this.inserted++;
        }
      } else {
        this.rehash(2);
        this.insert(key, val);
      }
    } else {
      // updating the item if found ;
      search["item"].val = val;
    }
  };
  this.rehash = factor => {
    let capacity = Math.floor(initCapacity * factor);
    let newHashTable = new LinkedHashTable(
      capacity,
      this.load_factor,
      this.hashFunction
    );
    for (let i in this.datastore) {
      if (this.datastore[i] != null) {
        let p = this.datastore[i];
        newHashTable.insert(p.key, p.val);
        while (p.hasNext()) {
          p = p.next;
          newHashTable.insert(p.key, p.val);
        }
      }
    }
    this.datastore = newHashTable.datastore;
    this.capacity = capacity;
  };
  this.delete = key => {
    let search = this.find(key);
    if (search["found"]) {
      let adr = search["adr"];
      if (adr != null) {
        this.datastore[adr] = this.datastore[adr].next;
        this.inserted--;
      } else {
        /// in the chained list ;
        search["previous"].next = search["item"].next;
        this.inserted--;
        search["item"] = null;
      }
      if (this.inserted / this.capacity < this.shrink_factor) {
        this.rehash(1 / 2);
      }
    }
  };
  this.show = arr => {
    console.table(this.datastore, arr);
  };
}

function HashTable(initCapacity, load_factor, hashFunction) {
  /**
   * Implementation of the HashTable DataStructure using ES6 functions , this implementation uses resizable arrays method to resolve collisions
   * Accepts an @initialcapacity and a @load_factor to resize the table to minimize further collisions
   * Uses @hashFunctionn to map keys to adresses in the datastore which can be any function wanted by the user ( make sure it distributes adresses uniformly)
   * Implements basic opérations like : find(key) , insert(key,val) ,delete(key), show() , and provides the number of inserted elements
   */
  this.datastore = new Array(initCapacity);
  this.load_factor = load_factor;
  this.capacity = initCapacity;
  this.hashFunction = hashFunction;
  this.shrink_factor = this.load_factor / 3; /// used to shrink back to table to save unused memory
  this.inserted = 0;
  /**
   *  Inserts Object = { key : @key , value : @val } in the hashtable if not found in the table , and updates its @value to val if found already
   */
  this.insert = (key, val) => {
    let { found, adr, position } = this.find(key);
    if (!found) {
      if (this.inserted / this.capacity < load_factor) {
        if (this.datastore[adr] == null) {
          this.datastore[adr] = [{ key: key, value: val }];
        } else {
          this.datastore[adr].push({ key: key, value: val });
        }
        this.inserted++;
      } else {
        this.rehash(2);
        this.insert(key, val);
      }
    } else {
      if (position != null) {
        this.datastore[adr][position].value = val;
      }
    }
  };
  /**
   * Finds whether there is exist an Object having the key @key in the table and returns its position , else it returns where it should be inserted
   */
  this.find = key => {
    let adr = hashFunction(key) % this.capacity;
    let item = this.datastore[adr];
    if (item == null) {
      return { found: false, adr: adr };
    } else {
      let i = 0;
      for (i = 0; i < item.length; i++) {
        if (item[i].key == key) {
          return { found: true, adr: adr, position: i };
        }
      }
      return { found: false, adr: adr, position: i };
    }
  };
  /**
   *
   * Resizes the Table to capacity * factor size and inserts all existing objects back to the new table
   *
   */
  this.rehash = factor => {
    let capacity = Math.floor(this.capacity * factor);
    let newTable = new HashTable(capacity, this.load_factor, this.hashFunction);
    for (let i = 0; i < this.datastore.length; i++) {
      let item = this.datastore[i];
      if (item != null) {
        for (let j = 0; j < item.length; j++) {
          newTable.insert(item[j].key, item[j].value);
        }
      }
    }

    this.datastore = newTable.datastore;
    this.capacity = capacity;
  };

  /**
   * Deletes the object in the table having the key @key and shrinks the table if shrink_factor was exceeded and rehashing all keys .
   */
  this.delete = key => {
    let { found, adr, position } = this.find(key);
    if (found) {
      if (position == null) {
        this.datastore[adr] = null;
      } else {
        this.datastore[adr].splice(position, 1);
      }
      this.inserted--;
      if (this.inserted / this.capacity < this.shrink_factor) {
        this.rehash(1 / 2);
      }
    }
  };
  /**
   * Prints to console a Table representation of the HashTable
   */
  this.show = () => {
    console.table(this.datastore);
  };
}
/// Dynamic Hashing :

/**
 *
 * Linear Hashing implementation
 *
 */

/**
 * family of hash function that computes the reminder of the key( as integer ) by 2^i
 * @param {the bit count} i
 * @param {the integer representation of the key} key
 */
function hash_i(i, key) {
  let pow = Math.pow(2, i);
  return key % pow;
}

/**
 * The container for items inserted in the Linear Hash Table
 * @param {number of individual items that can be stored in the bucket(not counting overflown ones)} capacity
 */
function Bucket(capacity) {
  this.datastore = {
    main: new Array(capacity),
    overflow: new Array()
  };
  this.capacity = capacity;
  this.inserted = 0;
  this.isOverflow = () => {
    return this.datastore["overflow"].length != 0;
  };
  this.add = obj => {
    if (this.inserted < capacity) {
      this.datastore["main"][this.inserted] = obj;
      this.inserted++;
    } else {
      this.datastore["overflow"].push(obj);
    }
  };
  this.show = () => {
    console.table(this.datastore);
  };
  this.find = key => {
    let i = 0;
    while (i < this.capacity) {
      let x = this.datastore["main"][i];
      if (x == null) {
        break;
      } else {
        if (x.key == key) {
          return {
            found: true,
            overflow: false,
            index: i
          };
        }
        i++;
        x = this.datastore["main"][i];
      }
    }
    if (this.isOverflow()) {
      i = 0;
      let l = this.datastore["overflow"].length;
      let x = this.datastore["overflow"][i];
      while (i < l) {
        if (x == null) {
          break;
        } else {
          if (x.key == key) {
            return {
              found: true,
              overflow: true,
              index: i
            };
          } else {
            i++;
            x = this.datastore["overflow"][i];
          }
        }
      }
      return {
        found: false,
        overflow: true,
        index: i
      };
    }
    return {
      found: false,
      overflow: false,
      index: this.inserted
    };
  };
}

/**
 * Implementation of a Dynamic HashTable that simulates the linear Hashing mechanism used in file organization , uses the split by overflow method to increase number of buckets over time to preserve performance
 * @param {number of items that can be stored in a bucket (bloc size)} bucket_capacity
 * @param {the hash function used to convert any key to integer representation } hashFunction
 */
function LinearHashTable(bucket_capacity, hashFunction) {
  this.hashFunction = hashFunction;
  this.capacity_bucket = bucket_capacity;
  this.N = 2; // number of buckets in use
  this.level = 1; // current level (number of bits to get bucket index after hashing)
  this.datastore = new Array(this.N); // the array of buckets
  this.datastore[0] = new Bucket(this.capacity_bucket);
  this.datastore[1] = new Bucket(this.capacity_bucket);
  this.split_pointer = 0; /// pointer indicating the next bucket to split after an overflow has occured

  this.lastAddedBucket = 1;
  /**
   * finds the index of the bucket that can contain an item having this key
   */
  this.findBucket = key => {
    let hash = this.hashFunction(key);
    let bucketAdr = hash_i(this.level, hash);
    if (bucketAdr < this.split_pointer) {
      bucketAdr = hash_i(this.level + 1, hash);
    }
    return bucketAdr;
  };
  /**
   * Gets the index of the @key in the @bucket , index depends on whether the item can be overflown or not
   */
  this.findInBucket = (key, bucket) => {
    if (bucket < this.N) {
      let b = this.datastore[bucket];
      return b.find(key);
    }
  };
  this.find = key => {
    let b = this.findBucket(key);
    return this.findInBucket(key, b);
  };
  /**
   * function that splits the bucket pointed by @pointer by creating a new bucket and relocating the keys pointed by the pointer
   */
  this.split = pointer => {
    // adding a new bucket
    this.datastore.push(new Bucket(this.capacity_bucket));
    this.N++;
    this.lastAddedBucket++;
    let i = 0;
    let splitted_bucket = this.datastore[pointer];
    while (i < this.capacity_bucket) {
      let item = splitted_bucket.datastore["main"][i];
      if (item != null) {
        let hash = this.hashFunction(item.key);
        let adr = hash_i(this.level + 1, hash);
        if (adr != pointer) {
          this.datastore[adr].add({ key: item.key, value: item.value });
          splitted_bucket.datastore["main"].splice(i, 1);
        }
      }
      i++;
    }
    /// splitting the overflow array
    if (splitted_bucket.isOverflow()) {
      let i = 0;
      while (i < splitted_bucket.datastore["overflow"].length) {
        let item = splitted_bucket.datastore["overflow"][i];
        if (item != null) {
          let hash = this.hashFunction(item.key);
          let adr = hash_i(this.level + 1, hash);
          if (adr != pointer) {
            this.datastore[adr].add({ key: item.key, value: item.value });
            splitted_bucket.datastore["overflow"].splice(i, 1);
          }
        }
        i++;
      }
    }
  };
  /**
   * Inserts an object {key : @key , value : @val } in the hashTable if not existant or updates its @value if existing .
   */
  this.insert = (key, val) => {
    let bucket = this.findBucket(key);
    let { found, overflow, index } = this.findInBucket(key, bucket);
    if (!found) {
      this.datastore[bucket].add({ key: key, value: val });
      if (this.datastore[bucket].isOverflow()) {
        this.split(this.split_pointer);
        this.split_pointer++;
        if (this.split_pointer == Math.pow(2, this.level + 1)) {
          this.level++;
          this.split_pointer = 0;
        }
      }
    } else {
      if (!overflow) {
        this.datastore[bucket]["main"][index].value = val;
      } else {
        this.datastore[bucket]["main"][index].value = val;
      }
    }
  };
  /**
   * prints a Representation of the HashTable to the console .
   */
  this.show = () => {
    for (let i = 0; i < this.N; i++) {
      console.log("Bucket number : ", i);
      this.datastore[i].show();
    }
  };
  this.shrink = () => {
    /// removing the last added bucket and rehashing all its items by hash_i(i)
    let bucket = this.datastore.pop();
    this.N--;
    this.lastAddedBucket--;
    let i = 0;
    while (bucket.datastore["main"].length != 0) {
      let item = bucket.datastore["main"][i];
      if (item != null) {
        let hash = this.hashFunction(item.key);
        let l = this.split_pointer == 0 ? this.level - 1 : this.level;
        let adr = hash_i(l, hash);
        this.datastore[adr].add({ key: item.key, value: item.value });
        bucket.datastore["main"].splice(i, 1);
      } else {
        break;
      }
    }
    i = 0;
    while (bucket.isOverflow()) {
      let item = bucket.datastore["overflow"][i];
      if (item != null) {
        let hash = this.hashFunction(item.key);
        let l = this.split_pointer == 0 ? this.level - 1 : this.level;
        let adr = hash_i(l, hash);
        this.datastore[adr].add({ key: item.key, value: item.value });
        bucket.datastore["overflow"].splice(i, 1);
      }
    }
  };
  this.delete = key => {
    let bucket = this.findBucket(key);
    let { found, overflow, index } = this.findInBucket(key, bucket);
    if (found) {
      if (!overflow) {
        this.datastore[bucket].datastore["main"].splice(index, 1);
        if (this.datastore[bucket].datastore["main"].length == 0) {
          this.shrink();
          if (this.split_pointer == 0) {
            this.level--;
            this.split_pointer = this.N - 1;
          }
        }
      } else {
        this.datastore[bucket].datastore["overflow"].splice(index, 1);
      }
    }
  };
}

exports.HashTable = HashTable;
exports.SimpleHashFunction = hash;
exports.LinkedHashTable = LinkedHashTable;
exports.LinearHashTable = LinearHashTable;
