import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { bsc, mainnet, bscTestnet } from 'viem/chains'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string

export const chains = [bsc, mainnet, bscTestnet] as const
export type ChainId = typeof chains[number]['id']
export const DEFAULT_CHAIN_ID: ChainId = bsc.id

export const wagmiConfig = defaultWagmiConfig({
  projectId,
  chains,
  metadata: {
    name: "Buycex Presale",
    description: "Buycex Token Presale Portal",
    url: "https://manage.iamdino.org",
    icons: ["https://your-icon-link.png"],
  },
})

/** 🔒 Hide Email/Social row ("Auth") in Web3Modal using inline CSS */
if (typeof document !== 'undefined') {
  const css = `
  .w3m-modal .w3m-route-connect-wallet .w3m-email,
  .w3m-modal .w3m-route-connect-wallet .w3m-socials,
  .w3m-modal .w3m-route-connect-wallet .w3m-divider {
    display: none !important;
  }`
  const style = document.createElement('style')
  style.setAttribute('data-w3m-auth-hide', '')
  style.appendChild(document.createTextNode(css))
  document.head.appendChild(style)
}

createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'dark'
})

export default wagmiConfig
