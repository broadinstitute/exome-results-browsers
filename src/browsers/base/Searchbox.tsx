import React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'

// @ts-expect-error: no types from @gnomad/ui in this version
import { Searchbox } from '@gnomad/ui'

const fetchSearchResults = (query: string) =>
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
    .then((data) =>
      data.results.map(({ label, url }: { label: string; url: string }) => ({ label, value: url }))
    )

interface SearchboxOwnProps {
  id: string,
  width: string,
}

type SearchboxProps = SearchboxOwnProps & RouteComponentProps

const BrowserSearchbox = (props: SearchboxProps) => {
  const { history, location, match, id, width, ...rest } = props
  return (
    <Searchbox
      // Clear input when URL changes
      key={history.location.pathname}
      {...rest}
      id={id}
      width={width}
      fetchSearchResults={fetchSearchResults}
      onSelect={(url: string) => {
        history.push({ pathname: url })
      }}
      placeholder="Search results by gene"
    />
  )
}

export default withRouter(BrowserSearchbox)
