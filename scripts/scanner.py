"""
scripts/scanner.py — thin entrypoint for the "Market Scanner" workflow.

This used to be a misleading stub (`print("Scanner running")`) that did no real
work. It now delegates to the real stock-snapshot pipeline in fetch_stocks.py so
the workflow actually refreshes data/stocks-snapshot.json. Decision-support only:
this fetches and classifies public price data — it never places orders.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fetch_stocks import main as run_stock_pipeline


def main():
    print("Market scanner: running real stock-snapshot pipeline (fetch_stocks)...")
    run_stock_pipeline()


if __name__ == "__main__":
    main()
