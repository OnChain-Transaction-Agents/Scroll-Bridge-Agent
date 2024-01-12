import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scroll Pass - Home',
}

const Home = () => {
  redirect('/scroller')
}

export default Home
