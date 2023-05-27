import { ref, computed } from 'vue'
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
  const realTokenList = ref<RealToken[]>([])
  const tokenList = ref<Token[]>([])
  const loading = ref(false)

  async function fetchData () {
    realTokenList.value = (await RealtRepository.getTokens())
      .filter(token => token.blockchainAddresses.xDai.contract)

    const addresses = realTokenList.value
      .map(token => token.blockchainAddresses.xDai.contract)

    const tokenPriceMap = _keyBy(await SwapcatRepository.getTokens({ addresses }), 'address')

    tokenList.value = realTokenList.value.map(item => ({
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

  const realTokenAddresses = computed(() => realTokenList.value
    .map(token => token.blockchainAddresses.xDai.contract))

  // Initial fetch
  void fetch()

  return {
    loading,
    fetch,
    getToken,
    tokenList,
    realTokenList,
    waitInitialized,
    realTokenAddresses,
  }
})
