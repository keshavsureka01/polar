import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from app.core.engine import dashboard, fuel_state, load_data

class BackendTests(unittest.TestCase):
    def test_synthetic_fallback_and_shape(self):
        weather, loads, renewable = load_data()
        self.assertGreaterEqual(len(weather), 24 * 30)
        self.assertEqual(len(loads), len(renewable))

    def test_energy_balance_and_battery_reserve(self):
        for scenario in ("normal", "extreme_cold", "wind_icing", "generator_failure"):
            state = dashboard(scenario)
            for row in state["dispatch"]:
                supply = row["solar_kw"] + row["wind_kw"] + row["generator_kw"] + row["battery_discharge_kw"]
                demand = row["demand_kw"] + row["battery_charge_kw"]
                self.assertAlmostEqual(supply, demand, delta=1.0, msg=f"{scenario} at {row['timestamp']}")
                self.assertGreaterEqual(row["battery_soc_percent"], 30)
                self.assertGreaterEqual(row["fuel_consumption_lph"], 0)
                self.assertAlmostEqual(sum(row["generator_outputs"].values()), row["generator_kw"], delta=0.01)

            latest = state["dispatch"][-1]
            self.assertEqual(state["energy"]["total_load_kw"], latest["demand_kw"])
            self.assertEqual(state["energy"]["diesel_generation_kw"], latest["generator_kw"])

    def test_scenarios_change_state(self):
        normal = dashboard("normal")
        failed = dashboard("generator_failure")
        cold = dashboard("extreme_cold")
        iced = dashboard("wind_icing")
        self.assertTrue(all(row["generator_outputs"]["GEN-01"] == 0 for row in failed["dispatch"]))
        self.assertGreater(cold["energy"]["total_load_kw"], normal["energy"]["total_load_kw"])
        self.assertLess(sum(row["wind_kw"] for row in iced["dispatch"]), sum(row["wind_kw"] for row in normal["dispatch"]))
        self.assertLess(failed["fuel"]["endurance_days"], normal["fuel"]["endurance_days"])

    def test_zero_burn_is_safe(self):
        self.assertIsNone(fuel_state([{"fuel_consumption_lph": 0}])["endurance_hours"])

if __name__ == "__main__":
    unittest.main()
