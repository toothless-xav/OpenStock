import { describe, expect, it } from 'vitest';
import { getAssistantDashboardModel } from '@/lib/dashboard/assistant-board';

describe('assistant dashboard board model', () => {
  it('separates user action items, Anya-completed work, QA-needed work, and future agent slots', () => {
    const dashboard = getAssistantDashboardModel();

    expect(dashboard.userActionItems.length).toBeGreaterThanOrEqual(3);
    expect(dashboard.anyaCompletedItems.length).toBeGreaterThanOrEqual(2);
    expect(dashboard.qaVerifyItems.length).toBeGreaterThanOrEqual(2);
    expect(dashboard.agentPanel.people.map((person) => person.name)).toEqual(['tan', 'Anya']);
    expect(dashboard.agentPanel.futureSlots.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps trading overview as the active next product area', () => {
    const dashboard = getAssistantDashboardModel();

    expect(dashboard.activeFocus.slug).toBe('trading-overview');
    expect(dashboard.activeFocus.nextBuildItems).toEqual(
      expect.arrayContaining([
        expect.stringContaining('screener'),
        expect.stringContaining('mock-trade ledger'),
      ]),
    );
  });
});
