import { Haptics, NotificationType } from '@capacitor/haptics';
import { SaveManager } from '@/game/managers/SaveManager';
import { ENERGY_REFILL_MS, usePlayerStore } from '@/stores/playerStore';

export class EnergyManager {
  static syncOffline(now = Date.now()): void {
    const state = usePlayerStore.getState();
    if (state.energy >= state.energyMax) return;

    let energy = state.energy;
    let nextEnergyAt = state.nextEnergyAt || now + ENERGY_REFILL_MS;

    while (energy < state.energyMax && nextEnergyAt <= now) {
      energy += 1;
      nextEnergyAt += ENERGY_REFILL_MS;
    }

    usePlayerStore.setState({
      energy,
      nextEnergyAt: energy >= state.energyMax ? now + ENERGY_REFILL_MS : nextEnergyAt
    });
  }

  static getCountdownMs(now = Date.now()): number {
    const state = usePlayerStore.getState();
    if (state.energy >= state.energyMax) return 0;
    return Math.max(0, state.nextEnergyAt - now);
  }

  static consume(actionCost = 1): boolean {
    const ok = usePlayerStore.getState().consumeEnergy(actionCost);
    if (ok) void SaveManager.save();
    return ok;
  }

  static grant(amount: number): void {
    usePlayerStore.getState().addEnergy(amount);
    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    void SaveManager.save();
  }

  static tick(now = Date.now()): boolean {
    const before = usePlayerStore.getState().energy;
    this.syncOffline(now);
    const after = usePlayerStore.getState().energy;
    if (after > before) {
      void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
      void SaveManager.save();
      return true;
    }
    return false;
  }
}
