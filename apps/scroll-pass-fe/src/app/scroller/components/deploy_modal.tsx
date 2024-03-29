'use client'

import { useEffect, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { useForm } from 'react-hook-form'
import { match } from 'ts-pattern'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import ScrollerConfig from './scroller_config'
// import ScrollerPreview from './scroller_preview'
import ScrollerConfirm from './scroller_confirm'
import ScrollerSuccess from './scroller_success'

import { SCROLLER_USER_CONFIG_SCHEMA } from '@/types/schema'

type ConfigForm = z.infer<typeof SCROLLER_USER_CONFIG_SCHEMA>

const defaultValues = {
  depositAmount: '0.000',
  mintAmount: 1,
  gasTolerance: 1,
  email: '',
}

const DeployModal = ({ isOpen, onOpenChange, onClose }: ReturnType<typeof useDisclosure>) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(4)

  const form = useForm<ConfigForm>({
    defaultValues,
    resolver: zodResolver(SCROLLER_USER_CONFIG_SCHEMA),
  })

  useEffect(() => {
    setStep(1)

    if (isOpen) {
      form.reset(defaultValues)
    }
  }, [isOpen])

  return (
    <Modal
      hideCloseButton={step === 3}
      isDismissable={step !== 3}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
    >
      <ModalContent>
        {() =>
          isOpen && (
            <>
              <ModalHeader className="justify-center text-2xl pt-8 bg-[#F7F7F7]">
                {match(step)
                  .with(1, () => 'Configure your Scroll Pass')
                  .with(2, () => '') // TODO: REMOVE
                  .with(3, () => 'Review your Scroll Pass')
                  .with(4, () => null)
                  .exhaustive()}
              </ModalHeader>
              <ModalBody className="px-8 pb-8 bg-[#F7F7F7]">
                {match(step)
                  .with(1, () => (
                    <ScrollerConfig
                      {...form}
                      setStep={setStep}
                    />
                  ))
                  .with(2, () => (
                    // <ScrollerPreview
                    //   {...form}
                    //   setStep={setStep}
                    // />
                    <></>
                  ))
                  .with(3, () => (
                    <ScrollerConfirm
                      {...form}
                      setStep={setStep}
                    />
                  ))
                  .with(4, () => (
                    <ScrollerSuccess
                      {...form}
                      onClose={onClose}
                    />
                  ))
                  .exhaustive()}
              </ModalBody>
            </>
          )
        }
      </ModalContent>
    </Modal>
  )
}

export default DeployModal
