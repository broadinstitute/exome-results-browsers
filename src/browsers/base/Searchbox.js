import React from 'react'
import { withRouter } from 'react-router-dom'

import { Searchbox } from '@gnomad/ui'

const fetchSearchResults = (query) =>
  fetch(`/api/search?q=${query}`)
    .then((response) => {
      const isOk = response.ok
      return response.json().then((data) => {
        if (!isOk) {
          throw new Error(data.error || 'Search failed')
        }
        return data
      })
    })
    .then((data) => data.results.map(({ label, url }) => ({ label, value: url })))

export default withRouter((props) => {
  const { history, location, match, ...rest } = props
  return (
    <Searchbox
      // Clear input when URL changes
      key={history.location.pathname}
      {...rest}
      fetchSearchResults={fetchSearchResults}
      onSelect={(url) => {
        history.push({ pathname: url })
      }}
      placeholder="Search results by gene"
    />
  )
})
