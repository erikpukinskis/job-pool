var test = require("nrtv-test")(require)

test.using(
  "adding tasks while multiple minions do work",
  ["./"],
  function(expect, done, Dispatcher) {

    var dispatcher = new Dispatcher()

    var results = []

    dispatcher.addTask(function(callback) {
      callback("one")
    }, function ok(message) {
      results[1] = message
    })

    var dougie = dispatcher.requestWork(
      function doug(task) {
        task.func(function(message) {
          task.callback(message+" (via Doug)")
        })
      }
    )

    expect(results[1]).to.equal("one (via Doug)")
    done.ish("Doug got the first job")

    var barb = dispatcher.requestWork(
      function barbara(task) {
        task.func(function(message) {
          task.callback(message+" (via Barbara)")
        })
      }
    )

    dispatcher.addTask(function(callback) {
      callback("two")
    }, function two(message) {
      results[2] = message
    })

    expect(results[2]).to.equal("two (via Doug)")
    done.ish("Doug got the next job too, since he finished his work before Barbara joined")

    var j = dispatcher.requestWork(
      function janet(task) {
        task.func(function(message) {
          task.callback(message+" (via Janet)")
        })
      }
    )

    dispatcher.addTask(function(callback) {
      callback("three")
    }, function three(message) {
      results[3] = message
    })

    expect(results[3]).to.equal("three (via Barbara)")
    done.ish("Barb got the third one")

    dougie.quit()

    dispatcher.addTask(function(callback) {
      callback("four")
    }, function four(message) {
      results[4] = message
    })

    expect(results[4]).to.equal("four (via Janet)")
    done.ish("Dougie got skipped cuz he quit")

    barb.quit()
    j.quit()

    dispatcher.addTask(function(callback) {
      callback("five")
    }, function five(message) {
      results[5] = message
    })

    expect(results[5]).to.be.undefined

    done.ish("world doesn't explode if the worker dispatcher dries up")

    done()
  }
)

test.using(
  "pass args on",
  ["./"],
  function(expect, done, dispatcher) {

    dispatcher.addTask(
      function takeCredit(callback, who) {
        callback(who+" did this.")
      },
      ["Brett"],
      function(message) {
        expect(message).to.equal(
          "Brett did this.")
        done()
      }
    )

    dispatcher.requestWork(
      function worker(task) {
        if (task.args[0] != "Brett") {
          throw new Error("Who are you and what have you done with Brett!")
        }

        task.func.apply(null, [task.callback].concat(task.args))
      }
    )
  }
)
