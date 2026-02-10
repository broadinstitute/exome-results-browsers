import React, { useState } from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Modal } from '@gnomad/ui'

const HelpIcon = styled.span`
  width: 1em;
  height: 1em;
  border-radius: 0.5em;
  background: #424242;
  color: #fff;
  font-size: 0.75em;
  font-weight: bold;
  line-height: 1.1em;
  text-align: center;
`

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  outline: none;
  padding: 0 3px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: inherit;

  &:focus ${HelpIcon} {
    box-shadow: 0 0 0 0.2em rgba(70, 130, 180, 0.5);
  }
`

const HelpModalContent = styled.div`
  p {
    margin: 0 0 1em;
    line-height: 1.5;
  }
`

type HelpButtonProps = {
  popupTitle: string
  popupContent: React.ReactNode
}

const HelpButton = ({ popupTitle, popupContent }: HelpButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span>
      <Button
        type="button"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        <HelpIcon>&#8202;?</HelpIcon>
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

export default HelpButton
