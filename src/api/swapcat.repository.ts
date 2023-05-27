import { GraphQLClient } from 'graphql-request'
import { getTokenTransactions } from './Swapcat/GetTokenTransactions'
import { getAddressPurchases } from './Swapcat/GetAddressPurchases'
import { getTokens } from './Swapcat/GetTokens'
import { getTransactions } from './Swapcat/GetTransactions'

const endpoint = 'https://api.thegraph.com/subgraphs/id/QmY5NtcpYe73dvrruRqDZphpyw2ZFu1BAx1tWuGsW3KbP4'
const client = new GraphQLClient(endpoint)

export const SwapcatRepository = {
  getTokenTransactions: getTokenTransactions(client),
  getAddressPurchases: getAddressPurchases(client),
  getTokens: getTokens(client),
  getTransactions: getTransactions(client),
}
