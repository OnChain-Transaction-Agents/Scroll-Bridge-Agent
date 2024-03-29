'use client'

import { useEffect } from 'react'
import { useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, Button, Input, Spinner } from '@nextui-org/react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { ThirdwebSDK, useSigner } from '@thirdweb-dev/react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'

import CopyButton from '@/components/copy_button'

import { maskAddress } from '@/utils/address'

import type { TbaUser, ThirdWebError } from '@/types'

import { env } from 'env.mjs'

const schema = z.object({
  amount: z.string(),
})

type DepositForm = z.infer<typeof schema>

const defaultValues: DepositForm = {
  amount: '',
}

const DepositButton = ({ tba, isLoading, onOpenChange }: { tba: TbaUser; isLoading: boolean; onOpenChange: (isOpen: boolean) => void }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const signer = useSigner()

  useEffect(() => {
    onOpenChange(isOpen)
  }, [isOpen, onOpenChange])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = useForm<DepositForm>({
    defaultValues,
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ amount }: DepositForm) => {
    if (+amount <= 0) {
      setError('amount', { type: 'custom', message: 'Invalid balance' })
      return
    }

    if (!signer) {
      toast.error('Signer not defined')
      return
    }

    try {
      const sdk = ThirdwebSDK.fromSigner(signer, env.NEXT_PUBLIC_CHAIN_ID_SCROLLER, {
        clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      })
      await sdk.wallet.transfer(tba.address, amount)

      toast.success(`Successfully deposited ${amount} ETH}`)

      onOpenChange(isOpen)
    } catch (error) {
      toast.error((error as ThirdWebError)?.reason || (error as Error)?.message || 'Failed to deposit')
    }
  }

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen])

  return (
    <>
      <Button
        className="w-[172px] px-8 bg-white font-bold text-xl text-black rounded-full tracking-wider transition-colors hover:bg-[#e1e1e1]"
        onPress={onOpen}
      >
        Deposit
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
      >
        <ModalContent className="bg-[#1b1b1b] text-white">
          {() => (
            <>
              <ModalHeader className="justify-center text-2xl">Deposit ETH to Scroll Pass</ModalHeader>
              <ModalBody className="px-8 pb-8 tracking-wider">
                <form
                  className="flex flex-col items-center gap-4"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div>Your Scroll Pass wallet address</div>
                    <CopyButton
                      className="px-4 py-1 bg-[#2B2B2B] rounded-full font-normal text-sm text-[#a6a9ae] tracking-wider hover:border-[#666666]"
                      copyText={tba.address}
                    >
                      {maskAddress(tba.address)}
                    </CopyButton>
                  </div>
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="text-center text-sm">
                      {isLoading ? (
                        <Spinner
                          color="default"
                          size="sm"
                        />
                      ) : (
                        `Balance: ${tba?.balance ?? 'n/a'} ETH`
                      )}
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <Controller
                      control={control}
                      name="amount"
                      render={({ field, fieldState }) => (
                        <Input
                          classNames={{
                            base: clsx('max-w-[320px] px-4 rounded-full border border-[#808080]', fieldState.error && 'border-red-500'),
                            label: clsx(
                              'font-normal text-white group-data-[has-value=true]:text-white',
                              fieldState.error && 'text-red-500 group-data-[has-value=true]:text-red-500'
                            ),
                            input: 'font-bold text-lg text-end group-data-[has-value=true]:text-white',
                            inputWrapper: '!bg-transparent',
                          }}
                          color={fieldState.error ? 'danger' : 'default'}
                          errorMessage={fieldState.error?.message}
                          label="amount"
                          onValueChange={value => {
                            if (/^(\d+(\.\d*)?|\.\d+)?$/.test(value)) {
                              field.onChange(value)
                              clearErrors('amount')
                            }
                          }}
                          value={String(field.value)}
                        />
                      )}
                    />
                  </div>
                  <Button
                    className="h-12 w-full max-w-[320px] mt-8 px-8 bg-white font-bold text-xl text-black rounded-full tracking-wider transition-colors hover:bg-[#e1e1e1]"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    type="submit"
                    onPress={() => {
                      onOpen()
                      onOpenChange(true)
                    }}
                  >
                    Deposit to Scroll Pass
                  </Button>
                </form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export default DepositButton
