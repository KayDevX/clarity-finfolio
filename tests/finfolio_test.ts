;; [Previous test imports and other tests remain unchanged...]

Clarinet.test({
  name: "Test rewards system with caps",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Simulate 31 days of claims to test streak cap
    for(let i = 0; i < 31; i++) {
      chain.mineBlock([]);
      let rewardBlock = chain.mineBlock([
        Tx.contractCall('finfolio', 'claim-daily-rewards', [], wallet1.address)
      ]);
      rewardBlock.receipts[0].result.expectOk();
    }
    
    // Verify rewards are capped
    let rewards = chain.callReadOnlyFn(
      'finfolio',
      'get-user-rewards',
      [types.principal(wallet1.address)],
      wallet1.address
    );
    
    let userRewards = rewards.result.expectOk();
    // Max daily points (100) * 31 days
    assertEquals(userRewards.points, types.uint(3100));
    assertEquals(userRewards.streak, types.uint(31));
  },
});

;; [Rest of the tests remain unchanged...]
