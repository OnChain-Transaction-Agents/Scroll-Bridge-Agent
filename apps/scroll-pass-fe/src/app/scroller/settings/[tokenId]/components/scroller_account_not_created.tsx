// 'use client'

// import { Button, useDisclosure } from '@nextui-org/react'
// import { useAddress } from '@thirdweb-dev/react'
// import { toast } from 'react-toastify'

// import PlanModal, { type PlanForm } from './plan_modal'
// import RobotSuccess from 'public/beep/robot-success.svg'

// const ScrollerAccountNotCreated = ({ refetch, tbaAddress }: { refetch: () => Promise<unknown>; tbaAddress: string }) => {
//   const address = useAddress()

//   const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

//   // const onSubmit = async ({ depositAmount, gasTolerance, mintAmount }: PlanForm) => {
//   // const res = await fetch(`/api/beep/profile/${tbaAddress}`, {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({
//   //     ownerAddress: address,
//   //     depositAmount,
//   //     gasTolerance,
//   //     mintAmount,
//   //   }),
//   // })

//   // if (!res.ok) {
//   //   toast.error(res.statusText || 'Failed to create plan')
//   //   return
//   // }

//   //   toast.success('Investment plan created')
//   //   await refetch()
//   //   onClose()
//   // }

//   return (
//     <div className="min-h-[240px] flex flex-col justify-center items-center gap-4 bg-[#131313] rounded-[10px]">
//       {/* <PlanModal
//         isOpen={isOpen}
//         onOpenChange={onOpenChange}
//         // onSubmit={onSubmit}
//         // depositAmount={'0.125'}
//         // mintAmount={1}
//         gasTolerance={2}
//       /> */}
//       <div className="h-16 flex justify-center">
//         <RobotSuccess />
//       </div>
//       <div className="text-lg tracking-wider">Your Scroll Pass does not have any plan yet</div>
//       <Button
//         className="px-8 font-bold text-black bg-white rounded-full tracking-wider"
//         onClick={onOpen}
//       >
//         Create a plan now
//       </Button>
//     </div>
//   )
// }

// export default ScrollerAccountNotCreated
