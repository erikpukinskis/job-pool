**job-pool** is yet another module for managing a pool of work and a number of asynchronous workers.

The thing that makes it unusual is that rather than encoding tasks as strings or some other serialized form, jobs are callbacks.

So, if you want a worker to add up some numbers:

```javascript
function addNumbers(callback) {
  var result = 1 + 2 + 3
  callback(result)
}
```

You pass that function to the pool:

```javascript
var JobPool = require("job-pool")

var jobPool = new JobPool()

jobPool.addTask(
  addNumbers,
  function(result) {
    // result will be 6
  }
)
```

In order for the result to actually be calculated, you need to register a worker:

```
jobPool.requestWork(
  function(task) {
    // at the worker's leisure, they can call the function:
    task.func(function(result) {
      // and then report back the result:
      task.callback(result)
      // at that point they'll be registered for more work
    })
  }
)
```

### Retaining workers

If you want to have a single worker do multiple tasks, you can retain them:

```javascript
var myWorker = jobPool.retainWorker()

myWorker.addTask(
  doThis,
  function() {
    myWorker.addTask(another, done)
  }
)

function doThis(callback) { callback () }

function another(callback) { callback () }

function done() {}
```

### Providing data

You can send a data payload to the worker as well, for them to apply to the function:

```javascript
jobPool.addTask(
  function(callback) {
    callback("one")
  }, function ok() {
    done()
  },
  {birdie: "toot toot!"}
)

jobPool.requestWork(
  function (task) {
    expect(task.options.birdie).to.equal("toot toot!")
    task.callback()
  }
)
```
