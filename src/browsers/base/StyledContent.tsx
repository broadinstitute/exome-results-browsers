import styled from 'styled-components'

const StyledContent = styled.div`
  h1,
  h2,
  h3 {
    font-weight: bold;
  }

  h1 {
    font-size: 28px;
  }

  h2 {
    font-size: 20px;
  }

  h3 {
    font-size: 18px;
  }

  p {
    margin-top: 15px;
    margin-bottom: 15px;
    line-height: 150%;
  }

  a {
    color: #428bca;
    text-decoration: none;
  }

  img {
    max-width: 100%;
  }

  figure {
    max-width: 100%;
    margin: 1.5em auto;
    text-align: center;
  }

  figure img {
    display: block;
    width: 100%;
    margin: 0 auto;
  }

  figcaption {
    margin-top: 0.75em;
    font-size: 14px;
    line-height: 150%;
    text-align: center;
  }

  figcaption p {
    margin: 0;
  }

  figcaption p + p {
    margin-top: 0.5em;
  }

  blockquote {
    margin: 0 0 0 10px;
    font-size: 14px;
    font-style: italic;
    line-height: 150%;
  }

  ul {
    padding-left: 20px;
    margin: 1em 0 0;
  }

  li {
    margin-bottom: 0.5em;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  td {
    padding: 0.5em 10px 0.5em 0;
    border-bottom: 1px solid #ccc;
    font-weight: normal;
    text-align: left;
  }

  th {
    padding: 0.5em 10px 0.5em 0;
    border-bottom: 1px solid #000;
    background-position: center right;
    background-repeat: no-repeat;
    font-weight: bold;
  }
`

export default StyledContent
