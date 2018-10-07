# firebase-connect
HOC for connecting to firebase realtime database.
Based on [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase) to improve connection to firebase.

[![Npm Version](https://badge.fury.io/js/firebase-connect.svg)](https://www.npmjs.com/package/firebase-connect)
[![Month Downloads](https://img.shields.io/npm/dm/firebase-connect.svg)](http://npm-stat.com/charts.html?package=firebase-connect)
[![Npm Licence](https://img.shields.io/npm/l/firebase-connect.svg)](https://www.npmjs.com/package/firebase-connect)

### How firebase-connect improves react-redux-firebase
- It stores received data for each `path` from realtime database 
as long as the component with this HOC is mounted
- It merges data of any number of listeners that you'll define
- It creates property `${propName}` with received data and boolean property `is${PropName}Loaded` that helps to define
was the data loaded or not
- You can set default value, that can be taken from your store or defined manually
- You can modify received data


### Usage
```jsx
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import connect from 'react-redux'
import { firebaseConnect } from 'firebase-connect'


@connect({
  endAt: (state) => state.activeChat.endAt,
})
@firebaseConnect((props) => ({
  chatMessages: {
    // path to listen in firebase realtime database
    path: `chatMessages/${props.activeChat}`,
    listeners: Boolean(props.endAt) ? [
      // get 25 messages where property 'added' >= props.endAt
      // props.endAt is used to load older messages if user scroll up to load more
      [
        'orderByChild=added',
        `endAt=${props.endAt}`,
        'limitToLast=25',
      ],
      // listen to newest messages
      [
        'orderByChild=added',
        'limitToLast=5',
      ],
    ] : [
      // load last 25 messages if there is no props.endAt
      [
        'orderByChild=added',
        'limitToLast=25',
      ]
    ],
    // Get default value from preloaded store (on SSR) or set it manually
    // It also can be used as a function: (state) => state.preload.chats || [],
    defaultValue: `preload.chatMessages.${props.activeChat}`,
    // Modify output result
    modifyResult: (chatMessages = {}) =>
      Object.keys(chatMessages)
        .filter((key) => chatMessages[key])
        .map((key) => ({ id: key, ...chatMessages[key] }))
        // Object from database is not sorted, so you need to sort it manually
        .sort((a, b) => b.added - a.added),
  },
  // Load some other data if needed
  chats: {
    path: 'chats',
    listeners: [
      [ 'orderByChild=added' ],
    ],
    defaultValue: 'preload.chats',
    modifyResult: (chats = {}) => Object.keys(chats)
      .map((key) => ({ id: key, ...chats[key] }))
      .map((chat) => ({
        ...chat,
        isActive: props.activeChat === chat.title,
        users: Object.keys(chat.users).map((key) => chat.users[key]),
      })),
  },
  // pass connect as second parameter to rerender component when data is received
}), connect)
export default class Chat extends PureComponent {

  static propTypes = {
    chats: PropTypes.array,
    chatMessages: PropTypes.array,
    // The properties below is added automatically and helps to understend
    // is data loading or already was loaded
    isChatsLoaded: PropTypes.bool,
    isChatMessagesLoaded: PropTypes.bool,
  }

  render() {
    const { chats, chatMessages, isChatsLoaded, isChatMessagesLoaded } = this.props
    
    const isChatsAndMessagesLoaded = isChatsLoaded && isChatMessagesLoaded

    return isChatsAndMessagesLoaded ? (
      <div>
        <div>
          <div>Chats:</div>
          <div>
            {
              chats.map(({ id, title }) => (
                <div key={id}>
                  Chat title: {title}
                </div>
              ))
            }
          </div>
          <div>Active chat messages:</div>
          <div>
            {
              chatMessages.map(({ id, author, message }) => (
                <div key={id}>
                  <div>{author}:</div>
                  <div>{message}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    ) : (
      <div>Data is loading...</div>
    )
  }
}
```

Same as using react-redux-firebase you need to include `reactReduxFirebase` (store enhancer) and `firebaseReducer`
(reducer) while creating your redux store:

```jsx
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, combineReducers, compose } from 'redux'
import { reactReduxFirebase, firebaseReducer } from 'firebase-connect'
import firebase from 'firebase'
// import { reduxFirestore, firestoreReducer } from 'redux-firestore' // <- needed if using firestore
// import 'firebase/firestore' // <- needed if using firestore
// import 'firebase/functions' // <- needed if using httpsCallable
// Get firebase config (includes apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId)
import firebaseConfig from 'firebase-config.json'

// Initialize firebase instance
firebase.initializeApp(firebaseConfig)

// Initialize other services on firebase instance
// firebase.firestore() // <- needed if using firestore
// firebase.functions() // <- needed if using httpsCallable

// Add reactReduxFirebase enhancer when making store creator
const createStoreWithFirebase = compose(
  reactReduxFirebase(firebase, {
    userProfile: 'users',
    // useFirestoreForProfile: true // Firestore for Profile instead of Realtime DB
  }),
  // reduxFirestore(firebase) // <- needed if using firestore
)(createStore)

// Add firebase to reducers
const rootReducer = combineReducers({
  firebase: firebaseReducer,
  // firestore: firestoreReducer // <- needed if using firestore
})

// Create store with reducers and initial state
const initialState = {}
const store = createStoreWithFirebase(rootReducer, initialState)

// Setup react-redux so that connect HOC can be used
const App = () => (
  <Provider store={store}>
    <Todos />
  </Provider>
);

render(<App/>, document.getElementById('root'));
```

The Firebase instance can be grabbed using `getFirebase` function
(for example in actions or somewhere you can't apply the HOC)

```jsx
import { getFirebase } from 'firebase-connect'


const push = ({ message }) =>
  getFirebase().push('chatMessages/activeChat', {
    added: Date.now(),
    message,
  })
  
  
export default {
  push,
}
```
