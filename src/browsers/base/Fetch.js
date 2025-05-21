import PropTypes from 'prop-types'
import { Component } from 'react'
import { addAuthHeader } from './auth'

const cancelable = (promise) => {
  let isCanceled = false
  const wrapper = new Promise((resolve, reject) => {
    promise.then(
      (value) => {
        if (!isCanceled) {
          resolve(value)
        }
      },
      (error) => {
        if (!isCanceled) {
          reject(error)
        }
      }
    )
  })

  return {
    cancel: () => {
      isCanceled = true
    },
    promise: wrapper,
  }
}

const fetchApi = (path) => {
  const options = addAuthHeader({
    method: 'GET',
  })
  return fetch(`/api${path}`, options).then((response) => {
    const isOk = response.ok
    return response.json().then(
      (data) => {
        if (!isOk) {
          throw new Error(data.error || 'Unable to load data')
        }
        return data
      },
      () => {
        throw new Error('Unable to parse response')
      }
    )
  })
}

class Fetch extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: null,
      error: null,
      loading: true,
    }
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props
    if (path !== prevProps.path) {
      this.loadData()
    }
  }

  componentWillUnmount() {
    if (this.currentRequest) {
      this.currentRequest.cancel()
    }
  }

  loadData() {
    const { path } = this.props

    this.setState({
      loading: true,
      error: null,
    })

    if (this.currentRequest) {
      this.currentRequest.cancel()
    }

    this.currentRequest = cancelable(fetchApi(path))
    this.currentRequest.promise.then(
      (data) => {
        this.setState({
          data,
          error: null,
          loading: false,
        })
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error(error)

        this.setState({
          data: null,
          error,
          loading: false,
        })
      }
    )
  }

  render() {
    const { children } = this.props
    return children(this.state)
  }
}

Fetch.propTypes = {
  children: PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
}

export default Fetch
