import { Component } from 'react'
import { addAuthHeader } from './auth'

const cancelable = (promise: Promise<any>) => {
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

const fetchApi = (path: string) => {
  const options = addAuthHeader({
    method: 'GET',
    credentials: 'include',
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

// TODO: turn this into a union type of the possibly returned types
// e.g. variant data array, gene data, etc
type FetchData = any;

interface FetchState {
  data: FetchData | null;
  error: Error | null;
  loading: boolean;
}

type FetchProps = {
  children: (state: FetchState) => React.ReactNode,
  path: string,
}

class Fetch extends Component<FetchProps, FetchState> {
  private currentRequest: { promise: Promise<any>; cancel: () => void } | null = null;

  constructor(props: FetchProps) {
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

  componentDidUpdate(prevProps: FetchProps) {
    if (this.props.path !== prevProps.path) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    if (this.currentRequest) {
      this.currentRequest.cancel()
    }
  }

  loadData() {
    this.setState({
      loading: true,
      error: null,
    })

    if (this.currentRequest) {
      this.currentRequest.cancel()
    }

    this.currentRequest = cancelable(fetchApi(this.props.path))
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
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        })
      }
    )
  }

  render() {
    return this.props.children(this.state)
  }
}


export default Fetch
