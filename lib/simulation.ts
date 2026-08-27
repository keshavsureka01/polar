export type Scenario = {
  blizzard: boolean;
  generatorFailure: boolean;
  initialSoc: number;
  loadBias: number;
  reserveTarget: number;
};

export type ForecastPoint = {
  hour: string;
  temperatureC: number;
  windSpeed: number;
  solarKw: number;
  windKw: number;
  renewableKw: number;
  criticalLoadKw: number;
  flexibleLoadKw: number;
  demandKw: number;
};

export type DispatchPoint = ForecastPoint & {
  dieselKw: number;
  batteryKw: number;
  curtailedKw: number;
  unmetCriticalKw: number;
  soc: number;
  fuelLiters: number;
};

export type AssetStatus = {
  name: string;
  type: "wind" | "solar" | "diesel" | "battery";
  value: string;
  detail: string;
  state: "online" | "watch" | "degraded" | "charging";
};

const BATTERY_CAPACITY_KWH = 520;
const BATTERY_MAX_KW = 170;
const DIESEL_MAX_KW = 290;
const DIESEL_FAILED_MAX_KW = 145;
const FUEL_LITERS_PER_KWH = 0.27;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wave(hour: number, phase = 0) {
  return Math.sin(((hour + phase) / 24) * Math.PI * 2);
}

export function generateForecast(scenario: Scenario): ForecastPoint[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const daylight = clamp(Math.sin(((hour - 6) / 12) * Math.PI), 0, 1);
    const stormDrag = scenario.blizzard ? 0.42 : 1;
    const demandPressure = 1 + scenario.loadBias / 100;
    const tempBase = -28 + 6 * wave(hour, -3);
    const temperatureC = scenario.blizzard ? tempBase - 12 : tempBase;
    const windSpeed = clamp(17 + 7 * wave(hour, 2) + (scenario.blizzard ? 20 : 0), 5, 44);
    const solarKw = Math.round(105 * daylight * (scenario.blizzard ? 0.2 : 0.78));
    const windKw = Math.round(clamp((windSpeed - 4) * 8.8, 0, 205) * stormDrag);
    const criticalLoadKw = Math.round((178 + 16 * wave(hour, 9) + (scenario.blizzard ? 34 : 0)) * demandPressure);
    const flexibleLoadKw = Math.round((48 + 24 * daylight + 10 * wave(hour, 15)) * demandPressure);

    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      temperatureC: Math.round(temperatureC),
      windSpeed: Math.round(windSpeed),
      solarKw,
      windKw,
      renewableKw: solarKw + windKw,
      criticalLoadKw,
      flexibleLoadKw,
      demandKw: criticalLoadKw + flexibleLoadKw
    };
  });
}

export function optimizeDispatch(forecast: ForecastPoint[], scenario: Scenario): DispatchPoint[] {
  const dieselCap = scenario.generatorFailure ? DIESEL_FAILED_MAX_KW : DIESEL_MAX_KW;
  let storedKwh = (clamp(scenario.initialSoc, 5, 100) / 100) * BATTERY_CAPACITY_KWH;

  return forecast.map((point) => {
    const reserveKwh = (scenario.reserveTarget / 100) * BATTERY_CAPACITY_KWH;
    const netDemand = point.demandKw - point.renewableKw;
    let dieselKw = 0;
    let batteryKw = 0;
    let curtailedKw = 0;
    let unmetCriticalKw = 0;

    if (netDemand > 0) {
      const availableBatteryKw = clamp(storedKwh - reserveKwh, 0, BATTERY_MAX_KW);
      const batteryToLoad = Math.min(netDemand, availableBatteryKw);
      batteryKw = batteryToLoad;
      storedKwh -= batteryToLoad;

      const remainingDemand = netDemand - batteryToLoad;
      dieselKw = Math.min(remainingDemand, dieselCap);
      const uncovered = remainingDemand - dieselKw;
      unmetCriticalKw = Math.max(0, uncovered - point.flexibleLoadKw);
    } else {
      const surplus = Math.abs(netDemand);
      const chargeRoomKw = clamp(BATTERY_CAPACITY_KWH - storedKwh, 0, BATTERY_MAX_KW);
      const chargeKw = Math.min(surplus, chargeRoomKw);
      batteryKw = -chargeKw;
      storedKwh += chargeKw * 0.92;
      curtailedKw = Math.max(0, surplus - chargeKw);
    }

    return {
      ...point,
      dieselKw: Math.round(dieselKw),
      batteryKw: Math.round(batteryKw),
      curtailedKw: Math.round(curtailedKw),
      unmetCriticalKw: Math.round(unmetCriticalKw),
      soc: Math.round((storedKwh / BATTERY_CAPACITY_KWH) * 100),
      fuelLiters: Math.round(dieselKw * FUEL_LITERS_PER_KWH)
    };
  });
}

export function getAssetStatuses(dispatch: DispatchPoint[], scenario: Scenario, liveHour: number): AssetStatus[] {
  const point = dispatch[liveHour % dispatch.length];
  const batteryState = point.batteryKw < 0 ? "charging" : point.soc < scenario.reserveTarget + 8 ? "watch" : "online";

  return [
    {
      name: "Wind Turbine String A",
      type: "wind",
      value: `${point.windKw} kW`,
      detail: scenario.blizzard ? "Output derated for icing risk" : `${point.windSpeed} m/s katabatic wind`,
      state: scenario.blizzard ? "degraded" : "online"
    },
    {
      name: "Solar PV Array",
      type: "solar",
      value: `${point.solarKw} kW`,
      detail: `${point.temperatureC} C module environment`,
      state: point.solarKw < 15 ? "watch" : "online"
    },
    {
      name: "Diesel Generator Bank",
      type: "diesel",
      value: `${point.dieselKw} kW`,
      detail: scenario.generatorFailure ? "One unit unavailable" : "N+1 standby healthy",
      state: scenario.generatorFailure ? "degraded" : point.dieselKw > 210 ? "watch" : "online"
    },
    {
      name: "Battery Energy Storage",
      type: "battery",
      value: `${point.soc}% SOC`,
      detail: point.batteryKw < 0 ? `${Math.abs(point.batteryKw)} kW charging` : `${point.batteryKw} kW discharging`,
      state: batteryState
    }
  ];
}

export function summarizeDispatch(dispatch: DispatchPoint[]) {
  const totals = dispatch.reduce(
    (acc, point) => {
      acc.fuel += point.fuelLiters;
      acc.renewables += point.renewableKw;
      acc.load += point.demandKw;
      acc.unmet += point.unmetCriticalKw;
      return acc;
    },
    { fuel: 0, renewables: 0, load: 0, unmet: 0 }
  );

  return {
    renewableShare: Math.round((totals.renewables / totals.load) * 100),
    fuelLiters: totals.fuel,
    unmetCriticalKwh: totals.unmet,
    finalSoc: dispatch[dispatch.length - 1]?.soc ?? 0
  };
}
