module.exports = initAuth
var jsMatch = require('js-matcher')
  , mapMatch = jsMatch.mapMatch
  , rest = jsMatch.rest

function initAuth(app, sessionStore, patterns) {
  function getSession(agent, fn) {
    // Hack till I figure out how to do the API authentication properly.
    if (agent.headers['user-agent'] === 'node.js') return fn(null, { username: 'NodeJSUser' })
    var cookie = parseCookie(agent.headers.cookie)
    sessionStore.get(cookie['connect.sid'], fn)
  }

  function withSnapshot(fn) {
    return function (agent, action, session) {
      app.model.getSnapshot(action.docName, function (err, doc) {
        if (err) {
          console.warn('error getting snapshot', err)
          return action.accept()
        }
        fn(agent, action, session, doc)
      })
    }
  }

  var actions =
      { create: create
      , read: withSnapshot(read)
      , update: withSnapshot(update)
      , delete: withSnapshot(del)
      }

  function auth(agent, action) {
    getSession(agent, function (err, session) {
      if (actions[action.type]) {
        return actions[action.type](agent, action, session)
      }
      else {
        console.warn('unhandled action type. Apply default.', action.name)
        return action.accept()
      }
    })
  }

  function create(agent, action, session) {
    // Accept all for now.  In the future may need to check to see if they have cred.
    var obj = { s: session }
    if (!mapMatch(patterns.create || [], obj, true)) {
      return action.accept()
    }
    else action.reject()
  }

  function read(agent, action, session, doc) {
    var obj = { d: doc.snapshot, s: session }
    if (!mapMatch(patterns.read || [], obj, true)) {
      return action.reject()
    }
    action.accept() //check permissions
  }

  function update(agent, action, session, doc) {
    var i = 0, len = action.op.length, op
      , obj
    for (; i < len; i++) {
      obj = { op: action.op[i], d: doc.snapshot, s: session }
      if (!mapMatch(patterns.update || [], obj, true)) {
        return action.reject()
      }
    }
    action.accept()
  }

  function del(agent, action, session, doc) {
    var obj = { d: doc.snapshot, s: session }
    if (!mapMatch(patterns.delete || [], obj, false)) {
      return action.reject()
    }
    action.accept() //check permissions
  }

  return auth

}
