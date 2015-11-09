var test = require("nrtv-test")(require)

// test.only("worker waits")

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
        expect(task.id).to.be.defined
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


test.using(
  "worker waits",
  ["../dispatcher"],
  function(expect, done, Dispatcher) {

    var dispatcher = new Dispatcher()

    var tweetyFrame = ["perch", "cage", "cat"]
    var tweetyLog = []

    var tweety = dispatcher.requestWork(
      function(task) {

        if (task.clean) {
          tweetyLog = []
        }

        tweetyLog.push(
          tweetyFrame[tweetyLog.length]
        )

        task.func({
          report: function(message) {
            task.callback(message+"tweety did it!")
          }
        })
      }
    )

    var sylvester = dispatcher
    .requestWork(function(task) {

      task.func({
        report: function(message) {
          task.callback(message+"meow")
        }
      })

    })

    var waiter = dispatcher.retainWorker()

    waiter.addTask(
      function(minion) {
        minion.report("just you wait..")
      }, function report(message, minion) {
        expect(message).to.equal("just you wait..tweety did it!")
        expect(tweetyLog).to.have.members(["perch"])
        done.ish("minion took first job")
        addAFreshJob()
      })

    function scheming(minion) {
      minion.report("fruitless scheming..")
    }

    function addAFreshJob() {
      dispatcher.addTask(
        scheming,
        function(message) {
          expect(message).to.equal("fruitless scheming..meow")
          done.ish("other minion took second job")
          addAnotherFreshJob()
        }
      )
    }

    function addAnotherFreshJob() {
      dispatcher.addTask(
        scheming,
        function(message) {
          expect(message).to.equal("fruitless scheming..meow")
          done.ish("first one still waiting")
          continueWithTweety()
        }
      )
    }

    function continueWithTweety() {
      waiter.addTask(
        function(minion) {
          minion.report()
        },
        function() {
          expect(tweetyLog).to.have.members(["perch", "cage"])
          done.ish("first minion continued with state preserved")
          oneMoreTweetyJob()
        }
      )
    }

    function oneMoreTweetyJob() {
      waiter.addTask(
        function(minion) {
          minion.report()
        },
        function() {
          expect(tweetyLog).to.have.members(["perch", "cage", "cat"])
          done.ish("minion is still waiting")
          releaseTweety()
        }
      )      
    }

    function releaseTweety() {
      sylvester.quit()
      waiter.resign()
      addAFreshTask()
    }

    function addAFreshTask() {
      dispatcher.addTask(
        function(minion) {
          minion.report("last free job..")
        },
        function(message) {
          expect(message).to.equal("last free job..tweety did it!")
          done.ish("released minion got the last job")
          expect(tweetyLog).to.deep.equal(["perch"])
          done.ish("state got reset")

          done()
        }
      )
    }

  }
)


test.using(
  "can add arbitrary keys to a task",
  ["./"],
  function(expect, done, Dispatcher) {

    var dispatcher = new Dispatcher()

    dispatcher.addTask(
      function(callback) {
        callback("one")
      }, function ok() {
        done()
      },
      {birdie: "toot toot!"}
    )

    dispatcher.requestWork(
      function (task) {
        expect(task.birdie).to.equal("toot toot!")
        task.callback()
      }
    )
  }
)

