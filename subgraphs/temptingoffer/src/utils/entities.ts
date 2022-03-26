import { BigInt } from "@graphprotocol/graph-ts";
import { Wallet, Staker, DayData } from "../../generated/schema";
import { ADDRESS_STAKER, ID_STAKER } from "./constants";

export function loadStaker(): Staker {
  let staker = Staker.load(ID_STAKER);
  if (staker == null) {
    staker = new Staker(ID_STAKER);
    staker.save();
  }

  return staker;
}

export function loadWallet(id: string, timestamp: BigInt): Wallet {
  let wallet = Wallet.load(id);
  if (wallet == null) {
    wallet = new Wallet(id);
    wallet.save();

    const staker = loadStaker();
    staker.numStakers += 1;
    staker.numStakersAllTime += 1;
    staker.save();

    const dayData = loadDayData(timestamp);
    dayData.numStakers += 1;
    dayData.save();
  }

  return wallet;
}

export const DAY_SECONDS = 60 * 60 * 24;
export function getDate(timestamp: BigInt): number {
  return (timestamp.toI32() / DAY_SECONDS) * DAY_SECONDS;
}

export function loadDayData(timestamp: BigInt): DayData {
  const date = getDate(timestamp);
  const id = `${ADDRESS_STAKER}-${date}`;

  let data = DayData.load(id);
  if (data == null) {
    data = new DayData(id);
    data.date = date as u32;
    data.save();
  }

  return data;
}

export function updateTvl(staker: Staker): void {
  staker.tvl = staker.deposited
    .plus(staker.earnedRewards)
    .minus(staker.withdrawn)
    .minus(staker.claimed);
}
