import * as migration_20251118_040844 from './20251118_040844';
import * as migration_20251119_151619 from './20251119_151619';

export const migrations = [
  {
    up: migration_20251118_040844.up,
    down: migration_20251118_040844.down,
    name: '20251118_040844',
  },
  {
    up: migration_20251119_151619.up,
    down: migration_20251119_151619.down,
    name: '20251119_151619'
  },
];
