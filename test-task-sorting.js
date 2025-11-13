#!/usr/bin/env node

// Simple test to verify task and reward sorting works
const fs = require('fs');
const path = require('path');

const tasksFile = path.join(__dirname, 'web-app', 'data', 'tasks.json');
const rewardsFile = path.join(__dirname, 'web-app', 'data', 'rewards.json');

console.log('═══════════════════════════════════════════');
console.log('📋 Testing Data Sorting');
console.log('═══════════════════════════════════════════\n');

// === TEST TASKS ===
console.log('🎯 TASKS - Sorted by Period\n');

const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));

console.log('Current tasks order:');
tasks.forEach((task, index) => {
  console.log(`  ${index + 1}. [${task.period}] ${task.name}`);
});

// Check if sorted correctly
const periodOrder = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3 };
let tasksSorted = true;
let lastOrder = 0;

for (const task of tasks) {
  const period = task.period || task.time || 'Morning';
  const currentOrder = periodOrder[period] || 999;

  if (currentOrder < lastOrder) {
    tasksSorted = false;
    break;
  }
  lastOrder = currentOrder;
}

console.log('\n');
if (tasksSorted) {
  console.log('✅ Tasks are correctly sorted by period!');
  console.log('   Morning → Afternoon → Evening');
} else {
  console.log('❌ Tasks are NOT sorted correctly');
}

// === TEST REWARDS ===
console.log('\n═══════════════════════════════════════════');
console.log('🎁 REWARDS - Sorted by Cost\n');

const rewards = JSON.parse(fs.readFileSync(rewardsFile, 'utf8'));

console.log('Current rewards order:');
rewards.forEach((reward, index) => {
  console.log(`  ${index + 1}. [${reward.cost} pts] ${reward.name}`);
});

// Check if sorted correctly
let rewardsSorted = true;
let lastCost = 0;

for (const reward of rewards) {
  const cost = reward.cost || 0;

  if (cost < lastCost) {
    rewardsSorted = false;
    break;
  }
  lastCost = cost;
}

console.log('\n');
if (rewardsSorted) {
  console.log('✅ Rewards are correctly sorted by cost!');
  console.log('   Smallest → Largest');
} else {
  console.log('❌ Rewards are NOT sorted correctly');
}

// === SUMMARY ===
console.log('\n═══════════════════════════════════════════');
console.log('📊 SUMMARY\n');

if (tasksSorted && rewardsSorted) {
  console.log('✅ All data is correctly sorted!');
} else {
  console.log('❌ Some data needs sorting');
  console.log('   Please restart the storage server');
}

console.log('\n💡 To test automatic sorting:');
console.log('  1. Start: ./dashboard-control.sh start');
console.log('  2. Create a new Evening task or expensive reward');
console.log('  3. Check that it appears in the correct position');
console.log('═══════════════════════════════════════════');
