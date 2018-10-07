import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash/isEqual'
import hoistStatics from 'hoist-non-react-statics'
import { dataToJS, isLoaded, reactReduxFirebase, firebaseStateReducer, getFirebase } from 'react-redux-firebase'
import { watchEvents, unWatchEvents } from 'react-redux-firebase/lib/actions/query'
import { getEventsFromInput, createCallable } from 'react-redux-firebase/lib/utils'


const _getEventsFromInput = (data) => {
  const inputs = []

  if (!data) {
    return inputs
  }

  Object.keys(data).forEach((key) => {
    const { path, listeners } = data[key]

    listeners.forEach((listener) => {
      inputs.push({
        path,
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


const firebaseConnect = (dataOrFn = {}, connect) => WrappedComponent => {
  const connectListeners = {}

  class FirebaseConnect extends Component {
    firebaseEvents = []

    firebase = null

    prevData = null

    static contextTypes = {
      store: PropTypes.object.isRequired
    }

    static displayName       = `FirebaseConnect(${getDisplayName(WrappedComponent)})`

    static wrappedComponent  = WrappedComponent

    constructor(props, context) {
      const { store: { firebase } } = context

      super()

      const inputAsFunc  = createCallable(dataOrFn)
      const prevData     = inputAsFunc(props, firebase)

      this.prevData      = prevData
      this.context       = context
      this.state         = this.getStateProps(prevData)
    }

    componentWillMount() {
      const { store: { firebase } } = this.context

      if (firebase) {
        const { ref, helpers, storage, database, auth } = firebase
        this.firebase = { ref, storage, database, auth, ...helpers }

        this.firebaseEvents = _getEventsFromInput(this.prevData)
      }
    }

    componentDidMount() {
      const { store: { firebase, dispatch } } = this.context

      if (firebase) {
        watchEvents(firebase, dispatch, this.firebaseEvents)
      }
    }

    componentWillUnmount() {
      const { store: { firebase, dispatch } } = this.context

      unWatchEvents(firebase, dispatch, this.firebaseEvents)
    }

    componentWillReceiveProps(props) {
      const { store: { firebase, dispatch } } = this.context

      const inputAsFunc  = createCallable(dataOrFn)
      const data         = inputAsFunc(props, firebase)

      const { addedEvents, removedEvents } = this.getUpdatedEvents(data)

      const stateProps = this.getStateProps(data)

      if (addedEvents.length || removedEvents.length) {
        this.prevData = data

        unWatchEvents(firebase, dispatch, this.firebaseEvents)

        this.firebaseEvents = _getEventsFromInput(data)

        watchEvents(firebase, dispatch, this.firebaseEvents)
      }

      if (!isEqual(stateProps, this.state)) {
        this.setState(stateProps)
      }
    }

    getUpdatedEvents = (data) => {
      const newFirebaseEvents = _getEventsFromInput(data)
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

        let resolvedPropValue       = dataToJS(state.firebase, path)
        connectListeners[propName]  = (state) => dataToJS(state.firebase, path)

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


export {
  getFirebase,
  firebaseConnect,
  reactReduxFirebase,
  firebaseStateReducer,
}
