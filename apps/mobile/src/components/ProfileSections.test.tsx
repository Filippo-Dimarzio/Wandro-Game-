import { render, screen } from '@testing-library/react-native';
import { BADGES, DEMO_PLACES, explorerStats, REGIONS } from '@wandro/shared';
import { classTitle, CityProgress, Records, StyleBars, TrophyShelf } from './ProfileSections';

const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;
const slugs = REGIONS.map((r) => r.slug);
const found = [byId('demo-pena'), byId('demo-mouros'), byId('demo-cruz-alta')];
const stats = explorerStats(found, DEMO_PLACES, 1, slugs);
const none = explorerStats([], DEMO_PLACES, 0, slugs);

describe('profile sections', () => {
  it('names the explorer class after the favourite category', () => {
    expect(classTitle(stats)).toBe('Palace Hunter');
    expect(classTitle(none)).toBe('Fresh Explorer');
  });

  it('shows the exploring style as one bar per category, or a nudge before any discovery', async () => {
    await render(<StyleBars stats={stats} />);
    expect(screen.getByLabelText('Heritage: 2')).toBeOnTheScreen();
    await render(<StyleBars stats={none} />);
    expect(screen.getByText(/Discover a few places/)).toBeOnTheScreen();
  });

  it('lists records, including the rarest find', async () => {
    await render(<Records stats={stats} streak={4} />);
    expect(screen.getByLabelText('Discoveries: 3')).toBeOnTheScreen();
    expect(screen.getByLabelText('First finds: 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Day streak: 4')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Rarest find: Cruz Alta Viewpoint, 8 explorers'),
    ).toBeOnTheScreen();
  });

  it('shows found and total places per city', async () => {
    await render(<CityProgress stats={stats} />);
    const total = DEMO_PLACES.filter((p) => p.region === 'sintra').length;
    expect(screen.getByLabelText(`Sintra: 3 of ${total} places found`)).toBeOnTheScreen();
  });

  it('rings earned trophies by tier and shows the goal of locked ones', async () => {
    const badges = BADGES.map((b) => ({
      ...b,
      awardedAt: b.code === 'first_step' ? '2026-10-01T10:00:00Z' : null,
    }));
    await render(<TrophyShelf badges={badges} />);
    const first = BADGES.find((b) => b.code === 'first_step')!;
    const streak = BADGES.find((b) => b.code === 'streak_7')!;
    expect(screen.getByLabelText(`${first.name}, Bronze: ${first.description}`)).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`${streak.name}, locked. Goal: ${streak.description}`),
    ).toBeOnTheScreen();
  });
});
