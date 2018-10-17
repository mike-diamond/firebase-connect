import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import {
  isLoaded,
  getFirebase,
  firebaseReducer,
  reactReduxFirebase,
} from 'react-redux-firebase'
import { watchEvents, unWatchEvents } from 'react-redux-firebase/lib/actions/query'
import { reduxFirestore, firestoreReducer } from 'redux-firestore'
import { getEventsFromInput, createCallable } from 'react-redux-firebase/lib/utils'


const fb = 'firebase'

const _getEventsFromInput = (data, type) => {
  const inputs = []

  if (!data) {
    return inputs
  }

  Object.keys(data).forEach((key) => {
    const { path, listeners } = data[key]

    listeners.forEach((listener) => {
      inputs.push({
        path,
        [type === fb ? 'path' : 'collection']: path,
        queryParams: listener,
      })
    })
  })

  return getEventsFromInput(inputs)
}

const getDisplayName = Component => (
  Component.displayName ||
  Component.name ||
  (typeof Component === 'string' ? Component : 'Component')
)


const _connect = (type) => (dataOrFn = {}, connect) => WrappedComponent => {
  const connectListeners = {}

  class FirebaseConnect extends PureComponent {
    firebaseEvents = []

    firebase = null

    prevData = null

    static contextTypes = {
      store: PropTypes.object.isRequired
    }

    static displayName       = `F${type.slice(1)}Connect(${getDisplayName(WrappedComponent)})`

    static wrappedComponent  = WrappedComponent

    constructor(props, context) {
      const { store } = context

      super()

      const inputAsFunc  = createCallable(dataOrFn)
      const prevData     = inputAsFunc(props, store)

      this.prevData      = prevData
      this.context       = context
      this.state         = this.getStateProps(prevData)
    }

    componentWillMount() {
      const { store } = this.context

      if (store[type]) {
        const { ref, helpers, storage, database, auth } = store[type]
        this.firebase = { ref, storage, database, auth, ...helpers }

        this.firebaseEvents = _getEventsFromInput(this.prevData, type)
      }
    }

    componentDidMount() {
      const { store } = this.context

      if (store[type]) {
        this.watchEvents(store[type], store.dispatch, this.firebaseEvents)
      }
    }

    componentWillUnmount() {
      const { store } = this.context

      this.unWatchEvents(store[type], store.dispatch, this.firebaseEvents)
    }

    watchEvents = (firebase, dispatch, events) => {
      if (type === fb) {
        watchEvents(firebase, dispatch, events)
      }
      else {
        firebase.setListeners(events)
      }
    }

    unWatchEvents = (firebase, dispatch, events) => {
      if (type === fb) {
        unWatchEvents(firebase, dispatch, events)
      }
      else {
        firebase.unsetListeners(events)
      }
    }

    componentWillReceiveProps(props) {
      const { store } = this.context

      const inputAsFunc  = createCallable(dataOrFn)
      const data         = inputAsFunc(props, store)

      const { addedEvents, removedEvents } = this.getUpdatedEvents(data)

      const stateProps = this.getStateProps(data)

      if (addedEvents.length || removedEvents.length) {
        this.prevData = data

        this.unWatchEvents(store[type], store.dispatch, this.firebaseEvents)

        this.firebaseEvents = _getEventsFromInput(data, type)

        this.watchEvents(store[type], store.dispatch, this.firebaseEvents)
      }

      this.setState(stateProps)
    }

    getUpdatedEvents = (data) => {
      const newFirebaseEvents = _getEventsFromInput(data, type)
      const oldFirebaseEvents = this.firebaseEvents

      const addedEvents = []
      let removedEvents = oldFirebaseEvents

      newFirebaseEvents.forEach((newEvent) => {
        const { queryId: newQueryId } = newEvent

        const isEventExists = oldFirebaseEvents.some(({ queryId }) => queryId === newQueryId)

        if (isEventExists) {
          removedEvents = removedEvents.filter(({ queryId }) => queryId !== newQueryId)
        }
        else {
          addedEvents.push(newEvent)
        }
      })

      return {
        addedEvents,
        removedEvents,
      }
    }

    getStateProps = (_prevData) => {
      const { store: { getState } } = this.context

      const state       = getState()
      const stateProps  = {}
      const prevData    = _prevData || this.prevData

      Object.keys(prevData).forEach((propName) => {
        const { path, defaultValue } = prevData[propName]

        let resolvedPropValue       = state[type] && state[type].data && [ state[type].data ].concat(path.split('/')).reduce((a, b) => a && a[b])

        connectListeners[propName]  = (state) => state[type] && state[type].data && [ state[type].data ].concat(path.split('/')).reduce((a, b) => a && a[b])

        const loadedPropName        = `isLoaded${propName[0].toUpperCase()}${propName.substr(1)}`

        let isLoadedPropValue       = stateProps[loadedPropName] || isLoaded(resolvedPropValue)

        const oldStateProp          = this.state && this.state[path] && this.state[path].value
        const canMerge              = typeof oldStateProp === 'object' && typeof resolvedPropValue === 'object'

        if (defaultValue && !isLoadedPropValue) {
          resolvedPropValue         = typeof defaultValue === 'function'
            ? defaultValue(state)
            : typeof defaultValue === 'string' && /\./.test(defaultValue)
              ? [ state ].concat(defaultValue.split('.')).reduce((a, b) => a[b])
              : defaultValue

          isLoadedPropValue         = Boolean(resolvedPropValue)
        }

        stateProps.propsToPaths = {
          ...stateProps.propsToPaths,
          [propName]: path,
        }

        stateProps[path] = {
          isLoaded: isLoadedPropValue,
          value: canMerge
            ? {
              ...oldStateProp,
              ...resolvedPropValue,
            }
            : resolvedPropValue,
        }
      })

      return stateProps
    }

    render () {
      const { propsToPaths } = this.state

      const modifiedState = {}

      Object.keys(propsToPaths).forEach((prop) => {
        const state                    = this.state
        const path                     = propsToPaths[prop]
        const modifyResult             = this.prevData[prop] && this.prevData[prop].modifyResult
        const loadedPropName           = `isLoaded${prop[0].toUpperCase()}${prop.substr(1)}`

        modifiedState[loadedPropName]  = state[path].isLoaded
        modifiedState[prop]            = typeof modifyResult === 'function'
          ? modifyResult(state[path].value)
          : state[path].value
      })

      return (
        <WrappedComponent
          {...this.props}
          {...modifiedState}
        />
      )
    }
  }

  const component = hoistStatics(FirebaseConnect, WrappedComponent)

  if (!connect) {
    return component
  }

  return connect(connectListeners)(component)
}

const firebaseConnect   = _connect(fb)
const firestoreConnect  = _connect('firestore')
const reduxFirebase     = reactReduxFirebase

export {
  getFirebase,
  firebaseConnect,
  firestoreConnect,

  reduxFirestore,
  firestoreReducer,

  reactReduxFirebase,
  reduxFirebase,
  firebaseReducer,
}
