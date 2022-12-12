import { GraphQLClient } from 'graphql-request'
import { getTokenTransactions } from './Swapcat/GetTokenTransactions'
import { getAddressPurchases } from './Swapcat/GetAddressPurchases'
import { getTokens } from './Swapcat/GetTokens'

const endpoint = 'https://api.thegraph.com/subgraphs/name/jycssu-com/swapcat'
const client = new GraphQLClient(endpoint)

export const SwapcatRepository = {
  getTokenTransactions: getTokenTransactions(client),
  getAddressPurchases: getAddressPurchases(client),
  getTokens: getTokens(client),
}
