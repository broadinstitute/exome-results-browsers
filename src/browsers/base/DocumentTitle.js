import PropTypes from 'prop-types'
import { useEffect } from 'react'

const DocumentTitle = ({ title }) => {
  useEffect(() => {
    document.title = title
  }, [title])
  return null
}

DocumentTitle.propTypes = {
  title: PropTypes.string,
}

DocumentTitle.defaultProps = {
  title: null,
}

export default DocumentTitle
