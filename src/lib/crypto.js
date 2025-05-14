import { CoinbaseCommerce } from 'coinbase-commerce-node'
import { ethers } from 'ethers';

const client = CoinbaseCommerce.Client.init(process.env.COINBASE_COMMERCE_API_KEY)

export default client;