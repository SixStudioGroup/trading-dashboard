# Daily runbook

SixQuant plans, records and reviews. Every order is placed by you at your broker.

## First time (5 minutes)

1. Open Today. Enter account value, risk per trade, brokerage and spread, then choose **Start in paper mode**.
2. Check brokerage against your broker's price list.

## Evening, after about 19:30 Sydney

1. Read the data bar. It must not say STALE.
2. Review open trades against the last close.
3. In the Trade planner, plan at most a few setups. Write the thesis and set the stop and target yourself.
4. Record the plan as Paper.

## Before the open

1. Check live price, spread and announcements at your broker. SixQuant data is delayed.
2. Decide from your written trigger. If it has gone, cancel the plan.

## After a fill or exit

Record it on Today the same day: fill price and shares, then exit price, actual fees and whether you followed the plan.

## Weekly

1. Journal > Review: plan-following first, then expectancy in R.
2. Settings > Your data: download a backup. Records exist only in this browser.

## If something looks wrong

| You see | Meaning | Do |
|---|---|---|
| Data bar says STALE | Feed is 2+ sessions behind | Plans are blocked. Run `asx-feed.yml` from Actions |
| Data bar says next update pending | Today's close has not landed | Levels may be one session old |
| Stop level breached | Last close is at or below your stop | Check the broker and act on your plan |
| Crypto snapshot STALE | Snapshot is over 24h old | Crypto plans are blocked. Run `update-crypto-snapshot.yml` |
