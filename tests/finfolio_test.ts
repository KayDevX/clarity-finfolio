import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure users can create savings goals",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('finfolio', 'create-savings-goal', [
        types.uint(1000), // target
        types.uint(1640995200) // deadline
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Verify goal was created
    let goals = chain.callReadOnlyFn(
      'finfolio',
      'get-user-goals',
      [types.principal(wallet1.address)],
      wallet1.address
    );
    
    assertEquals(goals.result.expectOk().length, 1);
  },
});

Clarinet.test({
  name: "Test goal progress updates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // First create a goal
    let block = chain.mineBlock([
      Tx.contractCall('finfolio', 'create-savings-goal', [
        types.uint(1000),
        types.uint(1640995200)
      ], wallet1.address)
    ]);
    
    // Update progress
    let progressBlock = chain.mineBlock([
      Tx.contractCall('finfolio', 'update-goal-progress', [
        types.uint(0), // goal id
        types.uint(500) // amount
      ], wallet1.address)
    ]);
    
    progressBlock.receipts[0].result.expectOk();
    
    // Verify progress
    let goals = chain.callReadOnlyFn(
      'finfolio',
      'get-user-goals',
      [types.principal(wallet1.address)],
      wallet1.address
    );
    
    let firstGoal = goals.result.expectOk()[0];
    assertEquals(firstGoal.current, types.uint(500));
  },
});

Clarinet.test({
  name: "Test rewards system",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Claim daily reward
    let rewardBlock = chain.mineBlock([
      Tx.contractCall('finfolio', 'claim-daily-rewards', [], wallet1.address)
    ]);
    
    rewardBlock.receipts[0].result.expectOk();
    
    // Verify rewards
    let rewards = chain.callReadOnlyFn(
      'finfolio',
      'get-user-rewards',
      [types.principal(wallet1.address)],
      wallet1.address
    );
    
    let userRewards = rewards.result.expectOk();
    assertEquals(userRewards.points, types.uint(10)); // DAILY-BONUS
    assertEquals(userRewards.streak, types.uint(1));
  },
});

Clarinet.test({
  name: "Test goal completion rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Create goal
    chain.mineBlock([
      Tx.contractCall('finfolio', 'create-savings-goal', [
        types.uint(1000),
        types.uint(1640995200)
      ], wallet1.address)
    ]);
    
    // Complete goal
    let completionBlock = chain.mineBlock([
      Tx.contractCall('finfolio', 'update-goal-progress', [
        types.uint(0),
        types.uint(1000)
      ], wallet1.address)
    ]);
    
    completionBlock.receipts[0].result.expectOk();
    
    // Verify completion bonus
    let rewards = chain.callReadOnlyFn(
      'finfolio',
      'get-user-rewards',
      [types.principal(wallet1.address)],
      wallet1.address
    );
    
    let userRewards = rewards.result.expectOk();
    assertEquals(userRewards.points, types.uint(50)); // GOAL-COMPLETE-BONUS
  },
});
