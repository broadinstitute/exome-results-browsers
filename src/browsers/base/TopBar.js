import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { withRouter } from 'react-router-dom'
import styled from 'styled-components'

import { Button, Modal } from '@gnomad/ui'

import Link from './Link'
import OtherStudies from './OtherStudies'
import Searchbox from './Searchbox'

const TitleWrapper = styled.div``

const ToggleMenuButton = styled(Button)``

const TopBarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
  margin-bottom: 20px;
  background-color: ${(props) => props.backgroundColor};

  @media (max-width: 900px) {
    flex-direction: column;
  }

  ${Link} {
    color: ${(props) => props.textColor};
    text-decoration: none;
  }

  ${TitleWrapper} {
    color: ${(props) => props.textColor};
    font-size: 1.5em;

    @media (max-width: 900px) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 0.5em;
    }
  }

  ${ToggleMenuButton} {
    border: 1px solid ${(props) => props.textColor};
    background: transparent;
    color: inherit;
    font-size: 1rem;

    @media (min-width: 900px) {
      display: none;
    }
  }
`

const Menu = styled.ul`
  display: flex;
  flex-direction: row;
  padding: 0;
  margin: 0;
  list-style-type: none;

  ${Link} {
    padding: 0.5em;
    font-size: 16px;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    width: 100%;
    height: ${(props) => (props.isExpanded ? 'auto' : 0)};

    ${Link} {
      display: inline-block;
      width: 100%;
      padding: 1em 0;
    }
  }
`

const TopBar = ({ title, links, backgroundColor, textColor }) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const closeMenu = () => {
    setIsMenuExpanded(false)
  }

  const [showOtherStudiesModal, setShowOtherStudiesModal] = useState(false)

  return (
    <TopBarWrapper backgroundColor={backgroundColor} textColor={textColor}>
      <TitleWrapper>
        <Link to="/" onClick={closeMenu}>
          {title}
        </Link>
        <ToggleMenuButton
          onClick={() => {
            setIsMenuExpanded(!isMenuExpanded)
          }}
        >
          ☰
        </ToggleMenuButton>
      </TitleWrapper>

      <Searchbox id="navbar-search" width="320px" />

      <Menu isExpanded={isMenuExpanded}>
        <li>
          <Link to="/results" onClick={closeMenu}>
            Results
          </Link>
        </li>
        {links.map(({ path, label }) => (
          <li key={path}>
            <Link to={path} onClick={closeMenu}>
              {label}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/downloads" onClick={closeMenu}>
            Downloads
          </Link>
        </li>
        <li>
          <Link
            to="/other-studies"
            onClick={(e) => {
              setShowOtherStudiesModal(true)
              closeMenu()
              e.preventDefault()
            }}
          >
            Other Studies
          </Link>
        </li>
      </Menu>

      {showOtherStudiesModal && (
        <Modal
          id="other-studies"
          size="large"
          title="Other Studies"
          onRequestClose={() => {
            setShowOtherStudiesModal(false)
          }}
        >
          <OtherStudies />
        </Modal>
      )}
    </TopBarWrapper>
  )
}

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
}

TopBar.defaultProps = {
  links: [],
  backgroundColor: '#000',
  textColor: '#fff',
}

export default withRouter(TopBar)
