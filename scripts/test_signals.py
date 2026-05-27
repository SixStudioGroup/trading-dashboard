"""scripts/test_signals.py — unit tests for signal derivation logic."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import unittest
from fetch_stocks import derive_signal_state, derive_risk_state, derive_market_regime


class TestDeriveSignalState(unittest.TestCase):

    def test_breakout(self):
        self.assertEqual(derive_signal_state(2.5, 3.0, 1.8), "Breakout")

    def test_breakout_exact_boundary(self):
        self.assertEqual(derive_signal_state(2.0, 0.1, 1.5), "Breakout")

    def test_breakout_requires_positive_5d(self):
        # change1d >= 2, rel_vol >= 1.5, but change5d <= 0 → Volume Spike wins
        self.assertEqual(derive_signal_state(2.5, -0.1, 2.1), "Volume Spike")

    def test_volume_spike(self):
        self.assertEqual(derive_signal_state(0.5, -1.0, 2.5), "Volume Spike")

    def test_watch(self):
        self.assertEqual(derive_signal_state(1.0, 2.0, 1.0), "Watch")

    def test_sell_risk_1d(self):
        self.assertEqual(derive_signal_state(-2.5, 0.0, 1.0), "Sell Risk")

    def test_sell_risk_5d(self):
        self.assertEqual(derive_signal_state(0.0, -5.5, 1.0), "Sell Risk")

    def test_no_action_default(self):
        self.assertEqual(derive_signal_state(-0.5, -0.5, 0.8), "No Action")

    def test_no_action_flat(self):
        self.assertEqual(derive_signal_state(0.0, 0.0, 1.0), "No Action")

    def test_sell_risk_1d_exact_boundary(self):
        self.assertEqual(derive_signal_state(-2.0, 0.0, 1.0), "Sell Risk")

    def test_sell_risk_5d_exact_boundary(self):
        self.assertEqual(derive_signal_state(0.0, -5.0, 1.0), "Sell Risk")

    def test_volume_spike_exact_boundary(self):
        self.assertEqual(derive_signal_state(0.5, -1.0, 2.0), "Volume Spike")

    def test_sell_risk_beats_watch_on_5d(self):
        # change1d > 0 qualifies for Watch, but change5d <= -5 means Sell Risk wins
        self.assertEqual(derive_signal_state(1.0, -5.5, 1.0), "Sell Risk")


class TestDeriveRiskState(unittest.TestCase):

    def test_elevated_sell_risk(self):
        self.assertEqual(derive_risk_state(-1.0, -1.0, 1.0, "Sell Risk"), "Elevated")

    def test_elevated_large_1d_drop(self):
        self.assertEqual(derive_risk_state(-3.5, -1.0, 1.0, "No Action"), "Elevated")

    def test_elevated_large_5d_drop(self):
        self.assertEqual(derive_risk_state(-0.5, -8.0, 1.0, "Watch"), "Elevated")

    def test_elevated_exact_1d_boundary(self):
        self.assertEqual(derive_risk_state(-3.0, -1.0, 1.0, "Watch"), "Elevated")

    def test_elevated_exact_5d_boundary(self):
        self.assertEqual(derive_risk_state(-0.5, -7.0, 1.0, "Watch"), "Elevated")

    def test_review_high_relvol(self):
        self.assertEqual(derive_risk_state(0.5, 0.5, 2.5, "Watch"), "Review")

    def test_review_large_positive_1d(self):
        self.assertEqual(derive_risk_state(3.5, 1.0, 1.0, "Watch"), "Review")

    def test_normal_default(self):
        self.assertEqual(derive_risk_state(0.5, 1.0, 1.0, "Watch"), "Normal")

    def test_normal_flat(self):
        self.assertEqual(derive_risk_state(0.0, 0.0, 1.0, "No Action"), "Normal")


class TestDeriveMarketRegime(unittest.TestCase):

    def _assets(self, c1_list, c5_list, region="Australia"):
        return [{"region": region, "change1d": c1, "change5d": c5}
                for c1, c5 in zip(c1_list, c5_list)]

    def test_constructive(self):
        assets = self._assets([1]*7 + [-1]*3, [1]*7 + [-1]*3)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Constructive")

    def test_defensive(self):
        assets = self._assets([-1]*8 + [1]*2, [-1]*8 + [1]*2)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Defensive")

    def test_mixed(self):
        assets = self._assets([1]*5 + [-1]*5, [1]*5 + [-1]*5)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Mixed")

    def test_insufficient_data_under_3(self):
        assets = self._assets([1, 1], [1, 1])
        self.assertEqual(derive_market_regime(assets, "Australia"), "Insufficient Data")

    def test_all_stocks_uses_all_regions(self):
        au = self._assets([1]*5, [1]*5, "Australia")
        us = self._assets([-1]*5, [-1]*5, "U.S. Tech")
        # 5 positive, 5 negative out of 10 → Mixed
        self.assertEqual(derive_market_regime(au + us, "All Stocks"), "Mixed")

    def test_region_filters_correctly(self):
        au = self._assets([1]*5, [1]*5, "Australia")
        us = self._assets([-1]*10, [-1]*10, "U.S. Tech")
        # Australia: 5/5 positive → Constructive
        self.assertEqual(derive_market_regime(au + us, "Australia"), "Constructive")


if __name__ == "__main__":
    unittest.main()
