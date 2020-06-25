import QuestionMark from '@fortawesome/fontawesome-free/svgs/solid/question-circle.svg'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import styled from 'styled-components'

import { Modal } from '@gnomad/ui'

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  outline: none;
  padding: 0 3px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: inherit;

  svg {
    position: relative;
    top: 0.11em;
    width: 0.9em;
    height: 0.9em;
    border-radius: 0.45em;
  }

  &:focus svg {
    box-shadow: 0 0 0 0.2em rgba(70, 130, 180, 0.5);
  }
`

const HelpModalContent = styled.div`
  p {
    margin: 0 0 1em;
    line-height: 1.5;
  }
`

const HelpButton = ({ popupContent, popupTitle }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span>
      <Button
        type="button"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        <QuestionMark />
      </Button>
      {isOpen && (
        <Modal
          onRequestClose={() => {
            setIsOpen(false)
          }}
          size="large"
          title={popupTitle}
        >
          <HelpModalContent>{popupContent}</HelpModalContent>
        </Modal>
      )}{' '}
    </span>
  )
}

HelpButton.propTypes = {
  popupContent: PropTypes.node.isRequired,
  popupTitle: PropTypes.string.isRequired,
}

export default HelpButton
