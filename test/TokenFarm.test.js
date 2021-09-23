const { assert } = require('chai')

const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n){
    return web3.utils.toWei(n,'Ether')
}

contract('TokenFarm', ([owner,investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () => {
        //load contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        //transfer dapp tokens to the farm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        //send tokens to investor
        await daiToken.transfer(investor,tokens('100'), {from: owner})
    })

    // First test to check name
    describe('Mock DAI deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    // First test to check name
    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    // First test to check name
    describe('Token Farm deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(),tokens('1000000'))
        })
    })

    describe('Farming tokens',async() => {
        it('rewards investors for staking mDai tokens',async() =>{
            let result
            //check balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor balance of mDai correct before staking')

            //stake mDai tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), {from: investor})
            await tokenFarm.stakeTokens(tokens('100'), { from: investor})

            //check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor balance of mDai correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'farm balance of mDai correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance of mDai correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result, true, 'investor staking status correct after staking')

            //Issue tokens
            await tokenFarm.issueTokens({from: owner})

            //check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Dapp balance correct after issuance')

            //ensure only owner can issue tokens
            await tokenFarm.issueTokens({from:investor}).should.be.rejected; 

            // Unstake tokens
            await tokenFarm.unstakeTokens({from:investor})

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor balance of mDai correct after unstaking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'farm balance of mDai correct after unstaking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance of mDai correct after unstaking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result, false, 'investor staking status correct after unstaking')
        })
    })


})