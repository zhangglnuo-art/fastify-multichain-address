'use strict'

const fp = require('fastify-plugin')

const CHAIN_RULES = {
  EVM:  { name: 'Ethereum / Arbitrum / Base / Optimism / Polygon / BNB (EVM)', pattern: /^0x[a-fA-F0-9]{40}$/, requiresMemo: false, memoName: 'None' },
  BTC:  { name: 'Bitcoin (Legacy / SegWit / Taproot Bech32m)', pattern: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,87})$/, requiresMemo: false, memoName: 'None' },
  SOL:  { name: 'Solana (Ed25519 Base58)', pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, requiresMemo: false, memoName: 'SPL Memo (Optional)' },
  XRP:  { name: 'XRP Ledger (XRPL)', pattern: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, requiresMemo: true, memoName: 'Destination Tag (32-bit uint)', memoPattern: /^[0-9]{1,10}$/ },
  XLM:  { name: 'Stellar Lumens (StrKey)', pattern: /^G[A-Z2-7]{55}$/, requiresMemo: true, memoName: 'Stellar Memo (up to 28 bytes)', memoPattern: /^.{1,28}$/ },
  ATOM: { name: 'Cosmos Hub (Bech32)', pattern: /^cosmos1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/, requiresMemo: true, memoName: 'Cosmos Memo', memoPattern: /^.{1,256}$/ },
  TON:  { name: 'The Open Network (TON)', pattern: /^((EQ|UQ)[A-Za-z0-9_-]{46}|(0|-1):[a-fA-F0-9]{64})$/, requiresMemo: true, memoName: 'TON Comment / Memo Tag', memoPattern: /^.{1,120}$/ },
  TRX:  { name: 'TRON (TVM Base58Check)', pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, requiresMemo: false, memoName: 'None' },
  SUI:  { name: 'Sui Network', pattern: /^0x[a-fA-F0-9]{64}$/, requiresMemo: false, memoName: 'None' },
  APT:  { name: 'Aptos Network', pattern: /^0x[a-fA-F0-9]{1,64}$/, requiresMemo: false, memoName: 'None' },
  HBAR: { name: 'Hedera Hashgraph', pattern: /^0\.0\.[1-9][0-9]{0,9}$/, requiresMemo: true, memoName: 'Hedera Memo (up to 100 bytes)', memoPattern: /^.{1,100}$/ },
  EOS:  { name: 'EOSIO / Vaulta', pattern: /^[a-z1-5.]{1,12}$/, requiresMemo: true, memoName: 'EOS Memo', memoPattern: /^.{1,256}$/ }
}

function detectAddressPoisoning (candidate, trusted) {
  const a = String(candidate || '').trim()
  const b = String(trusted || '').trim()
  if (!a || !b || a.toLowerCase() === b.toLowerCase() || a.length < 12 || b.length < 12) return false
  return a.slice(0, 5).toLowerCase() === b.slice(0, 5).toLowerCase() && a.slice(-4).toLowerCase() === b.slice(-4).toLowerCase()
}

function validateCryptoAddress (chain, address, memo = '', trustedAddress = '') {
  const code = String(chain || '').trim().toUpperCase()
  const rule = CHAIN_RULES[code]
  if (!rule) {
    return { valid: false, code: 'UNSUPPORTED_CHAIN', chain: code, message: `Unsupported blockchain ticker: ${code}` }
  }
  const cleanAddr = String(address || '').trim()
  const cleanMemo = String(memo || '').trim()
  if (!cleanAddr || !rule.pattern.test(cleanAddr)) {
    return { valid: false, code: 'INVALID_ADDRESS_SYNTAX', chain: code, message: `Invalid ${rule.name} wallet address format.` }
  }
  if (rule.requiresMemo) {
    if (!cleanMemo) {
      return { valid: false, code: 'MISSING_MANDATORY_MEMO', chain: code, message: `${code} custodial transfers require a mandatory ${rule.memoName}.` }
    }
    if (rule.memoPattern && !rule.memoPattern.test(cleanMemo)) {
      return { valid: false, code: 'INVALID_MEMO_FORMAT', chain: code, message: `Invalid ${rule.memoName} format for ${code}.` }
    }
  }
  if (trustedAddress && detectAddressPoisoning(cleanAddr, trustedAddress)) {
    return {
      valid: false,
      code: 'ADDRESS_POISONING_ALERT',
      chain: code,
      message: 'CRITICAL ALERT: Candidate address matches prefix & suffix of trusted reference address while differing in middle bytes.'
    }
  }
  return { valid: true, code: 'VALID_VERIFIED', chain: code, message: `Verified valid ${rule.name} address and routing configuration.` }
}

function fastifyMultichainAddress (fastify, options, done) {
  const chainKey = options.chainField || 'chain'
  const addrKey = options.addressField || 'address'
  const memoKey = options.memoField || 'memo'
  const trustedKey = options.trustedAddressField || 'trustedAddress'

  fastify.decorate('validateCryptoAddress', validateCryptoAddress)
  fastify.decorate('detectAddressPoisoning', detectAddressPoisoning)
  fastify.decorate(' verifyCryptoAddressHook', function (req, reply, next) {
    const src = (req.body && typeof req.body === 'object') ? req.body : (req.query || {})
    const res = validateCryptoAddress(src[chainKey], src[addrKey], src[memoKey], src[trustedKey])
    if (!res.valid) {
      reply.code(400).send(res)
      return
    }
    req.cryptoAddressValidation = res
    next()
  })

  done()
}

module.exports = fp(fastifyMultichainAddress, {
  fastify: '>=4.0.0',
  name: 'fastify-multichain-address'
})
module.exports.default = fastifyMultichainAddress
module.exports.fastifyMultichainAddress = fastifyMultichainAddress
module.exports.validateCryptoAddress = validateCryptoAddress
module.exports.detectAddressPoisoning = detectAddressPoisoning
module.exports.CHAIN_RULES = CHAIN_RULES
