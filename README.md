Share Auth
==========

Share auth is a pattern matching based share auth.
Share auth grabs the session of a user who issues requests, the snapshot of the current doc if available and in the case of update also the operation to be performed.
It puts all of the relevant pieces into the same object then matches against the supplied patterns.

Share auth allow the ability to check against contents of a document, and the current users session to decide if actions should be accepted or rejected.
A developer can tap into the existing web infrastructure by leveraging the same session store to make decisions.

## Install

```bash
npm install share-auth
```

## Useage

Below is an example express server that uses ShareJS hooking in the share-auth module.

```javascript
var express = require('express')
  , app = express.createServer()
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore
  , sharejs = require('share')
  , shareAuth = require('share-auth')
  , patterns =
    { create:
      [ [{ s: { credentials: { create: true } }}, true ]
      , [{ s: {} }, false]]
    , read: [[{}, true]]
    , update: [[{}, true]]
    , delete: [[{}, false]]
    }
  , shareOpts = {
      auth: require('./shareauth')(app, sessionStore, patterns)
    }


sharejs.server.attach(app, shareOpts)
app.listen(3000)
```

## API

The module returns a single function. That requires the following:

1. (*server*) - The server that sharejs will be attached to.
1. (*sessionStore*) - The session store that meets uses the connect style session store api.
1. (*patterns*) - An object that contains a list of patterns.

Only the [create, read, update, delete] keys are used and each of these values should have a list of patterns.  See mapMatch in the [js-match](https://github.com/CrypticSwarm/js-matcher). Matches should return `true` to accept the action and `false` to reject the action.

* *create* - Matches against { s: *session object from who the request came from* } defaults to accept.
* *read* - Matches against { s: *session*, d: *document snapshot* } defaults to accept.
* *update* - Matches against { s: *session*, d: *document snapshot*, op: *operation to be performed* defaults to accept.
* *delete* - Matches against { s: *session*, d: *document snapshot* } defaults to reject.

### Returns

The module returns a function that is used for the auth field of the options to the `sharejs.server.attach` function.
This function also has an event emitter called emitter.
It emits the create, read, update, delete events when a action is accepted by the auth.
This allows the abilty to extend the functionality of the server.

```javascript
var auth = require('./shareauth')(app, sessionStore, patterns)
auth.emitter.on('create', function (action, session) {
  //do something when a document has been created. 
})
sharejs.server.attach(app, { auth: auth })
```
