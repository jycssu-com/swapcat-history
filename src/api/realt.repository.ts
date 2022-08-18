import axios from 'axios'

const repository = axios.create({ baseURL: 'https://portfolio.realt-dashboard.co' })

export interface RealToken {
  token: {
    id: string;
    from: string;
    uniswap: string;
    name: string;
    supply: number;
    value: number;
  };
  blockchainAddresses: {
    ethereum: {
      chainName: string;
      chainId: number;
      contract: string;
      distributor: string;
      maintenance: string;
    };
    xDai: {
      chainName: string;
      chainId: number;
      contract: string;
      distributor: string;
      rmmPoolAddress: string;
      chainlinkPriceContract: string;
    };
  };
  secondaryMarketplaces: {
    chainId: number;
    chainName: string;
    dexName: string;
    contractPool: string;
    pair?: {
      contract: string;
      symbol: string;
      name: string;
    };
  }[];
  return: {
    apr: string;
    perYear: number;
    perMonth: number;
    perDay: number;
  };
  property: {
    name: string;
    shortName: string;
    url: string;
    location: {
      lat: string;
      lng: string;
      city: string;
      state: string;
      country: string;
    };
    images: string[];
  };
}

export const RealtRepository = {
  async getTokens () {
    const response = await repository.get<RealToken[]>('/realt.min.json')
    return response.data
  },
}
