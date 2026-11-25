# fastify-multichain-address

Fastify plugin (`fastify >= 4.x / 5.x`) and `preValidation` hook decorator for validating multi-chain cryptocurrency wallet address syntax, cryptographic checksums, mandatory custodial **Memo / Destination Tag** routing identifiers, and prefix/suffix **vanity address-poisoning lookalike detection** across 46+ blockchain networks.

Built and maintained by the security engineering team behind the [AllSwap Multi-Chain Address & Memo Validator](https://allswap.io/tools/address-validator) and the [AllSwap Non-Custodial Cross-Chain Swap & Bridge Aggregator](https://allswap.io/).

## Features

- **Fastify Instance Decorators**: Decorates Fastify with `fastify.validateCryptoAddress()`, `fastify.detectAddressPoisoning()`, and a ready-to-use route `preValidation` hook.
- **Multi-Chain Address Syntax & Checksum Validation**: Validates EVM (`0x...`), Bitcoin (Legacy, SegWit, Taproot Bech32m), Solana (Ed25519 Base58), XRP Ledger, Stellar (StrKey), Cosmos Hub (Bech32), TON, TRON, Sui, Aptos, Hedera, and EOSIO wallet addresses.
- **Mandatory Memo / Destination Tag Enforcement**: Prevents accidental custodial deposit loss by enforcing required Destination Tags (`XRP`), Memos (`XLM`, `ATOM`, `HBAR`, `EOS`), and Comments (`TON`).
- **Vanity Address-Poisoning Defense**: Detects lookalike addresses that copy the first 5 and last 4 characters of a trusted reference address while differing in the middle bytes.

## Installation

```bash
npm install fastify-multichain-address
```

## Quick Start with Fastify

```javascript
const fastify = require('fastify')({ logger: true })
const fastifyMultichainAddress = require('fastify-multichain-address')

fastify.register(fastifyMultichainAddress)

fastify.post('/api/payout/validate', async (request, reply) => {
  const { chain, address, memo, trustedAddress } = request.body
  const result = fastify.validateCryptoAddress(chain, address, memo, trustedAddress)
  if (!result.valid) {
    return reply.code(400).send(result)
  }
  return { ok: true, verification: result }
})

fastify.listen({ port: 3000 })
```

## Documentation & Reference Links

- **Interactive Multi-Chain Address & Memo Validator**: [https://allswap.io/tools/address-validator](https://allswap.io/tools/address-validator)
- **AllSwap Cross-Chain Swap & Bridge Aggregator**: [https://allswap.io](https://allswap.io)
- **Technical Specification & Developer Docs**: [https://allswap.io/docs](https://allswap.io/docs)
- **Core CLI & Reproducible Test Suite (MIT)**: [https://github.com/zhangglnuo-art/multichain-memo-address-validator](https://github.com/zhangglnuo-art/multichain-memo-address-validator)

## License

MIT © [AllSwap Security Labs](https://allswap.io)
