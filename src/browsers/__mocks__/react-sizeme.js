const React = require('react')

const FIXED_SIZE = { width: 800, height: 600 }

// Stub sizeme to return a fixed size, allowing a track to
//     render in an isolated test
const SizeMe = ({ children }) => {
  const [size, setSize] = React.useState(null)

  React.useEffect(() => {
    setSize(FIXED_SIZE)
  }, [])

  if (!size) {
    return React.createElement('div')
  }

  return children({ size })
}

const withSize = () => (Component) => (props) =>
  React.createElement(Component, { ...props, size: FIXED_SIZE })

module.exports = { SizeMe, withSize }
