/* eslint-env mocha */
const _ = require('lodash')

const swap = require('./swap')
const { prepare } = require('./utils')
const config = require('../src/config')

const NUM_CONCURRENT_SWAPS_PER_MARKET = 3

const AMOUNT = {
  BTC: () => _.random(...[0.05, 0.051].map(v => v * 1e8)),
  ETH: () => _.random(...[0.26, 0.27].map(v => v * 1e18)),
  DAI: () => _.random(...[5, 5.1].map(v => v * 1e18))
}

const SWAPS = Object.entries(AMOUNT).reduce((acc, [fromAsset, fromAmount]) => {
  Object.keys(AMOUNT).forEach(toAsset => {
    if (fromAsset === toAsset) return

    acc[`${fromAsset}-${toAsset}`] = new Array(NUM_CONCURRENT_SWAPS_PER_MARKET).fill(0).map(() => ({
      from: fromAsset,
      to: toAsset,
      fromAmount: fromAmount()
    }))
  })

  return acc
}, {})

const SWAPS_ARR = Object.entries(SWAPS).reduce((acc, [market, swaps]) => {
  acc.push(...swaps)
  return acc
}, [])

describe.only('Swap', () => {
  before(async function () {
    this.timeout(30000)

    await prepare()
  })

  describe('Successful single swap', () => {
    Object.keys(SWAPS).forEach(market => {
      describe(market, () => {
        before(() => {
          config.application.swapExpirationDurationInSeconds = 50
          config.application.nodeSwapExpirationDurationInSeconds = 25
        })

        swap([SWAPS[market][0]])
      })
    })
  })

  describe('Unsuccessful single swap', () => {
    Object.keys(SWAPS).forEach(market => {
      describe(market, () => {
        before(() => {
          config.application.swapExpirationDurationInSeconds = 50
          config.application.nodeSwapExpirationDurationInSeconds = 25
        })

        swap([SWAPS[market][0]], true)
      })
    })
  })

  describe('Successful concurrent swaps', () => {
    before(() => {
      config.application.swapExpirationDurationInSeconds = 400
      config.application.nodeSwapExpirationDurationInSeconds = 200
    })

    swap(SWAPS_ARR)
  })

  describe('Unsuccessful concurrent swaps', () => {
    before(() => {
      config.application.swapExpirationDurationInSeconds = 400
      config.application.nodeSwapExpirationDurationInSeconds = 200
    })

    swap(SWAPS_ARR, true)
  })
})
