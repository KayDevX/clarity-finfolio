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
  name: "Test financial tip management",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Add tip
    let block = chain.mineBlock([
      Tx.contractCall('finfolio', 'add-financial-tip', [
        types.utf8("Save 20% of your income"),
        types.ascii("Savings")
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Read tip
    let tip = chain.callReadOnlyFn(
      'finfolio',
      'get-tip',
      [types.uint(0)],
      deployer.address
    );
    
    assertEquals(tip.result.expectSome().content, "Save 20% of your income");
  },
});