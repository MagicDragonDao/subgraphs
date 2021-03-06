import {
  MineHarvest,
  SetFee,
  UserClaim,
  UserDeposit,
  UserWithdraw,
} from "../generated/AtlasMineStaker/AtlasMineStaker";
import {
  loadDayData,
  loadDepositWithdrawEvent,
  loadStaker,
  loadWallet,
  snapshotTvl,
  updateTvl,
} from "./utils/entities";
import { DENOM_MAGIC_BD, BI_ONE, BI_NONE } from "./utils/constants";
const denom = DENOM_MAGIC_BD;

export function handleMineHarvest(event: MineHarvest): void {
  const staker = loadStaker();
  const rewards = event.params.earned.toBigDecimal().div(denom);
  const fees = event.params.feeEarned.toBigDecimal().div(denom);

  staker.earnedRewards = staker.earnedRewards.plus(rewards);
  staker.earnedFees = staker.earnedFees.plus(fees);
  updateTvl(staker);
  staker.save();

  const dayData = loadDayData(event.block.timestamp);
  dayData.earnedRewards = dayData.earnedRewards.plus(rewards);
  dayData.earnedFees = dayData.earnedFees.plus(fees);
  snapshotTvl(staker, dayData);
  dayData.save();
}

export function handleSetFee(event: SetFee): void {
  const staker = loadStaker();
  staker.fee = event.params.fee;

  staker.save();
}

export function handleUserClaim(event: UserClaim): void {
  const id = event.params.user.toHexString();
  const amount = event.params.reward.toBigDecimal().div(denom);
  const wallet = loadWallet(id, event.block.timestamp);

  wallet.claimed = wallet.claimed.plus(amount);
  wallet.save();

  const staker = loadStaker();
  staker.claimed = staker.claimed.plus(amount);
  updateTvl(staker);
  staker.save();

  const dayData = loadDayData(event.block.timestamp);
  dayData.claimed = dayData.claimed.plus(amount);
  snapshotTvl(staker, dayData);
  dayData.save();
}

export function handleUserDeposit(event: UserDeposit): void {
  const id = event.params.user.toHexString();
  const amount = event.params.amount.toBigDecimal().div(denom);
  const wallet = loadWallet(id, event.block.timestamp);

  wallet.depositCount = wallet.depositCount.plus(BI_ONE);
  wallet.deposited = wallet.deposited.plus(amount);
  wallet.save();

  const staker = loadStaker();
  staker.deposited = staker.deposited.plus(amount);
  updateTvl(staker);
  staker.save();

  const dayData = loadDayData(event.block.timestamp);
  dayData.deposited = dayData.deposited.plus(amount);
  snapshotTvl(staker, dayData);
  dayData.save();

  const depositWithdraw = loadDepositWithdrawEvent(
    event.transaction,
    event.logIndex,
    event.block
  );

  depositWithdraw.amount = event.params.amount;
  depositWithdraw.save();
}

export function handleUserWithdraw(event: UserWithdraw): void {
  const id = event.params.user.toHexString();
  const amount = event.params.amount.toBigDecimal().div(denom);
  const wallet = loadWallet(id, event.block.timestamp);

  wallet.withdrawn = wallet.withdrawn.plus(amount);
  wallet.save();

  const staker = loadStaker();
  staker.withdrawn = staker.withdrawn.plus(amount);
  updateTvl(staker);
  staker.save();

  const dayData = loadDayData(event.block.timestamp);
  dayData.withdrawn = dayData.withdrawn.plus(amount);
  snapshotTvl(staker, dayData);
  dayData.save();

  const depositWithdraw = loadDepositWithdrawEvent(
    event.transaction,
    event.logIndex,
    event.block
  );

  depositWithdraw.amount = event.params.amount.times(BI_NONE);
  depositWithdraw.save();
}
