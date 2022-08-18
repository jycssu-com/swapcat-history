import { ref } from 'vue'
import { defineStore } from 'pinia'
import { RealToken, RealtRepository } from 'src/api/realt.repository'
import { SwapcatRepository } from 'src/api/swapcat.repository'
import _keyBy from 'lodash/keyBy'
import { SwapcatToken } from 'src/api/Swapcat/GetTokens'

export interface Token extends RealToken {
  swapcat: SwapcatToken;
}

export const useStore = defineStore('store', () => {
  let resolveInitialized: (value?: unknown) => void = () => undefined
  let rejectInitialized: (reason?: unknown) => void = () => undefined
  const waitInitialized = new Promise((resolve, reject) => {
    resolveInitialized = resolve
    rejectInitialized = reject
  })
  const tokenList = ref<Token[]>([])
  const loading = ref(false)

  async function fetchData () {
    const availableTokenList = (await RealtRepository.getTokens())
      .filter(token => token.blockchainAddresses.xDai.contract)

    const addresses = availableTokenList
      .map(token => token.blockchainAddresses.xDai.contract)

    const tokenPriceMap = _keyBy(await SwapcatRepository.getTokens({ addresses }), 'address')

    tokenList.value = availableTokenList.map(item => ({
      ...item,
      swapcat: tokenPriceMap[(item.blockchainAddresses.xDai.contract).toLowerCase()],
    }))
  }

  async function fetch () {
    loading.value = true
    try {
      await fetchData()
      resolveInitialized()
    } catch (error) {
      rejectInitialized(error)
    } finally {
      loading.value = false
    }
  }

  async function getToken (address: string) {
    await waitInitialized
    return tokenList.value.find(item =>
      address.toLowerCase() === item.blockchainAddresses.xDai.contract.toLowerCase())
  }

  // Initial fetch
  void fetch()

  return {
    loading,
    fetch,
    getToken,
    tokenList,
  }
})
